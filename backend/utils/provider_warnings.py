"""Provider warning helpers shared by V1 and V2.

Turns an error tuple `(provider, step, exception)` into a structured warning
suitable for the frontend. Never includes secrets, API keys, or raw stack
traces; the message is human-friendly and the raw exception text is only
inspected locally to choose a code.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Tuple

# step keys (frontend-facing) -> provider that owns the step.
STEP_PROVIDER: Dict[str, str] = {
    "research": "gemini",
    "blueprint": "openai",
    "claudeBuildPrompt": "openai",
    "brandCampaign": "openai",
    "visualPrompts": "openai",
    "evaluation": "gemini",
    "graph": "langgraph",
    "orchestrator": "internal",
}

STEP_LABEL: Dict[str, str] = {
    "research": "research",
    "blueprint": "product blueprint",
    "claudeBuildPrompt": "Claude build prompt",
    "brandCampaign": "brand campaign",
    "visualPrompts": "visual prompts",
    "evaluation": "evaluation",
    "graph": "LangGraph runtime",
    "orchestrator": "orchestrator",
}


def classify_error(provider: str, exc_or_msg: Any) -> str:
    """Return a stable code for an exception or message string.

    Codes are friendly enums consumed by the frontend:
      provider_unavailable, rate_limited, quota_exceeded, billing_limit,
      permission_denied, model_unavailable, invalid_request, timeout, error.
    """
    text = str(exc_or_msg or "").lower()
    name = type(exc_or_msg).__name__ if not isinstance(exc_or_msg, str) else ""

    if name in ("PermissionDeniedError", "AuthenticationError"):
        return "permission_denied"
    if name == "RateLimitError" or "rate limit" in text or "ratelimit" in text:
        if "insufficient_quota" in text or "exceeded your current quota" in text or "billing" in text:
            return "quota_exceeded" if "insufficient_quota" in text or "quota" in text else "billing_limit"
        return "rate_limited"
    if name == "NotFoundError":
        return "model_unavailable"
    if name in ("APITimeoutError", "TimeoutError") or "timeout" in text or "timed out" in text:
        return "timeout"

    if "insufficient_quota" in text or "exceeded your current quota" in text:
        return "quota_exceeded"
    if "billing" in text or "hard limit" in text:
        return "billing_limit"
    if "403" in text or "permission" in text or "must be verified" in text or "verify" in text:
        return "permission_denied"
    if "429" in text:
        return "rate_limited"
    if "503" in text or "unavailable" in text or "high demand" in text or "overloaded" in text:
        return "provider_unavailable"
    if "404" in text or "not found" in text:
        return "model_unavailable"
    if "400" in text:
        return "invalid_request"
    return "error"


_FRIENDLY = {
    "provider_unavailable": "{provider} was temporarily unavailable, so fallback {step} was used.",
    "rate_limited": "{provider} rate-limited the request for {step}, so fallback content was used.",
    "quota_exceeded": "{provider} quota was unavailable for {step}, so fallback content was used.",
    "billing_limit": "{provider} billing limit prevented {step}; fallback content was used.",
    "permission_denied": "{provider} blocked permission for {step}; fallback content was used.",
    "model_unavailable": "The configured {provider} model was unavailable for {step}; fallback content was used.",
    "invalid_request": "{provider} rejected the {step} request; fallback content was used.",
    "timeout": "{provider} timed out on {step}; fallback content was used.",
    "error": "{provider} failed on {step}; fallback content was used.",
}


def make_warning(step: str, exc_or_msg: Any, *, provider: Optional[str] = None) -> Dict[str, str]:
    prov = provider or STEP_PROVIDER.get(step, "provider")
    code = classify_error(prov, exc_or_msg)
    label = STEP_LABEL.get(step, step)
    msg = _FRIENDLY.get(code, _FRIENDLY["error"]).format(
        provider=prov.capitalize() if prov else "Provider",
        step=label,
    )
    return {"provider": prov, "step": step, "code": code, "message": msg}


def warnings_from_errors(errors: Iterable[Dict[str, str]]) -> List[Dict[str, str]]:
    """Turn the existing `errors` list into structured `providerWarnings`."""
    out: List[Dict[str, str]] = []
    for item in errors or []:
        if not isinstance(item, dict):
            continue
        step = item.get("step") or ""
        msg = item.get("error") or ""
        if not step:
            continue
        out.append(make_warning(step, msg))
    return out


__all__ = [
    "classify_error",
    "make_warning",
    "warnings_from_errors",
]
