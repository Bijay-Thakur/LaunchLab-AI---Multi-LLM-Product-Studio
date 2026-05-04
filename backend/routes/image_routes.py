from flask import Blueprint, jsonify, request

from services.image_service import image_service

bp = Blueprint("images", __name__, url_prefix="/api/images")


_VALID_TYPES = {"heroImage", "campaignPoster", "uiMoodboard", "architectureDiagram", "socialGraphic"}
_MAX_PROMPT_LEN = 4000


@bp.post("/generate")
def generate_one():
    payload = request.get_json(silent=True) or {}
    image_type = (payload.get("type") or "").strip()
    raw_prompt = payload.get("prompt")
    if not isinstance(raw_prompt, str):
        return jsonify({"success": False, "error": "Prompt is required."}), 400
    prompt = raw_prompt.strip()

    if image_type not in _VALID_TYPES:
        return jsonify({"success": False, "error": "Unknown image type."}), 400
    if not prompt:
        return jsonify({"success": False, "error": "Prompt is required."}), 400
    if len(prompt) > _MAX_PROMPT_LEN:
        return jsonify({
            "success": False,
            "error": f"Prompt is too long (max {_MAX_PROMPT_LEN} characters).",
        }), 400

    img = image_service.generate(image_type, prompt)
    return jsonify({"success": True, "image": img})


@bp.post("/generate-all")
def generate_all():
    payload = request.get_json(silent=True) or {}
    visuals = payload.get("visualPrompts") or {}
    if not isinstance(visuals, dict):
        return jsonify({"success": False, "error": "visualPrompts must be an object."}), 400

    # Map either {heroImagePrompt: ...} (spec) or {heroImage: ...} (current frontend shape)
    aliases = {
        "heroImage": ["heroImagePrompt", "heroImage"],
        "campaignPoster": ["campaignPosterPrompt", "campaignPoster"],
        "uiMoodboard": ["uiMoodboardPrompt", "uiMoodboard"],
        "architectureDiagram": ["architectureDiagramPrompt", "architectureDiagram"],
        "socialGraphic": ["socialGraphicPrompt", "socialGraphic"],
    }
    images = []
    for image_type, keys in aliases.items():
        prompt = next((visuals[k] for k in keys if visuals.get(k)), None)
        if not prompt:
            continue
        images.append(image_service.generate(image_type, str(prompt)))
    return jsonify({"success": True, "images": images})
