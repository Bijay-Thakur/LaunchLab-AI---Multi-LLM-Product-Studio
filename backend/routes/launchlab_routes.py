from flask import Blueprint, request

from services.mock_ai_service import service
from utils.response_helpers import ok, error

bp = Blueprint("launchlab", __name__, url_prefix="/api")


@bp.get("/health")
def health():
    return ok({"status": "healthy", "service": "LaunchLab AI", "version": "0.1.0"})


@bp.get("/sample")
def sample():
    try:
        return ok(service.sample_package())
    except Exception as exc:  # demo safety
        return error(f"sample_failed: {exc}", 500)


@bp.post("/generate")
def generate():
    try:
        payload = request.get_json(silent=True) or {}
        raw_idea = payload.get("rawIdea", "")
        package = service.generate_package(raw_idea)
        return ok(package)
    except ValueError as exc:
        return error(str(exc), 400)
    except Exception as exc:
        return error(f"generate_failed: {exc}", 500)


def _per_section(handler):
    payload = request.get_json(silent=True) or {}
    raw_idea = payload.get("rawIdea", "")
    if not raw_idea.strip():
        return error("rawIdea must not be empty", 400)
    try:
        return ok(handler(raw_idea))
    except Exception as exc:
        return error(f"section_failed: {exc}", 500)


@bp.post("/research")
def research():
    return _per_section(service.research)


@bp.post("/blueprint")
def blueprint():
    return _per_section(service.blueprint)


@bp.post("/claude-prompt")
def claude_prompt():
    return _per_section(service.claude_prompt)


@bp.post("/brand")
def brand():
    return _per_section(service.brand_campaign)


@bp.post("/visual-prompts")
def visual_prompts():
    return _per_section(service.visual_prompts)


@bp.post("/evaluation")
def evaluation():
    return _per_section(service.evaluation)
