"""LangGraph node functions.

Each node:
  - reads what it needs from state,
  - calls the existing Gemini/OpenAI service wrapper,
  - normalizes the result with helpers reused from V1,
  - falls back to mock content for its step on failure,
  - appends safe error/fallback metadata,
  - returns ONLY the keys it changed (LangGraph merges into channel state).

Nothing here re-implements provider logic or prompts. V1 stays canonical.
"""

from __future__ import annotations

import json
import logging
import traceback
from typing import Any, Dict, List

from data import mock_outputs
from services.gemini_service import gemini_service, ProviderUnavailable as GeminiUnavailable
from services.openai_service import openai_service, ProviderUnavailable as OpenAIUnavailable
from services.orchestration_service import (
    normalize_brand,
    normalize_blueprint,
    normalize_evaluation,
    normalize_research,
    normalize_visuals,
)

log = logging.getLogger("launchlab.graph")


# ---------- helpers ----------

def _ensure_mock(state: Dict[str, Any]) -> Dict[str, Any]:
    """Lazily build the mock fallback package for this run."""
    mock = state.get("mock_pkg")
    if not mock:
        mock = mock_outputs.build_full_package(state.get("raw_idea") or "")
    return mock


def _append(state: Dict[str, Any], key: str, value: Any) -> List[Any]:
    items = list(state.get(key) or [])
    items.append(value)
    return items


def _record_error(state: Dict[str, Any], step: str, exc: Exception) -> Dict[str, List[Any]]:
    """Build the standard error/fallback delta, log full trace server-side."""
    log.warning("v2 node %s failed: %s\n%s", step, exc, traceback.format_exc())
    return {
        "errors": _append(state, "errors", {"step": step, "error": f"{type(exc).__name__}"}),
        "fallback_steps": _append(state, "fallback_steps", step),
    }


def _bump_nodes_run(state: Dict[str, Any], name: str) -> List[str]:
    return _append(state, "nodes_run", name)


# ---------- node functions ----------

def research_node(state: Dict[str, Any]) -> Dict[str, Any]:
    mock = _ensure_mock(state)
    nodes_run = _bump_nodes_run(state, "research_node")
    delta: Dict[str, Any] = {"nodes_run": nodes_run, "mock_pkg": mock}
    try:
        raw = gemini_service.research(state.get("raw_idea") or "")
        if raw is None:
            raise RuntimeError("research returned no parseable output")
        delta["research"] = normalize_research(raw, mock["research"])
        return delta
    except (GeminiUnavailable, Exception) as exc:
        delta.update(_record_error(state, "research", exc))
        delta["research"] = mock["research"]
        return delta


def product_architect_node(state: Dict[str, Any]) -> Dict[str, Any]:
    mock = _ensure_mock(state)
    nodes_run = _bump_nodes_run(state, "product_architect_node")
    delta: Dict[str, Any] = {"nodes_run": nodes_run, "mock_pkg": mock}
    try:
        raw = openai_service.blueprint(state.get("raw_idea") or "", state.get("research") or {})
        if raw is None:
            raise RuntimeError("blueprint returned no parseable output")
        delta["blueprint"] = normalize_blueprint(raw, mock["blueprint"])
        return delta
    except (OpenAIUnavailable, Exception) as exc:
        delta.update(_record_error(state, "blueprint", exc))
        delta["blueprint"] = mock["blueprint"]
        return delta


def prompt_engineer_node(state: Dict[str, Any]) -> Dict[str, Any]:
    mock = _ensure_mock(state)
    nodes_run = _bump_nodes_run(state, "prompt_engineer_node")
    delta: Dict[str, Any] = {"nodes_run": nodes_run, "mock_pkg": mock}
    try:
        out = openai_service.claude_prompt(
            state.get("blueprint") or {}, state.get("research") or {}
        )
        if not isinstance(out, str) or not out.strip():
            raise RuntimeError("claude prompt empty or non-string")
        delta["claude_build_prompt"] = out
        return delta
    except (OpenAIUnavailable, Exception) as exc:
        delta.update(_record_error(state, "claudeBuildPrompt", exc))
        delta["claude_build_prompt"] = mock["claudeBuildPrompt"]
        return delta


def campaign_strategist_node(state: Dict[str, Any]) -> Dict[str, Any]:
    mock = _ensure_mock(state)
    nodes_run = _bump_nodes_run(state, "campaign_strategist_node")
    delta: Dict[str, Any] = {"nodes_run": nodes_run, "mock_pkg": mock}
    try:
        raw = openai_service.brand_campaign(
            state.get("blueprint") or {}, state.get("research") or {}
        )
        if raw is None:
            raise RuntimeError("brand campaign returned no parseable output")
        delta["brand_campaign"] = normalize_brand(raw, mock["brandCampaign"])
        return delta
    except (OpenAIUnavailable, Exception) as exc:
        delta.update(_record_error(state, "brandCampaign", exc))
        delta["brand_campaign"] = mock["brandCampaign"]
        return delta


def visual_prompt_designer_node(state: Dict[str, Any]) -> Dict[str, Any]:
    mock = _ensure_mock(state)
    nodes_run = _bump_nodes_run(state, "visual_prompt_designer_node")
    delta: Dict[str, Any] = {"nodes_run": nodes_run, "mock_pkg": mock}
    try:
        raw = openai_service.visual_prompts(
            state.get("blueprint") or {}, state.get("brand_campaign") or {}
        )
        if raw is None:
            raise RuntimeError("visual prompts returned no parseable output")
        delta["visual_prompts"] = normalize_visuals(raw, mock["visualPrompts"])
        return delta
    except (OpenAIUnavailable, Exception) as exc:
        delta.update(_record_error(state, "visualPrompts", exc))
        delta["visual_prompts"] = mock["visualPrompts"]
        return delta


def evaluation_judge_node(state: Dict[str, Any]) -> Dict[str, Any]:
    mock = _ensure_mock(state)
    nodes_run = _bump_nodes_run(state, "evaluation_judge_node")
    delta: Dict[str, Any] = {"nodes_run": nodes_run, "mock_pkg": mock}
    summary = json.dumps(
        {
            "rawIdea": state.get("raw_idea") or "",
            "research": state.get("research"),
            "blueprint": state.get("blueprint"),
            "brandCampaign": state.get("brand_campaign"),
            "visualPrompts": state.get("visual_prompts"),
        },
        ensure_ascii=False,
    )[:8000]
    try:
        raw = gemini_service.evaluation(summary)
        if raw is None:
            raise RuntimeError("evaluation returned no parseable output")
        delta["evaluation"] = normalize_evaluation(raw, mock["evaluation"])
        return delta
    except (GeminiUnavailable, Exception) as exc:
        delta.update(_record_error(state, "evaluation", exc))
        delta["evaluation"] = mock["evaluation"]
        return delta


# Node names exported for the builder + frontend. Suffixed with `_node` so
# they cannot collide with state keys (LangGraph forbids that collision).
NODE_NAMES = [
    "research_node",
    "product_architect_node",
    "prompt_engineer_node",
    "campaign_strategist_node",
    "visual_prompt_designer_node",
    "evaluation_judge_node",
]
