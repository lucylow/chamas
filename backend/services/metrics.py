"""
Prometheus metrics instrumentation for the Chamas voice pipeline.
"""

from __future__ import annotations

from prometheus_client import Counter, Gauge, Histogram

# Request metrics
voice_requests = Counter("voice_requests_total", "Total voice requests", ["status"])
asr_latency = Histogram("asr_latency_seconds", "ASR processing time")
llm_latency = Histogram("llm_latency_seconds", "LLM generation time")
tts_latency = Histogram("tts_latency_seconds", "TTS synthesis time")

# Model health metrics
asr_wer = Gauge("asr_wer", "Current WER of ASR model")
intent_accuracy = Gauge("intent_accuracy", "Intent classification accuracy")
session_active = Gauge("sessions_active", "Active sessions")




