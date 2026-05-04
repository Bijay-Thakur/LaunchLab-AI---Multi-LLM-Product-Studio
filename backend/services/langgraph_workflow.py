"""Version 2 - LangGraph workflow runner.

This module is the only thing the v2 Flask route depends on. It:
  1. Compiles the LangGraph (lazy, optional dependency).
  2. Invokes it with the user's raw idea.
  3. Normalizes the resulting state into the same response shape Version 1
     returns, plus a few v2-only fields (`version`, `workflowMode`,
     `fallbackSteps`, `graphMetadata`).
  4. Falls back to the V1 manual orchestration tagged as v2 mock-fallback if
     LangGraph is unavailable or the graph itself blows up - the frontend
     therefore always gets a usable package.
"""

from __future__ import annotations

import logging
import traceback
from typing import Any, Dict

from data import mock_outputs
from graph.builder import GRAPH_EDGES, LangGraphUnavailable, build_compiled_graph
from graph.nodes import NODE_NAMES
from services.gemini_service import gemini_service
from services.openai_service import openai_service
from services.orchestration_service import generate_package as v1_generate_package
from utils.provider_warnings import warnings_from_errors

log = logging.getLogger("launchlab.langgraph")

TOTAL_STEPS = 6  # number of LLM-bearing nodes


def _state_to_response(state: Dict[str, Any], raw_idea: str) -> Dict[str, Any]:
    mock = state.get("mock_pkg") or mock_outputs.build_full_package(raw_idea)
    fallback_steps = list(state.get("fallback_steps") or [])
    errors = list(state.get("errors") or [])
    nodes_run = list(state.get("nodes_run") or [])

    live_steps = max(0, TOTAL_STEPS - len(fallback_steps))
    if live_steps == TOTAL_STEPS:
        mode = "live"
    elif live_steps == 0:
        mode = "mock-fallback"
    else:
        mode = "partial-fallback"

    return {
        "success": True,
        "version": "v2",
        "workflowMode": "langgraph",
        "rawIdea": raw_idea,
        "research": state.get("research") or mock["research"],
        "blueprint": state.get("blueprint") or mock["blueprint"],
        "claudeBuildPrompt": state.get("claude_build_prompt") or mock["claudeBuildPrompt"],
        "brandCampaign": state.get("brand_campaign") or mock["brandCampaign"],
        "visualPrompts": state.get("visual_prompts") or mock["visualPrompts"],
        "evaluation": state.get("evaluation") or mock["evaluation"],
        "workflow": mock["workflow"],
        "mode": mode,
        "errors": errors,
        "fallbackSteps": fallback_steps,
        "providerWarnings": warnings_from_errors(errors),
        "liveSteps": live_steps,
        "totalSteps": TOTAL_STEPS,
        "graphMetadata": {
            "graphType": "sequential-langgraph",
            "description": "LangGraph state-based orchestration (sequential)",
            "nodes": NODE_NAMES,
            "edges": GRAPH_EDGES,
            "nodesRun": nodes_run,
        },
    }


def _v1_as_v2_fallback(raw_idea: str, *, reason: str) -> Dict[str, Any]:
    """Run the V1 manual orchestrator and re-tag the response as v2.

    Used when the LangGraph dependency or graph compilation itself fails. The
    user still gets a complete demo package, and we surface a clear error
    summary.
    """
    log.warning("v2 falling back to manual orchestrator: %s", reason)
    pkg = v1_generate_package(raw_idea)
    pkg["success"] = True
    pkg["version"] = "v2"
    pkg["workflowMode"] = "langgraph"
    # Force mock-fallback mode label so the frontend banner reflects reality.
    pkg["mode"] = "mock-fallback"
    pkg["fallbackSteps"] = list({*pkg.get("fallbackSteps", []), "graph"})
    errors = list(pkg.get("errors") or [])
    errors.append({"step": "graph", "error": reason})
    pkg["errors"] = errors
    pkg["providerWarnings"] = warnings_from_errors(errors)
    pkg["graphMetadata"] = {
        "graphType": "sequential-langgraph",
        "description": "LangGraph unavailable - ran manual orchestrator and tagged as v2.",
        "nodes": NODE_NAMES,
        "edges": GRAPH_EDGES,
        "nodesRun": [],
    }
    return pkg


def run_workflow(raw_idea: str) -> Dict[str, Any]:
    raw_idea = (raw_idea or "").strip()
    if not raw_idea:
        raise ValueError("rawIdea must not be empty")

    try:
        app = build_compiled_graph()
    except LangGraphUnavailable as exc:
        return _v1_as_v2_fallback(raw_idea, reason=f"langgraph_unavailable: {exc}")
    except Exception as exc:  # pragma: no cover
        log.error("graph build failed: %s\n%s", exc, traceback.format_exc())
        return _v1_as_v2_fallback(raw_idea, reason=f"graph_build_failed: {type(exc).__name__}")

    initial_state: Dict[str, Any] = {
        "raw_idea": raw_idea,
        "errors": [],
        "fallback_steps": [],
        "nodes_run": [],
        "metadata": {
            "providers": {
                "gemini": gemini_service.available(),
                "openai": openai_service.available(),
            },
        },
    }

    try:
        final_state = app.invoke(initial_state)
    except Exception as exc:  # pragma: no cover
        log.error("graph invoke failed: %s\n%s", exc, traceback.format_exc())
        return _v1_as_v2_fallback(raw_idea, reason=f"graph_invoke_failed: {type(exc).__name__}")

    return _state_to_response(final_state, raw_idea)
