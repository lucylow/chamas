"""
FastAPI orchestration layer for the Chamas voice pipeline.
"""

from __future__ import annotations

import gzip
import logging
import tempfile
import time
import uuid
from pathlib import Path
from typing import AsyncIterator, Dict, Optional
from urllib.parse import quote

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, ValidationError, validator
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from blockchain.chama_client import ChamaClient, ChamaSummary
from services.asr_service import ASRService, TranscriptionResult
from services.llm_service import LLMService
from services.memory_service import ContextMemory
from services.metrics import (
    asr_latency,
    asr_wer,
    intent_accuracy,
    llm_latency,
    session_active,
    tts_latency,
    voice_requests,
)
from services.security import decrypt_session, encrypt_session, is_cipher_ready
from services.tts_service import TTSService

logger = logging.getLogger("chamas.voice")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Chamas Voice API", version="0.1.0")

limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://chamas.lovable.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Tafadhali jaribu tena baada ya muda mfupi."},
    )


class VoiceUpload(BaseModel):
    file: bytes = Field(..., max_length=5 * 1024 * 1024)
    session_id: Optional[str] = Field(
        default=None,
        regex=r"^[a-f0-9\-]{36}$",
        description="UUID v4 session identifier",
    )
    language: str = Field(default="sw", regex=r"^(sw|en)$")

    @validator("file")
    def validate_audio(cls, value: bytes) -> bytes:
        if not value:
            raise ValueError("Empty audio payload")
        if not (
            value.startswith(b"RIFF")
            or value.startswith(b"OggS")
            or value.startswith(b"ID3")
            or value[0:2] == b"\xff\xf3"
        ):
            raise ValueError("Invalid audio format")
        return value


def get_asr() -> ASRService:
    return ASRService()


def get_llm() -> LLMService:
    return LLMService()


def get_tts() -> TTSService:
    return TTSService()


def get_memory() -> ContextMemory:
    return ContextMemory()


def get_chama_client() -> ChamaClient:
    return ChamaClient()


@app.post("/voice/process")
async def process_voice(
    file: UploadFile = File(...),
    session_id: Optional[str] = None,
    asr: ASRService = Depends(get_asr),
    llm: LLMService = Depends(get_llm),
    tts: TTSService = Depends(get_tts),
    memory: ContextMemory = Depends(get_memory),
    chama: ChamaClient = Depends(get_chama_client),
) -> StreamingResponse:
    if not asr.is_ready:
        raise HTTPException(status_code=503, detail="ASR service is not ready.")
    if not llm.is_ready:
        raise HTTPException(status_code=503, detail="LLM service is not ready.")
    if not tts.is_ready:
        raise HTTPException(status_code=503, detail="TTS service is not ready.")

    tmp_path = await _save_temp_file(file)

    try:
        transcription = asr.transcribe(tmp_path)
        logger.info("ASR => %s", transcription.text)

        session = session_id or str(uuid.uuid4())

        context = memory.recent_context(session)
        intent = _extract_intent(transcription.text)
        chama_info = await _resolve_intent(intent=intent, chama_client=chama)

        ai_response = _render_response(
            transcription=transcription,
            context=context,
            intent=intent,
            chama_info=chama_info,
            llm=llm,
        )

        memory.append_turn(
            session_id=session,
            user_text=transcription.text,
            ai_text=ai_response,
            dialect=transcription.dialect,
        )
        memory.append_intent(session_id=session, intent=intent, confidence=0.85)

        audio_bytes = tts.synthesise(ai_response)
        headers = {
            "X-Session-ID": session,
            "X-Intent": intent,
            "X-Dialect": transcription.dialect,
            "X-Confidence": f"{transcription.confidence:.2f}",
            "X-Response-Text": quote(ai_response),
            "X-Transcript": quote(transcription.text),
        }

        logger.info("LLM <= %s", ai_response)

        return StreamingResponse(_iter_audio(audio_bytes), media_type="audio/mpeg", headers=headers)
    finally:
        tmp_path.unlink(missing_ok=True)


async def _save_temp_file(upload: UploadFile) -> Path:
    suffix = Path(upload.filename or "audio.wav").suffix or ".wav"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    content = await upload.read()
    tmp.write(content)
    tmp.close()
    return Path(tmp.name)


def _render_response(
    transcription: TranscriptionResult,
    context: str,
    intent: str,
    chama_info: Optional[ChamaSummary],
    llm: LLMService,
) -> str:
    if intent == "check_balance" and chama_info is not None:
        return (
            f"Kwa sasa chama {chama_info.name} kina wanachama {chama_info.members} "
            f"na michango ya {chama_info.contribution} ETH. Je, ungependa kuchangia sasa?"
        )

    return llm.generate(
        user_text=transcription.text,
        context=context,
        dialect=transcription.dialect,
    )


def _extract_intent(text: str) -> str:
    lowered = text.lower()
    if any(keyword in lowered for keyword in ("jiunge", "join")):
        return "join_chama"
    if any(keyword in lowered for keyword in ("mchango", "contribute", "changia")):
        return "contribute"
    if any(keyword in lowered for keyword in ("akiba", "balance", "salio", "salio")):
        return "check_balance"
    return "general_query"


async def _resolve_intent(intent: str, chama_client: ChamaClient) -> Optional[ChamaSummary]:
    if intent != "check_balance":
        return None
    if not chama_client.is_ready:
        return None
    try:
        return await chama_client.get_chama(1)
    except Exception as exc:
        logger.warning("Failed to fetch chama info: %s", exc)
        return None


def _iter_audio(payload: bytes) -> AsyncIterator[bytes]:
    async def generator() -> AsyncIterator[bytes]:
        yield payload

    return generator()


@app.get("/health")
async def health(
    asr: ASRService = Depends(get_asr),
    llm: LLMService = Depends(get_llm),
    tts: TTSService = Depends(get_tts),
    chama: ChamaClient = Depends(get_chama_client),
) -> Dict[str, object]:
    chama_ok = chama.is_ready and await chama.healthcheck()
    return {
        "asr": asr.is_ready,
        "llm": llm.is_ready,
        "tts": tts.is_ready,
        "chama": chama_ok,
    }


