"""Gemini provider. Used for research + evaluation steps.

Uses the current `google-genai` SDK (the older `google-generativeai` package
was deprecated by Google in 2025).

Robust to model deprecations: if the configured model returns 404 NOT_FOUND
(Google has been retiring older Gemini models with this exact error), the
service automatically retries against a known-good current model.
"""

import logging
import os
import time
from typing import Optional

from utils.json_helpers import parse_json
from prompts.gemini_prompts import research_prompt, evaluation_prompt

log = logging.getLogger("launchlab.gemini")

# Models known to work for new keys as of 2026-05. Order matters: we try the
# user's configured model first, then walk down this fallback chain on 404.
_FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
]


class ProviderUnavailable(Exception):
    pass


class GeminiService:
    def __init__(self) -> None:
        self._client = None
        self._model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        self._api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self._timeout_ms = int(float(os.environ.get("GEMINI_TIMEOUT", "45")) * 1000)
        self._working_model: Optional[str] = None  # cached after first success

    def available(self) -> bool:
        return bool(self._api_key)

    def _ensure_client(self):
        if self._client is not None:
            return self._client
        if not self.available():
            raise ProviderUnavailable("GEMINI_API_KEY missing")
        try:
            from google import genai  # type: ignore
            from google.genai import types  # type: ignore
        except ImportError as exc:
            raise ProviderUnavailable(f"google-genai not installed: {exc}")
        self._client = genai.Client(
            api_key=self._api_key,
            http_options=types.HttpOptions(timeout=self._timeout_ms),
        )
        return self._client

    def _candidate_models(self) -> list[str]:
        """User's configured model first, then fallback chain (deduped)."""
        if self._working_model:
            return [self._working_model]
        seen = set()
        ordered = []
        for m in [self._model_name, *_FALLBACK_MODELS]:
            if m and m not in seen:
                seen.add(m)
                ordered.append(m)
        return ordered

    # Transient overload markers from the Gemini API (high-demand 503s, etc.).
    _TRANSIENT_MARKERS = ("503", "UNAVAILABLE", "high demand", "overloaded", "deadline")

    def _is_transient(self, msg: str) -> bool:
        m = msg.lower()
        return any(tok.lower() in m for tok in self._TRANSIENT_MARKERS)

    def _generate_json(self, prompt: str) -> Optional[dict]:
        client = self._ensure_client()
        from google.genai import types  # type: ignore

        last_exc: Optional[Exception] = None
        max_retries = 2  # total attempts per model = 1 + max_retries
        for model in self._candidate_models():
            for attempt in range(max_retries + 1):
                try:
                    resp = client.models.generate_content(
                        model=model,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.7,
                        ),
                    )
                    text = getattr(resp, "text", None) or ""
                    self._working_model = model  # remember what worked
                    return parse_json(text)
                except Exception as exc:
                    msg = str(exc)
                    # 404 = model not visible; switch to next candidate.
                    if "404" in msg or "NOT_FOUND" in msg:
                        log.info("gemini model %s unavailable, trying next: %s", model, msg[:140])
                        last_exc = exc
                        break  # exit retry loop, advance to next model
                    # Transient (503/overloaded/deadline): brief exponential backoff.
                    if self._is_transient(msg) and attempt < max_retries:
                        sleep = 0.75 * (2 ** attempt)
                        log.info(
                            "[provider-retry] provider=gemini model=%s attempt=%d sleep=%.2fs",
                            model, attempt + 1, sleep,
                        )
                        time.sleep(sleep)
                        continue
                    # Non-retryable, or out of retries: bubble up.
                    raise
        # All candidates exhausted by 404s
        if last_exc is not None:
            raise last_exc
        return None

    def research(self, raw_idea: str) -> Optional[dict]:
        return self._generate_json(research_prompt(raw_idea))

    def evaluation(self, package_summary: str) -> Optional[dict]:
        return self._generate_json(evaluation_prompt(package_summary))


gemini_service = GeminiService()
