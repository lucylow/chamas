"""
Encryption helpers for sensitive session identifiers.
"""

from __future__ import annotations

import os
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

_cipher: Optional[Fernet] = None
_raw_key = os.getenv("ENCRYPTION_KEY")

if _raw_key:
    try:
        _cipher = Fernet(_raw_key)
    except Exception:  # pragma: no cover - invalid configuration
        _cipher = None


def is_cipher_ready() -> bool:
    return _cipher is not None


def encrypt_session(session_id: str) -> str:
    if not session_id:
        return session_id
    if _cipher is None:
        return session_id
    return _cipher.encrypt(session_id.encode("utf-8")).decode("utf-8")


def decrypt_session(token: Optional[str]) -> Optional[str]:
    if token is None:
        return None
    if _cipher is None:
        return token
    try:
        return _cipher.decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return token




