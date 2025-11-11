"""
Swahili text-to-speech service.

Uses Google Cloud Text-to-Speech when credentials are available, and falls back
to the open source ``coqui-tts`` pipeline if Google Cloud credentials have not
been configured. The service exposes a single ``synthesise`` method that
returns raw MP3 bytes ready to stream back to the client.
"""

from __future__ import annotations

import io
import os
from typing import Optional

try:
    from google.cloud import texttospeech  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    texttospeech = None

try:
    from TTS.api import TTS  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    TTS = None


DEFAULT_VOICE = "sw-KE-Standard-A"


class TTSService:
    def __init__(
        self,
        voice_name: str = DEFAULT_VOICE,
        speaking_rate: float = 0.95,
    ) -> None:
        self._voice_name = voice_name
        self._speaking_rate = speaking_rate

        self._gcloud_client = None
        self._coqui_pipeline = None

        if texttospeech is not None and os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            self._gcloud_client = texttospeech.TextToSpeechClient()

        if self._gcloud_client is None and TTS is not None:
            try:
                self._coqui_pipeline = TTS(model_name="tts_models/sw/cv/vits")  # type: ignore[call-arg]
            except Exception:
                self._coqui_pipeline = None

    @property
    def is_ready(self) -> bool:
        return bool(self._gcloud_client or self._coqui_pipeline)

    def synthesise(self, text: str) -> bytes:
        if not text.strip():
            raise ValueError("Cannot synthesise empty text.")

        if self._gcloud_client is not None:
            return self._synthesise_google(text=text)

        if self._coqui_pipeline is not None:
            return self._synthesise_coqui(text=text)

        raise RuntimeError(
            "Hakuna injini ya TTS iliyo tayari. Weka kitambulisho cha Google Cloud "
            "au weka coqui-tts kabla ya kuendelea."
        )

    def _synthesise_google(self, text: str) -> bytes:
        assert self._gcloud_client is not None  # for type checkers

        request = texttospeech.SynthesizeSpeechRequest(  # type: ignore[attr-defined]
            input=texttospeech.SynthesisInput(text=text),  # type: ignore[attr-defined]
            voice=texttospeech.VoiceSelectionParams(  # type: ignore[attr-defined]
                language_code="sw-KE",
                name=self._voice_name,
            ),
            audio_config=texttospeech.AudioConfig(  # type: ignore[attr-defined]
                audio_encoding=texttospeech.AudioEncoding.MP3,  # type: ignore[attr-defined]
                speaking_rate=self._speaking_rate,
            ),
        )
        response = self._gcloud_client.synthesize_speech(request=request)
        return response.audio_content  # type: ignore[return-value]

    def _synthesise_coqui(self, text: str) -> bytes:
        assert self._coqui_pipeline is not None

        buffer = io.BytesIO()
        self._coqui_pipeline.tts_to_file(text=text, file_path=buffer)  # type: ignore[attr-defined]
        return buffer.getvalue()


