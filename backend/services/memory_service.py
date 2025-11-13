"""
Redis-backed short-term memory for keeping conversational context.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    redis = None


class ContextMemory:
    def __init__(self, redis_url: Optional[str] = None, ttl_seconds: int = 3600) -> None:
        self._ttl = ttl_seconds
        self._client = None
        self._enabled = False

        redis_url = redis_url or os.getenv("REDIS_URL")
        if redis_url and redis is not None:
            try:
                self._client = redis.from_url(redis_url, decode_responses=True)
                self._enabled = True
            except Exception:
                self._client = None
                self._enabled = False

    @property
    def is_ready(self) -> bool:
        return self._enabled and self._client is not None

    def append_turn(self, session_id: str, user_text: str, ai_text: str, dialect: str) -> None:
        if not self.is_ready:
            return

        turn = {
            "user": user_text,
            "ai": ai_text,
            "dialect": dialect,
            "ts": datetime.utcnow().isoformat(),
        }
        key = self._turns_key(session_id)
        assert self._client is not None
        self._client.lpush(key, json.dumps(turn))
        self._client.ltrim(key, 0, 9)
        self._client.expire(key, self._ttl)

    def recent_context(self, session_id: str, limit: int = 5) -> str:
        if not self.is_ready:
            return ""

        key = self._turns_key(session_id)
        assert self._client is not None
        data = self._client.lrange(key, 0, limit - 1)
        snippets: List[str] = []
        for entry in reversed(data):
            try:
                payload: Dict[str, str] = json.loads(entry)
                snippets.append(f"Mtumiaji: {payload['user']}\nAI: {payload['ai']}")
            except Exception:
                continue
        return "\n".join(snippets)

    def append_intent(self, session_id: str, intent: str, confidence: float) -> None:
        if not self.is_ready:
            return

        payload = {
            "intent": intent,
            "confidence": confidence,
            "ts": datetime.utcnow().isoformat(),
        }
        key = self._intent_key(session_id)
        assert self._client is not None
        self._client.lpush(key, json.dumps(payload))
        self._client.ltrim(key, 0, 19)
        self._client.expire(key, self._ttl)

    def intents(self, session_id: str) -> List[Dict[str, object]]:
        if not self.is_ready:
            return []

        key = self._intent_key(session_id)
        assert self._client is not None
        entries = self._client.lrange(key, 0, -1)
        parsed: List[Dict[str, object]] = []
        for entry in entries:
            try:
                parsed.append(json.loads(entry))
            except Exception:
                continue
        return parsed

    def _turns_key(self, session_id: str) -> str:
        return f"session:{session_id}:turns"

    def _intent_key(self, session_id: str) -> str:
        return f"session:{session_id}:intents"




