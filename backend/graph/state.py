"""Shared state schema for the LangGraph workflow.

We use TypedDict (LangGraph's recommended state container). Each node returns
a partial dict and LangGraph merges it into the channel state. Lists are
re-emitted as full lists by the nodes to keep the merge behavior obvious.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

try:
    from typing import TypedDict
except ImportError:  # pragma: no cover - py<3.8
    from typing_extensions import TypedDict  # type: ignore


class LaunchLabGraphState(TypedDict, total=False):
    # Inputs
    raw_idea: str

    # Per-node outputs (frontend-compatible shape)
    research: Optional[Dict[str, Any]]
    blueprint: Optional[Dict[str, Any]]
    claude_build_prompt: Optional[str]
    brand_campaign: Optional[Dict[str, Any]]
    visual_prompts: Optional[Dict[str, Any]]
    evaluation: Optional[Dict[str, Any]]

    # Static workflow map (copied from mock package for frontend compatibility)
    workflow: List[Dict[str, Any]]

    # Run metadata
    mode: str                   # "live" | "partial-fallback" | "mock-fallback"
    errors: List[Dict[str, str]]
    fallback_steps: List[str]
    nodes_run: List[str]
    metadata: Dict[str, Any]

    # Internal: cached mock package for fallback substitution. Not returned to
    # the frontend.
    mock_pkg: Dict[str, Any]
