"""Version 2 - LangGraph workflow Flask route.

Mirrors the V1 contract on /api/generate so the frontend renders v1 and v2
packages with the same components. Adds v2-only fields under a stable shape.
"""

from __future__ import annotations

import logging
import traceback

from flask import Blueprint, jsonify, request

from services.langgraph_workflow import run_workflow
from services.mock_ai_service import service as mock_service
from utils.provider_warnings import warnings_from_errors
from utils.response_helpers import ok

bp = Blueprint("langgraph", __name__, url_prefix="/api/v2")

log = logging.getLogger("launchlab.langgraph_route")

_MAX_IDEA_LEN = 5000


@bp.post("/run-workflow")
def run_v2_workflow():
    payload = request.get_json(silent=True) or {}
    raw_value = payload.get("rawIdea")
    if not isinstance(raw_value, str):
        return jsonify({"success": False, "error": "Raw idea is required."}), 400
    raw_idea = raw_value.strip()
    if not raw_idea:
        return jsonify({"success": False, "error": "Raw idea is required."}), 400
    if len(raw_idea) > _MAX_IDEA_LEN:
        return jsonify({
            "success": False,
            "error": f"Raw idea is too long (max {_MAX_IDEA_LEN} characters).",
        }), 400

    try:
        pkg = run_workflow(raw_idea)
        return ok(pkg)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception as exc:
        # Last-resort: return a tagged mock package so the demo never breaks.
        log.error("v2 run failed: %s\n%s", exc, traceback.format_exc())
        try:
            pkg = mock_service.generate_package(raw_idea)
            errors = [{"step": "graph", "error": f"{type(exc).__name__}"}]
            pkg.update({
                "success": True,
                "version": "v2",
                "workflowMode": "langgraph",
                "mode": "mock-fallback",
                "errors": errors,
                "providerWarnings": warnings_from_errors(errors),
                "fallbackSteps": ["graph"],
                "liveSteps": 0,
                "totalSteps": 6,
                "graphMetadata": {
                    "graphType": "sequential-langgraph",
                    "description": "LangGraph runtime failed; mock fallback served.",
                    "nodes": [],
                    "edges": [],
                    "nodesRun": [],
                },
            })
            return ok(pkg)
        except Exception:
            return jsonify(
                {"success": False, "error": "v2 generation failed and fallback unavailable."}
            ), 500
