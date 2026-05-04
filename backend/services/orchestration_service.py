"""Manual multi-LLM orchestration. No LangChain. No LangGraph.

Pipeline:
  raw idea
    -> Gemini research
    -> OpenAI blueprint
    -> OpenAI Claude build prompt
    -> OpenAI brand & campaign
    -> OpenAI visual prompts
    -> Gemini evaluation

Each step is wrapped in try/except. If a step fails (no API key, timeout,
malformed JSON, network error), the orchestrator substitutes the existing
mock content for that step and continues. The frontend's existing schema is
the canonical shape; model output is normalized into it.
"""

import json
import logging
import traceback
from typing import Optional

from data import mock_outputs
from services.gemini_service import gemini_service, ProviderUnavailable as GeminiUnavailable
from services.openai_service import openai_service, ProviderUnavailable as OpenAIUnavailable

log = logging.getLogger("launchlab.orchestrator")


# ---------- normalization helpers (model schema -> frontend schema) ----------

def _as_list(value, fallback=None):
    if value is None:
        return list(fallback or [])
    if isinstance(value, list):
        return [str(v) for v in value if v is not None]
    return [str(value)]


def _as_str(value, fallback: str = "") -> str:
    if value is None:
        return fallback
    if isinstance(value, str):
        return value.strip() or fallback
    return str(value)


def normalize_research(raw: Optional[dict], fallback: dict) -> dict:
    if not isinstance(raw, dict):
        return fallback
    problem = raw.get("problemValidation")
    if isinstance(problem, str):
        problem_list = [s.strip() for s in problem.split("\n") if s.strip()]
        if not problem_list:
            problem_list = fallback["problemValidation"]
        summary = problem
    elif isinstance(problem, list):
        problem_list = [str(s) for s in problem]
        summary = " ".join(problem_list)[:600]
    else:
        problem_list = fallback["problemValidation"]
        summary = fallback["summary"]

    return {
        "summary": _as_str(raw.get("summary"), summary),
        "problemValidation": problem_list,
        "targetUsers": _as_list(raw.get("targetUsers"), fallback["targetUsers"]),
        "painPoints": _as_list(
            raw.get("userPainPoints") or raw.get("painPoints"),
            fallback["painPoints"],
        ),
        "existingSolutions": _as_list(
            raw.get("existingSolutions"), fallback["existingSolutions"]
        ),
        "marketGap": _as_str(raw.get("marketGap"), fallback["marketGap"]),
        "ethicalConcerns": _as_list(
            raw.get("ethicalConcerns"), fallback["ethicalConcerns"]
        ),
        "recommendedMvp": _as_str(
            raw.get("recommendedMvpDirection") or raw.get("recommendedMvp"),
            fallback["recommendedMvp"],
        ),
    }


def _coerce_features(features, fallback):
    if not features:
        return fallback
    out = []
    for f in features:
        if isinstance(f, dict) and "name" in f:
            out.append(
                {
                    "name": _as_str(f.get("name")),
                    "description": _as_str(f.get("description"), ""),
                }
            )
        elif isinstance(f, str):
            # Try to split "Name - Description" or "Name: Description"
            for sep in [" - ", ": ", " — "]:
                if sep in f:
                    name, desc = f.split(sep, 1)
                    out.append({"name": name.strip(), "description": desc.strip()})
                    break
            else:
                out.append({"name": f.strip(), "description": ""})
    return out or fallback


def normalize_blueprint(raw: Optional[dict], fallback: dict) -> dict:
    if not isinstance(raw, dict):
        return fallback
    return {
        "productName": _as_str(raw.get("productName"), fallback["productName"]),
        "onelinePitch": _as_str(
            raw.get("oneLinePitch") or raw.get("onelinePitch"),
            fallback["onelinePitch"],
        ),
        "targetUsers": _as_list(raw.get("targetUsers"), fallback["targetUsers"]),
        "coreFeatures": _coerce_features(raw.get("coreFeatures"), fallback["coreFeatures"]),
        "userJourney": _as_list(raw.get("userJourney"), fallback["userJourney"]),
        "mvpScope": _as_list(raw.get("mvpScope"), fallback["mvpScope"]),
        "pagesNeeded": _as_list(raw.get("pagesNeeded"), fallback["pagesNeeded"]),
        "successMetrics": _as_list(raw.get("successMetrics"), fallback["successMetrics"]),
    }


def normalize_brand(raw: Optional[dict], fallback: dict) -> dict:
    if not isinstance(raw, dict):
        return fallback
    cta = raw.get("ctaCopy") or raw.get("ctaPrimary") or fallback["ctaPrimary"]
    return {
        "brandName": _as_str(raw.get("brandName"), fallback["brandName"]),
        "tagline": _as_str(raw.get("tagline"), fallback["tagline"]),
        "mission": _as_str(raw.get("mission"), fallback["mission"]),
        "heroHeadline": _as_str(raw.get("heroHeadline"), fallback["heroHeadline"]),
        "heroSubheadline": _as_str(
            raw.get("heroSubheadline"), fallback["heroSubheadline"]
        ),
        "ctaPrimary": _as_str(cta, fallback["ctaPrimary"]),
        "ctaSecondary": _as_str(
            raw.get("ctaSecondary"), fallback["ctaSecondary"]
        ),
        "posterCopy": _as_str(raw.get("posterCopy"), fallback["posterCopy"]),
        "socialCaption": _as_str(
            raw.get("socialMediaCaption") or raw.get("socialCaption"),
            fallback["socialCaption"],
        ),
        "launchAnnouncement": _as_str(
            raw.get("launchAnnouncement"), fallback["launchAnnouncement"]
        ),
        "voiceAndTone": _as_list(raw.get("voiceAndTone"), fallback["voiceAndTone"]),
    }


def normalize_visuals(raw: Optional[dict], fallback: dict) -> dict:
    if not isinstance(raw, dict):
        return fallback
    return {
        "heroImage": _as_str(
            raw.get("heroImagePrompt") or raw.get("heroImage"), fallback["heroImage"]
        ),
        "campaignPoster": _as_str(
            raw.get("campaignPosterPrompt") or raw.get("campaignPoster"),
            fallback["campaignPoster"],
        ),
        "uiMoodboard": _as_str(
            raw.get("uiMoodboardPrompt") or raw.get("uiMoodboard"),
            fallback["uiMoodboard"],
        ),
        "architectureDiagram": _as_str(
            raw.get("architectureDiagramPrompt") or raw.get("architectureDiagram"),
            fallback["architectureDiagram"],
        ),
    }


def _coerce_score(value, default: int) -> int:
    """Accept 0-10 or 0-100. Always return 0-100 to match the existing UI."""
    try:
        n = float(value)
    except (TypeError, ValueError):
        return default
    if n <= 10:
        n = n * 10
    n = max(0, min(100, round(n)))
    return int(n)


def normalize_evaluation(raw: Optional[dict], fallback: dict) -> dict:
    if not isinstance(raw, dict):
        return fallback
    fb_scores = fallback["scores"]
    raw_scores = raw.get("scores") or {}
    scores = {
        "productMarketFit": _coerce_score(
            raw_scores.get("productMarketFit"), fb_scores["productMarketFit"]
        ),
        "userEmpathy": _coerce_score(
            raw_scores.get("userEmpathy"), fb_scores["userEmpathy"]
        ),
        "technicalFeasibility": _coerce_score(
            raw_scores.get("technicalFeasibility"), fb_scores["technicalFeasibility"]
        ),
        "ethicalSafety": _coerce_score(
            raw_scores.get("ethicalSafety"), fb_scores["ethicalSafety"]
        ),
        "accessibility": _coerce_score(
            raw_scores.get("accessibility"), fb_scores["accessibility"]
        ),
        "campaignQuality": _coerce_score(
            raw_scores.get("campaignQuality"), fb_scores["campaignQuality"]
        ),
        "overallReadiness": _coerce_score(
            raw_scores.get("overallReadiness"), fb_scores["overallReadiness"]
        ),
    }
    return {
        "scores": scores,
        "strengths": _as_list(raw.get("strengths"), fallback["strengths"]),
        "weaknesses": _as_list(raw.get("weaknesses"), fallback["weaknesses"]),
        "recommendedImprovements": _as_list(
            raw.get("recommendedImprovements"), fallback["recommendedImprovements"]
        ),
        "judgeNotes": _as_str(
            raw.get("finalVerdict") or raw.get("judgeNotes"), fallback["judgeNotes"]
        ),
    }


# ---------- step runner ----------

def _run_step(name: str, fn, fallback, errors: list):
    try:
        result = fn()
        if result is None:
            raise RuntimeError("model returned no parseable output")
        return result, True
    except (GeminiUnavailable, OpenAIUnavailable) as exc:
        log.warning(
            "[provider-warning] step=%s code=provider_unavailable fallback=true",
            name,
        )
        errors.append({"step": name, "error": f"provider unavailable: {exc}"})
        return fallback, False
    except Exception as exc:
        # Log full trace server-side, return a safe summary to the caller
        log.warning("step %s failed: %s\n%s", name, exc, traceback.format_exc())
        log.warning(
            "[provider-warning] step=%s code=%s fallback=true",
            name,
            type(exc).__name__,
        )
        errors.append({"step": name, "error": f"{type(exc).__name__}: {exc}"})
        return fallback, False


# ---------- public entrypoint ----------

def generate_package(raw_idea: str) -> dict:
    idea = (raw_idea or "").strip()
    if not idea:
        raise ValueError("rawIdea must not be empty")

    # Build a parallel mock package up front. We use it for fallbacks and for the
    # workflow map (which is static).
    mock_pkg = mock_outputs.build_full_package(idea)
    errors: list = []
    live_steps = 0
    total_steps = 6

    # 1. Gemini research
    research_raw, ok_r = _run_step(
        "research",
        lambda: gemini_service.research(idea),
        None,
        errors,
    )
    research = normalize_research(research_raw, mock_pkg["research"]) if ok_r else mock_pkg["research"]
    live_steps += int(ok_r)

    # 2. OpenAI blueprint
    blueprint_raw, ok_b = _run_step(
        "blueprint",
        lambda: openai_service.blueprint(idea, research),
        None,
        errors,
    )
    blueprint = normalize_blueprint(blueprint_raw, mock_pkg["blueprint"]) if ok_b else mock_pkg["blueprint"]
    live_steps += int(ok_b)

    # 3. OpenAI Claude build prompt
    claude_prompt, ok_c = _run_step(
        "claudeBuildPrompt",
        lambda: openai_service.claude_prompt(blueprint, research),
        mock_pkg["claudeBuildPrompt"],
        errors,
    )
    if not isinstance(claude_prompt, str) or not claude_prompt.strip():
        claude_prompt = mock_pkg["claudeBuildPrompt"]
        ok_c = False
    live_steps += int(ok_c)

    # 4. OpenAI brand & campaign
    brand_raw, ok_br = _run_step(
        "brandCampaign",
        lambda: openai_service.brand_campaign(blueprint, research),
        None,
        errors,
    )
    brand = normalize_brand(brand_raw, mock_pkg["brandCampaign"]) if ok_br else mock_pkg["brandCampaign"]
    live_steps += int(ok_br)

    # 5. OpenAI visual prompts
    visuals_raw, ok_v = _run_step(
        "visualPrompts",
        lambda: openai_service.visual_prompts(blueprint, brand),
        None,
        errors,
    )
    visuals = normalize_visuals(visuals_raw, mock_pkg["visualPrompts"]) if ok_v else mock_pkg["visualPrompts"]
    live_steps += int(ok_v)

    # 6. Gemini evaluation
    package_summary = json.dumps(
        {
            "rawIdea": idea,
            "research": research,
            "blueprint": blueprint,
            "brandCampaign": brand,
            "visualPrompts": visuals,
        },
        ensure_ascii=False,
    )[:8000]

    evaluation_raw, ok_e = _run_step(
        "evaluation",
        lambda: gemini_service.evaluation(package_summary),
        None,
        errors,
    )
    evaluation = (
        normalize_evaluation(evaluation_raw, mock_pkg["evaluation"]) if ok_e else mock_pkg["evaluation"]
    )
    live_steps += int(ok_e)

    if live_steps == total_steps:
        mode = "live"
    elif live_steps == 0:
        mode = "mock-fallback"
    else:
        mode = "partial-fallback"

    return {
        "rawIdea": idea,
        "research": research,
        "blueprint": blueprint,
        "claudeBuildPrompt": claude_prompt,
        "brandCampaign": brand,
        "visualPrompts": visuals,
        "evaluation": evaluation,
        "workflow": mock_pkg["workflow"],
        "mode": mode,
        "errors": errors,
        "liveSteps": live_steps,
        "totalSteps": total_steps,
    }


def provider_status() -> dict:
    from services.image_service import image_service

    return {
        "gemini": gemini_service.available(),
        "openai": openai_service.available(),
        "images": image_service.available(),
    }
