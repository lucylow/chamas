"""
Speech-to-text service built around OpenAI Whisper with Swahili-first defaults.

The implementation keeps dependencies optional so the backend can still boot
even when heavy models are unavailable in the current environment. Callers
should check ``is_ready`` before attempting transcription and fall back to
text-based input when necessary.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional

try:
    import torch  # type: ignore
    import whisper  # type: ignore
except Exception:  # pragma: no cover - whisper is optional at runtime
    torch = None
    whisper = None


SWAHILI_KEYWORDS = {
    "sheng": {
        "words": (
            "msee",
            "safi",
            "ganji",
            "mambo",
            "kitu",
            "kuomoka",
            "ndege",
        ),
    },
    "kiamu": {
        "words": (
            "wawu",
            "mwenyewe",
            "mwenyewe",
            "pwapwa",
        ),
    },
}


@dataclass
class TranscriptionResult:
    text: str
    confidence: float
    dialect: str
    raw: Dict[str, object]


class ASRService:
    """
    Thin wrapper around Whisper. For the hackathon we default to the ``base``
    checkpoint which balances accuracy with inference speed.
    """

    def __init__(
        self,
        model_size: str = "base",
        language: str = "sw",
        suppress_initial_prompt: bool = True,
    ) -> None:
        self._language = language
        self._model = None
        self._suppress_initial_prompt = suppress_initial_prompt

        if whisper is None:
            return

        device = "cuda" if torch and torch.cuda.is_available() else "cpu"  # type: ignore[union-attr]
        self._model = whisper.load_model(model_size, device=device)

    @property
    def is_ready(self) -> bool:
        return self._model is not None

    def transcribe(self, audio_path: Path, dialect_hint: Optional[str] = None) -> TranscriptionResult:
        if self._model is None:
            raise RuntimeError(
                "Whisper model not initialised. Install the 'whisper' dependency or "
                "provide a custom ASR backend."
            )

        result = self._model.transcribe(  # type: ignore[union-attr]
            str(audio_path),
            language=self._language,
            task="transcribe",
            temperature=0.0,
            initial_prompt=None if self._suppress_initial_prompt else "",
        )

        text = result.get("text", "").strip()
        confidence = self._extract_confidence(result)
        dialect = self._detect_dialect(text, fallback=dialect_hint)

        return TranscriptionResult(
            text=text,
            confidence=confidence,
            dialect=dialect,
            raw=result,
        )

    @staticmethod
    def _extract_confidence(result: Dict[str, object]) -> float:
        segments = result.get("segments")
        if isinstance(segments, list) and segments:
            confidences = [
                float(segment.get("avg_logprob", 0.0)) for segment in segments if isinstance(segment, dict)
            ]
            if confidences:
                # Convert average log probability to a loose 0-1 scale
                avg_logprob = sum(confidences) / len(confidences)
                return max(0.0, min(1.0, 1 + avg_logprob))
        return 0.5

    @staticmethod
    def _detect_dialect(text: str, fallback: Optional[str] = None) -> str:
        lowered = text.lower()
        for dialect, data in SWAHILI_KEYWORDS.items():
            if any(keyword in lowered for keyword in data["words"]):
                return dialect
        return fallback or "kiswahili_sanifu"


