from flask import Blueprint, jsonify, request

from services.mock_ai_service import service as mock_service
from services.orchestration_service import generate_package, provider_status
from utils.provider_warnings import warnings_from_errors
from utils.response_helpers import ok, error

bp = Blueprint("launchlab", __name__, url_prefix="/api")


@bp.get("/health")
def health():
    providers = provider_status()
    mode = "real-api-ready" if any(providers.values()) else "mock-only"
    return jsonify(
        {
            "status": "ok",
            "service": "LaunchLab AI",
            "version": "0.2.0",
            "mode": mode,
            "providers": providers,
        }
    )


@bp.get("/sample")
def sample():
    try:
        pkg = mock_service.sample_package()
        pkg.update({"mode": "mock-fallback", "errors": [], "liveSteps": 0, "totalSteps": 6})
        return ok(pkg)
    except Exception as exc:
        return error(f"sample_failed: {exc}", 500)


_MAX_IDEA_LEN = 5000


@bp.post("/generate")
def generate():
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
        pkg = generate_package(raw_idea)
        pkg["success"] = True
        pkg["providerWarnings"] = warnings_from_errors(pkg.get("errors") or [])
        return ok(pkg)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception as exc:
        # Last-resort mock fallback so the demo never breaks
        try:
            pkg = mock_service.generate_package(raw_idea)
            errors = [{"step": "orchestrator", "error": f"{type(exc).__name__}"}]
            pkg.update(
                {
                    "success": True,
                    "mode": "mock-fallback",
                    "errors": errors,
                    "providerWarnings": warnings_from_errors(errors),
                    "liveSteps": 0,
                    "totalSteps": 6,
                }
            )
            return ok(pkg)
        except Exception:
            return jsonify(
                {"success": False, "error": "Generation failed and fallback unavailable."}
            ), 500
