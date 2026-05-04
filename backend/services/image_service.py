"""OpenAI image generation. Server-side only.

Returns a structured result regardless of success/failure so callers never crash.

Output shape (always):
    {
        "type": str,
        "title": str,
        "prompt": str,
        "imageUrl": str | None,
        "imageBase64": str | None,
        "status": "generated" | "permission_denied" | "rate_limited"
                | "model_unavailable" | "invalid_request" | "timeout"
                | "fallback" | "error",
        "message": str,
        # legacy alias kept for older frontends:
        "error": str | None,
    }

The frontend should treat any status != "generated" as a graceful fallback and
keep showing the prompt. Raw provider error details are NEVER returned to the
frontend; they are logged server-side only.
"""

from __future__ import annotations

import logging
import os
from typing import Tuple

log = logging.getLogger("launchlab.image")


SAFETY_SUFFIX = (
    " Professional, classroom-safe visual style. No real-world brand logos, "
    "no copyrighted characters, no real people, no medical/legal/financial claims, "
    "no sensitive personal data."
)

TITLES = {
    "heroImage": "Hero Image",
    "campaignPoster": "Campaign Poster",
    "uiMoodboard": "UI Moodboard",
    "architectureDiagram": "Architecture Diagram",
    "socialGraphic": "Social Graphic",
}

# User-facing messages keyed by status. Never include provider stack traces.
_MESSAGES = {
    "generated": "Image generated successfully.",
    "disabled": (
        "Image generation is disabled for demo safety. "
        "The prompt is ready to copy and use manually."
    ),
    "permission_denied": (
        "Image generation is not enabled for this OpenAI account or model yet. "
        "The prompt is still available for manual generation."
    ),
    "rate_limited": (
        "Image generation is rate-limited right now. Try again in a moment. "
        "The prompt is still available for manual generation."
    ),
    "quota_exceeded": (
        "OpenAI quota was unavailable for image generation. "
        "The prompt is still available for manual generation."
    ),
    "billing_limit": (
        "OpenAI image billing limit was reached. Prompt-only mode is active. "
        "The prompt is ready to copy and use manually."
    ),
    "model_unavailable": (
        "The configured image model is unavailable. "
        "The prompt is still available for manual generation."
    ),
    "invalid_request": (
        "The image request was rejected as invalid. "
        "The prompt is still available for manual generation."
    ),
    "timeout": (
        "Image generation timed out. "
        "The prompt is still available for manual generation."
    ),
    "fallback": (
        "Image generation is unavailable for this account/model. "
        "The prompt is still available for manual generation."
    ),
    "error": (
        "Image generation failed. "
        "The prompt is still available for manual generation."
    ),
}


def _truthy(v: str | None) -> bool:
    return (v or "").strip().lower() in ("1", "true", "yes", "on")


def _result(image_type: str, prompt: str, status: str, *,
            image_url=None, image_b64=None) -> dict:
    msg = _MESSAGES.get(status, _MESSAGES["error"])
    return {
        "type": image_type,
        "title": TITLES.get(image_type, image_type),
        "prompt": prompt,
        "imageUrl": image_url,
        "imageBase64": image_b64,
        "status": status,
        "message": msg,
        # legacy alias for older frontend code paths
        "error": None if status == "generated" else msg,
    }


def _safe_prompt(prompt: str) -> str:
    p = (prompt or "").strip()
    if not p:
        return ""
    if SAFETY_SUFFIX.strip() not in p:
        p = f"{p}\n\n{SAFETY_SUFFIX.strip()}"
    return p[:3500]  # OpenAI image prompts have length limits


def _classify(exc: Exception) -> str:
    """Map an OpenAI/transport exception to one of our public status strings.

    Never expose `exc` content downstream. We only inspect type and message
    locally to choose a friendly status; the message returned to the user is
    always one of the canned strings in _MESSAGES.
    """
    name = type(exc).__name__
    text = str(exc).lower()

    # OpenAI SDK v1+ exposes named subclasses. Match by class name to avoid
    # importing them at module load (keeps the service degradable when SDK
    # is missing).
    if name in ("PermissionDeniedError", "AuthenticationError"):
        return "permission_denied"
    if name == "RateLimitError":
        return "rate_limited"
    if name == "NotFoundError":
        return "model_unavailable"
    if name == "BadRequestError":
        # The most common cause in production is an unverified org being
        # blocked from gpt-image-1 - OpenAI returns this as 400 with text
        # like "must be verified". Billing hard-limit can also surface as 400.
        if "billing" in text or "hard limit" in text:
            return "billing_limit"
        if "insufficient_quota" in text or "exceeded your current quota" in text:
            return "quota_exceeded"
        if "verified" in text or "permission" in text or "not allowed" in text:
            return "permission_denied"
        return "invalid_request"
    if name in ("APITimeoutError", "TimeoutError"):
        return "timeout"

    # Fallback string-based heuristics for older SDKs / wrapped exceptions.
    if "billing" in text or "hard limit" in text:
        return "billing_limit"
    if "insufficient_quota" in text or "exceeded your current quota" in text:
        return "quota_exceeded"
    if "403" in text or "permission" in text or "must be verified" in text or "verify" in text:
        return "permission_denied"
    if "429" in text or "rate limit" in text:
        return "rate_limited"
    if "404" in text or "not found" in text:
        return "model_unavailable"
    if "timeout" in text or "timed out" in text:
        return "timeout"
    return "error"


class ImageService:
    def __init__(self) -> None:
        self._client = None
        self._model = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-1")
        self._size = os.environ.get("OPENAI_IMAGE_SIZE", "1024x1024")
        self._timeout_s = float(os.environ.get("OPENAI_IMAGE_TIMEOUT", "60"))
        self._api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        # Hard kill-switch for the demo. Default OFF so paid quota cannot be
        # burned accidentally during a class run.
        self._enabled = _truthy(os.environ.get("ENABLE_IMAGE_GENERATION"))

    def enabled(self) -> bool:
        return self._enabled

    def available(self) -> bool:
        # "Available" now requires both an API key AND the feature flag.
        return bool(self._api_key) and self._enabled

    def _ensure_client(self):
        if self._client is not None:
            return self._client
        if not self.available():
            raise RuntimeError("OPENAI_API_KEY missing")
        try:
            from openai import OpenAI  # type: ignore
        except ImportError as exc:
            raise RuntimeError(f"openai package not installed: {exc}")
        self._client = OpenAI(api_key=self._api_key, timeout=self._timeout_s)
        return self._client

    def generate(self, image_type: str, prompt: str) -> dict:
        clean = _safe_prompt(prompt)
        if not clean:
            return _result(image_type, prompt or "", "invalid_request")
        if not self._enabled:
            log.info(
                "[image-disabled] type=%s reason=ENABLE_IMAGE_GENERATION=false",
                image_type,
            )
            return _result(image_type, prompt, "disabled")
        if not self._api_key:
            return _result(image_type, prompt, "fallback")

        try:
            client = self._ensure_client()
            resp = client.images.generate(
                model=self._model,
                prompt=clean,
                size=self._size,
                n=1,
            )
            data = resp.data[0] if getattr(resp, "data", None) else None
            url = getattr(data, "url", None) if data else None
            b64 = getattr(data, "b64_json", None) if data else None
            if url:
                return _result(image_type, prompt, "generated", image_url=url)
            if b64:
                return _result(
                    image_type, prompt, "generated",
                    image_b64=f"data:image/png;base64,{b64}",
                )
            return _result(image_type, prompt, "error")
        except Exception as exc:
            status = _classify(exc)
            # Server-side log only. Includes type + truncated message for ops;
            # never returned to the caller.
            log.warning(
                "image generation failed for %s [model=%s status=%s]: %s: %s",
                image_type,
                self._model,
                status,
                type(exc).__name__,
                str(exc)[:200],
            )
            return _result(image_type, prompt, status)


image_service = ImageService()
