"""Helpers for parsing model output as JSON safely."""

import json
import re
from typing import Any, Optional


_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE | re.MULTILINE)


def strip_fences(text: str) -> str:
    if not text:
        return ""
    cleaned = _FENCE_RE.sub("", text.strip())
    # If still wrapped, find first { ... last }
    first = cleaned.find("{")
    last = cleaned.rfind("}")
    if first != -1 and last != -1 and last > first:
        candidate = cleaned[first : last + 1]
        return candidate
    return cleaned


def parse_json(text: str) -> Optional[Any]:
    """Parse model output to JSON. Returns None if not parseable."""
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        pass
    try:
        return json.loads(strip_fences(text))
    except Exception:
        return None
