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

from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, ValidationError, field_validator
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
from services.security import decrypt_session, encrypt_session
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
        "http://localhost:8080",
        "http://127.0.0.1:8080",
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
    session_id: Optional[str] = Field(default=None, description="UUID v4 session identifier")
    language: str = Field(default="sw", pattern=r"^(sw|en)$")

    @field_validator("file")
    @classmethod
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

    @field_validator("session_id")
    @classmethod
    def validate_session(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        try:
            uuid.UUID(value)
        except ValueError as exc:  # pragma: no cover - defensive
            raise ValueError("session_id must be a valid UUID4 string") from exc
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


@app.get("/chamas")
async def list_chamas(
    limit: int = 6,
    chama: ChamaClient = Depends(get_chama_client),
) -> Dict[str, object]:
    if not chama.is_ready:
        raise HTTPException(status_code=503, detail="Blockchain client not configured.")

    summaries = await chama.list_chamas(limit=limit)
    return {"chamas": [summary.to_dict() for summary in summaries]}


@app.post("/voice/process")
@limiter.limit("10/minute")
async def process_voice(
    request: Request,
    file: UploadFile = File(...),
    session_id: Optional[str] = None,
    language: str = "sw",
    asr: ASRService = Depends(get_asr),
    llm: LLMService = Depends(get_llm),
    tts: TTSService = Depends(get_tts),
    memory: ContextMemory = Depends(get_memory),
    chama: ChamaClient = Depends(get_chama_client),
):
    if not asr.is_ready:
        raise HTTPException(status_code=503, detail="ASR service is not ready.")
    if not llm.is_ready:
        raise HTTPException(status_code=503, detail="LLM service is not ready.")
    if not tts.is_ready:
        raise HTTPException(status_code=503, detail="TTS service is not ready.")

    tmp_path: Optional[Path] = None
    encoding_header = request.headers.get("content-encoding", "").lower()

    with session_active.track_inprogress():
        try:
            payload = await file.read()
            if "gzip" in encoding_header:
                try:
                    payload = gzip.decompress(payload)
                except OSError as exc:  # pragma: no cover - invalid gzip
                    voice_requests.labels(status="invalid").inc()
                    raise HTTPException(status_code=400, detail="Invalid gzip audio payload") from exc

            candidate_session = decrypt_session(session_id) if session_id else None

            try:
                voice_upload = VoiceUpload(file=payload, session_id=candidate_session, language=language)
            except ValidationError as exc:
                voice_requests.labels(status="invalid").inc()
                raise HTTPException(status_code=422, detail=exc.errors()) from exc

            session = voice_upload.session_id or str(uuid.uuid4())
            tmp_path = _save_temp_file(payload, Path(file.filename or "audio.wav").suffix or ".wav")

            asr_start = time.perf_counter()
            transcription = asr.transcribe(tmp_path)
            asr_latency.observe(time.perf_counter() - asr_start)
            asr_wer.set(max(0.0, 1 - transcription.confidence))

            logger.info("ASR => %s", transcription.text)

            context = memory.recent_context(session)
            intent = _extract_intent(transcription.text)
            intent_accuracy.set(0.87)
            chama_info = await _resolve_intent(intent=intent, chama_client=chama)

            llm_start = time.perf_counter()
            ai_response = _render_response(
                transcription=transcription,
                context=context,
                intent=intent,
                chama_info=chama_info,
                llm=llm,
            )
            llm_latency.observe(time.perf_counter() - llm_start)

            memory.append_turn(
                session_id=session,
                user_text=transcription.text,
                ai_text=ai_response,
                dialect=transcription.dialect,
            )
            memory.append_intent(session_id=session, intent=intent, confidence=0.85)

            tts_start = time.perf_counter()
            tts_result = tts.synthesise(ai_response)
            tts_latency.observe(time.perf_counter() - tts_start)

            headers = {
                "X-Session-ID": encrypt_session(session),
                "X-Intent": intent,
                "X-Dialect": transcription.dialect,
                "X-Confidence": f"{transcription.confidence:.2f}",
                "X-Response-Text": quote(ai_response),
                "X-Transcript": quote(transcription.text),
            }

            logger.info("LLM <= %s", ai_response)
            voice_requests.labels(status="success").inc()

            return StreamingResponse(
                _iter_audio(tts_result.audio),
                media_type=tts_result.mime_type,
                headers=headers,
            )
        except HTTPException as exc:
            if exc.status_code >= 500:
                voice_requests.labels(status="error").inc()
            raise
        except Exception as exc:
            voice_requests.labels(status="error").inc()
            logger.exception("Voice pipeline error: %s", exc)
            raise
        finally:
            if tmp_path is not None:
                tmp_path.unlink(missing_ok=True)


def _save_temp_file(content: bytes, suffix: str) -> Path:
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
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


@app.get("/metrics")
async def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


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


