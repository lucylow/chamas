"""
Swahili text-to-speech service.

Uses Google Cloud Text-to-Speech when credentials are available, and falls back
to the open source ``coqui-tts`` pipeline if Google Cloud credentials have not
been configured. The service exposes a single ``synthesise`` method that
returns the generated audio bytes together with an appropriate MIME type so the
caller can stream the response straight to the browser.
"""

from __future__ import annotations

import os
import tempfile
from dataclasses import dataclass
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


@dataclass
class TTSResult:
    audio: bytes
    mime_type: str


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

    def synthesise(self, text: str) -> TTSResult:
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

    def _synthesise_google(self, text: str) -> TTSResult:
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
        return TTSResult(audio=response.audio_content, mime_type="audio/mpeg")  # type: ignore[arg-type]

    def _synthesise_coqui(self, text: str) -> TTSResult:
        assert self._coqui_pipeline is not None

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            self._coqui_pipeline.tts_to_file(text=text, file_path=tmp_path)  # type: ignore[attr-defined]
            with open(tmp_path, "rb") as audio_file:
                data = audio_file.read()
        finally:
            try:
                os.remove(tmp_path)
            except FileNotFoundError:
                pass

        return TTSResult(audio=data, mime_type="audio/wav")


