"""Build the LangGraph for Version 2.

Sequential graph (deterministic, no agentic branching). Kept linear on
purpose so the class demo can compare it 1:1 against Version 1's manual
pipeline.
"""

from __future__ import annotations

from .nodes import (
    campaign_strategist_node,
    evaluation_judge_node,
    product_architect_node,
    prompt_engineer_node,
    research_node,
    visual_prompt_designer_node,
)
from .state import LaunchLabGraphState


class LangGraphUnavailable(RuntimeError):
    """Raised when the langgraph package is not installed."""


def build_compiled_graph():
    """Return a compiled LangGraph app.

    Imports langgraph lazily so the rest of the backend keeps working when the
    optional dependency is missing.
    """
    try:
        from langgraph.graph import StateGraph, START, END  # type: ignore
    except ImportError as exc:  # pragma: no cover
        raise LangGraphUnavailable(f"langgraph not installed: {exc}") from exc

    # IMPORTANT: LangGraph forbids a node name from matching a state key.
    # State has a "research" key, so the node is called "research_node".
    # All nodes use the *_node suffix for consistency.
    g = StateGraph(LaunchLabGraphState)
    g.add_node("research_node", research_node)
    g.add_node("product_architect_node", product_architect_node)
    g.add_node("prompt_engineer_node", prompt_engineer_node)
    g.add_node("campaign_strategist_node", campaign_strategist_node)
    g.add_node("visual_prompt_designer_node", visual_prompt_designer_node)
    g.add_node("evaluation_judge_node", evaluation_judge_node)

    g.add_edge(START, "research_node")
    g.add_edge("research_node", "product_architect_node")
    g.add_edge("product_architect_node", "prompt_engineer_node")
    g.add_edge("prompt_engineer_node", "campaign_strategist_node")
    g.add_edge("campaign_strategist_node", "visual_prompt_designer_node")
    g.add_edge("visual_prompt_designer_node", "evaluation_judge_node")
    g.add_edge("evaluation_judge_node", END)

    return g.compile()


# Sequential edge list, exported for the frontend WorkflowMap tab.
GRAPH_EDGES = [
    ("START", "research_node"),
    ("research_node", "product_architect_node"),
    ("product_architect_node", "prompt_engineer_node"),
    ("prompt_engineer_node", "campaign_strategist_node"),
    ("campaign_strategist_node", "visual_prompt_designer_node"),
    ("visual_prompt_designer_node", "evaluation_judge_node"),
    ("evaluation_judge_node", "END"),
]
