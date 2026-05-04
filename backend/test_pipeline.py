"""Quick correctness tests for the LaunchLab AI orchestration pipeline.

Run from backend/:  python test_pipeline.py

Uses mocking to simulate Gemini and OpenAI responses (good JSON, bad JSON,
provider unavailable, exception). Asserts:
- normalization maps the spec'd model schema -> frontend schema
- per-step fallback works (mode = partial-fallback)
- full mock-fallback works (no keys)
- shape matches frontend types

This file should be deleted before committing if you want to keep it out of git.
"""

import json
import os
import sys
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def banner(name: str) -> None:
    print(f"\n=== {name} ===")


# ----------------------------------------------------------------------------
# Test fixtures
# ----------------------------------------------------------------------------

GEMINI_RESEARCH_GOOD = {
    "problemValidation": "Problem is real and severe. 3 datapoints support it.",
    "targetUsers": ["Indie filmmakers", "Film students", "First-time directors"],
    "userPainPoints": [
        "Hard to find local crew",
        "No trust signal for collaborators",
        "Discovery is fragmented across DMs",
    ],
    "existingSolutions": ["Mandy.com - dated UX", "Stage32 - too noisy", "Local FB groups"],
    "marketGap": "No verified, location-aware collaborator network for indie scale.",
    "ethicalConcerns": ["Verification must not exclude underrepresented creators"],
    "recommendedMvpDirection": "Verified profiles + project board + local search.",
}

OPENAI_BLUEPRINT_GOOD = {
    "productName": "ReelCrew",
    "oneLinePitch": "ReelCrew connects indie filmmakers with verified local collaborators in days.",
    "targetUsers": ["Indie directors", "Film students", "Production designers"],
    "coreFeatures": [
        "Verified profiles",
        "Project board",
        "Local search",
        "Reel showcase",
        "Inbox",
    ],
    "userJourney": ["Sign up", "Verify reel", "Post project", "Review applicants", "Hire"],
    "mvpScope": ["Auth", "Profile", "Project board", "Search", "Inbox", "Verification"],
    "pagesNeeded": ["/", "/onboarding", "/projects", "/profile", "/inbox"],
    "successMetrics": ["Time-to-first-collaborator", "Match success rate"],
}

OPENAI_BRAND_GOOD = {
    "brandName": "ReelCrew",
    "tagline": "Find your crew, faster.",
    "mission": "Help indie filmmakers find trusted collaborators in days, not months.",
    "heroHeadline": "Find your indie film crew in days.",
    "heroSubheadline": "Verified profiles, real reels, local first.",
    "ctaCopy": "Find your crew",
    "posterCopy": "Need a crew?\nReelCrew has them.\nLocal. Verified. Real.",
    "socialMediaCaption": "Indie filmmakers, your crew is here. #ReelCrew #IndieFilm",
    "launchAnnouncement": "Today we're launching ReelCrew. Verified indie film crews, local first.",
}

OPENAI_VISUALS_GOOD = {
    "heroImagePrompt": "Cinematic hero shot of a small film crew on a city rooftop at golden hour, 16:9.",
    "campaignPosterPrompt": "Minimalist 2:3 poster, deep navy with film-strip motif, serif headline.",
    "uiMoodboardPrompt": "Editorial UI moodboard, navy + amber, serif headers, gentle shadows.",
    "architectureDiagramPrompt": "Clean architecture diagram, three lanes, soft cyan + violet, 16:9.",
}

GEMINI_EVAL_GOOD = {
    "scores": {
        "productMarketFit": 8,
        "userEmpathy": 9,
        "technicalFeasibility": 7,
        "ethicalSafety": 8,
        "accessibility": 6,
        "campaignQuality": 7,
        "overallReadiness": 7,
    },
    "strengths": ["Sharp audience", "Clear value", "Real verification"],
    "weaknesses": ["Verification slow", "Cold-start problem"],
    "recommendedImprovements": ["Seed with 50 verified pros", "Add referral system"],
    "finalVerdict": "Strong concept, biggest risk is the cold start.",
}


# ----------------------------------------------------------------------------
# Test 1: Normalization functions
# ----------------------------------------------------------------------------

def test_normalization():
    banner("normalization (spec schema -> frontend schema)")
    from data import mock_outputs
    from services.orchestration_service import (
        normalize_research,
        normalize_blueprint,
        normalize_brand,
        normalize_visuals,
        normalize_evaluation,
    )

    fb = mock_outputs.build_full_package("test idea")

    r = normalize_research(GEMINI_RESEARCH_GOOD, fb["research"])
    assert isinstance(r["problemValidation"], list), "problemValidation must be list"
    assert r["painPoints"] == GEMINI_RESEARCH_GOOD["userPainPoints"], "userPainPoints -> painPoints"
    assert r["recommendedMvp"] == GEMINI_RESEARCH_GOOD["recommendedMvpDirection"], "recommendedMvpDirection -> recommendedMvp"
    print("  research: PASS")

    b = normalize_blueprint(OPENAI_BLUEPRINT_GOOD, fb["blueprint"])
    assert b["productName"] == "ReelCrew"
    assert b["onelinePitch"] == OPENAI_BLUEPRINT_GOOD["oneLinePitch"], "oneLinePitch -> onelinePitch"
    assert all(isinstance(f, dict) and "name" in f and "description" in f for f in b["coreFeatures"]), "features must be {name, description}"
    print("  blueprint: PASS")

    br = normalize_brand(OPENAI_BRAND_GOOD, fb["brandCampaign"])
    assert br["ctaPrimary"] == "Find your crew", "ctaCopy -> ctaPrimary"
    assert br["socialCaption"] == OPENAI_BRAND_GOOD["socialMediaCaption"], "socialMediaCaption -> socialCaption"
    print("  brand: PASS")

    v = normalize_visuals(OPENAI_VISUALS_GOOD, fb["visualPrompts"])
    assert v["heroImage"] == OPENAI_VISUALS_GOOD["heroImagePrompt"], "heroImagePrompt -> heroImage"
    assert v["architectureDiagram"] == OPENAI_VISUALS_GOOD["architectureDiagramPrompt"]
    print("  visuals: PASS")

    e = normalize_evaluation(GEMINI_EVAL_GOOD, fb["evaluation"])
    assert e["scores"]["productMarketFit"] == 80, f"0-10 -> 0-100, got {e['scores']['productMarketFit']}"
    assert e["scores"]["overallReadiness"] == 70
    assert e["judgeNotes"] == "Strong concept, biggest risk is the cold start.", "finalVerdict -> judgeNotes"
    print("  evaluation: PASS (0-10 scaled to 0-100)")


# ----------------------------------------------------------------------------
# Test 2: Normalization handles BAD model output
# ----------------------------------------------------------------------------

def test_bad_output_falls_back():
    banner("normalization with bad / partial model output")
    from data import mock_outputs
    from services.orchestration_service import (
        normalize_research,
        normalize_blueprint,
        normalize_evaluation,
    )

    fb = mock_outputs.build_full_package("test")

    # None or wrong type -> full fallback
    assert normalize_research(None, fb["research"]) == fb["research"]
    assert normalize_research("not a dict", fb["research"]) == fb["research"]
    assert normalize_blueprint([], fb["blueprint"]) == fb["blueprint"]
    print("  None/wrong-type -> fallback: PASS")

    # Partial dict missing fields -> filled from fallback
    partial = {"productName": "OnlyName"}
    b = normalize_blueprint(partial, fb["blueprint"])
    assert b["productName"] == "OnlyName"
    assert b["targetUsers"] == fb["blueprint"]["targetUsers"], "missing fields use fallback"
    assert isinstance(b["coreFeatures"], list) and len(b["coreFeatures"]) > 0
    print("  partial dict -> filled with fallback: PASS")

    # 0-100 scores still work (model returned wrong scale)
    eval_100 = dict(GEMINI_EVAL_GOOD)
    eval_100["scores"] = {**GEMINI_EVAL_GOOD["scores"], "productMarketFit": 75}
    e = normalize_evaluation(eval_100, fb["evaluation"])
    assert e["scores"]["productMarketFit"] == 75, f"0-100 stays 0-100, got {e['scores']['productMarketFit']}"
    print("  mixed score scales: PASS")

    # Garbage scores
    eval_garbage = {"scores": {"productMarketFit": "not a number"}, "strengths": []}
    e = normalize_evaluation(eval_garbage, fb["evaluation"])
    assert e["scores"]["productMarketFit"] == fb["evaluation"]["scores"]["productMarketFit"]
    print("  garbage score -> fallback value: PASS")


# ----------------------------------------------------------------------------
# Test 3: Orchestrator with NO keys -> mock-fallback
# ----------------------------------------------------------------------------

def test_no_keys_full_fallback():
    banner("orchestrator with NO API keys")
    os.environ.pop("GEMINI_API_KEY", None)
    os.environ.pop("OPENAI_API_KEY", None)
    # Re-import to pick up env state
    import importlib
    from services import gemini_service as gs_mod, openai_service as oa_mod, orchestration_service as orch_mod
    importlib.reload(gs_mod)
    importlib.reload(oa_mod)
    importlib.reload(orch_mod)

    pkg = orch_mod.generate_package("a habit tracker for grad students")
    assert pkg["mode"] == "mock-fallback", f"expected mock-fallback, got {pkg['mode']}"
    assert pkg["liveSteps"] == 0
    assert pkg["totalSteps"] == 6
    assert len(pkg["errors"]) == 6, f"expected 6 errors (one per step), got {len(pkg['errors'])}"
    for key in ["research", "blueprint", "claudeBuildPrompt", "brandCampaign", "visualPrompts", "evaluation", "workflow"]:
        assert key in pkg
    print(f"  mode={pkg['mode']}, liveSteps={pkg['liveSteps']}/{pkg['totalSteps']}, errors={len(pkg['errors'])}: PASS")


# ----------------------------------------------------------------------------
# Test 4: Orchestrator with BOTH keys mocked -> live mode
# ----------------------------------------------------------------------------

def test_all_keys_live_mode():
    banner("orchestrator with BOTH keys (mocked SDK)")
    os.environ["GEMINI_API_KEY"] = "fake-gemini"
    os.environ["OPENAI_API_KEY"] = "fake-openai"

    import importlib
    from services import gemini_service as gs_mod, openai_service as oa_mod, orchestration_service as orch_mod
    importlib.reload(gs_mod)
    importlib.reload(oa_mod)
    importlib.reload(orch_mod)

    # Patch the methods on the singletons used by the orchestrator
    with patch.object(gs_mod.gemini_service, "research", return_value=GEMINI_RESEARCH_GOOD), \
         patch.object(gs_mod.gemini_service, "evaluation", return_value=GEMINI_EVAL_GOOD), \
         patch.object(oa_mod.openai_service, "blueprint", return_value=OPENAI_BLUEPRINT_GOOD), \
         patch.object(oa_mod.openai_service, "claude_prompt", return_value="A real-looking Claude build prompt with multiple sections."), \
         patch.object(oa_mod.openai_service, "brand_campaign", return_value=OPENAI_BRAND_GOOD), \
         patch.object(oa_mod.openai_service, "visual_prompts", return_value=OPENAI_VISUALS_GOOD):
        # The orchestrator imports these names directly, so patch the module-level singletons too
        with patch.object(orch_mod, "gemini_service", gs_mod.gemini_service), \
             patch.object(orch_mod, "openai_service", oa_mod.openai_service):
            pkg = orch_mod.generate_package("indie filmmakers find collaborators")

    assert pkg["mode"] == "live", f"expected live, got {pkg['mode']} (errors: {pkg['errors']})"
    assert pkg["liveSteps"] == 6
    assert pkg["errors"] == []
    assert pkg["blueprint"]["productName"] == "ReelCrew"
    assert pkg["evaluation"]["scores"]["productMarketFit"] == 80  # 8 -> 80
    print(f"  mode={pkg['mode']}, liveSteps={pkg['liveSteps']}/6, productName={pkg['blueprint']['productName']}: PASS")


# ----------------------------------------------------------------------------
# Test 5: Partial fallback when ONE provider fails
# ----------------------------------------------------------------------------

def test_partial_fallback_on_provider_failure():
    banner("orchestrator with OpenAI failing -> partial-fallback")
    os.environ["GEMINI_API_KEY"] = "fake-gemini"
    os.environ["OPENAI_API_KEY"] = "fake-openai"

    import importlib
    from services import gemini_service as gs_mod, openai_service as oa_mod, orchestration_service as orch_mod
    importlib.reload(gs_mod)
    importlib.reload(oa_mod)
    importlib.reload(orch_mod)

    with patch.object(gs_mod.gemini_service, "research", return_value=GEMINI_RESEARCH_GOOD), \
         patch.object(gs_mod.gemini_service, "evaluation", return_value=GEMINI_EVAL_GOOD), \
         patch.object(oa_mod.openai_service, "blueprint", side_effect=RuntimeError("openai 500")), \
         patch.object(oa_mod.openai_service, "claude_prompt", side_effect=RuntimeError("openai timeout")), \
         patch.object(oa_mod.openai_service, "brand_campaign", side_effect=RuntimeError("openai 500")), \
         patch.object(oa_mod.openai_service, "visual_prompts", side_effect=RuntimeError("openai 500")):
        with patch.object(orch_mod, "gemini_service", gs_mod.gemini_service), \
             patch.object(orch_mod, "openai_service", oa_mod.openai_service):
            pkg = orch_mod.generate_package("any idea")

    assert pkg["mode"] == "partial-fallback", f"expected partial-fallback, got {pkg['mode']}"
    assert pkg["liveSteps"] == 2  # only Gemini research + evaluation succeeded
    assert len(pkg["errors"]) == 4
    # Make sure no stack traces leaked in
    for err in pkg["errors"]:
        assert "Traceback" not in err["error"], "stack traces must not leak"
    print(f"  mode={pkg['mode']}, liveSteps={pkg['liveSteps']}, errors filtered: PASS")


# ----------------------------------------------------------------------------
# Test 6: Bad JSON from Gemini still produces a valid package
# ----------------------------------------------------------------------------

def test_bad_json_recovers():
    banner("orchestrator when Gemini returns un-parseable JSON")
    os.environ["GEMINI_API_KEY"] = "fake"
    os.environ["OPENAI_API_KEY"] = "fake"

    import importlib
    from services import gemini_service as gs_mod, openai_service as oa_mod, orchestration_service as orch_mod
    importlib.reload(gs_mod)
    importlib.reload(oa_mod)
    importlib.reload(orch_mod)

    # Returning None simulates parse_json failing on garbage model output
    with patch.object(gs_mod.gemini_service, "research", return_value=None), \
         patch.object(gs_mod.gemini_service, "evaluation", return_value=None), \
         patch.object(oa_mod.openai_service, "blueprint", return_value=OPENAI_BLUEPRINT_GOOD), \
         patch.object(oa_mod.openai_service, "claude_prompt", return_value="a prompt"), \
         patch.object(oa_mod.openai_service, "brand_campaign", return_value=OPENAI_BRAND_GOOD), \
         patch.object(oa_mod.openai_service, "visual_prompts", return_value=OPENAI_VISUALS_GOOD):
        with patch.object(orch_mod, "gemini_service", gs_mod.gemini_service), \
             patch.object(orch_mod, "openai_service", oa_mod.openai_service):
            pkg = orch_mod.generate_package("any idea")

    assert pkg["mode"] == "partial-fallback"
    assert pkg["liveSteps"] == 4
    research_errs = [e for e in pkg["errors"] if e["step"] in ("research", "evaluation")]
    assert len(research_errs) == 2
    print(f"  mode={pkg['mode']}, recovered cleanly with mock research+eval: PASS")


# ----------------------------------------------------------------------------
# Test 7: Empty rawIdea raises
# ----------------------------------------------------------------------------

def test_empty_idea_raises():
    banner("empty rawIdea raises ValueError")
    import importlib
    from services import orchestration_service as orch_mod
    importlib.reload(orch_mod)
    try:
        orch_mod.generate_package("   ")
        assert False, "should have raised"
    except ValueError:
        print("  ValueError raised: PASS")


# ----------------------------------------------------------------------------
# Test 8: Flask routes via test client (no keys)
# ----------------------------------------------------------------------------

def test_flask_routes():
    banner("Flask routes via test client (no keys)")
    os.environ.pop("GEMINI_API_KEY", None)
    os.environ.pop("OPENAI_API_KEY", None)
    # disable dotenv so the user's real .env isn't loaded
    import dotenv
    dotenv.load_dotenv = lambda *a, **k: False

    # Drop cached modules so singletons are rebuilt with the empty env
    for mod_name in [
        "app",
        "routes.launchlab_routes",
        "services.orchestration_service",
        "services.gemini_service",
        "services.openai_service",
    ]:
        sys.modules.pop(mod_name, None)

    import app as app_mod
    c = app_mod.app.test_client()

    h = c.get("/api/health").get_json()
    assert h["status"] == "ok"
    assert h["mode"] in ("real-api-ready", "mock-only")
    assert h["providers"] == {"gemini": False, "openai": False}
    print(f"  /api/health: {h}")

    s = c.get("/api/sample").get_json()
    assert s["ok"] is True
    assert s["data"]["blueprint"]["productName"] == "BridgeMate"
    print("  /api/sample: PASS")

    bad = c.post("/api/generate", json={"rawIdea": ""})
    assert bad.status_code == 400
    assert bad.get_json()["success"] is False
    print(f"  /api/generate empty -> 400: PASS")

    g = c.post("/api/generate", json={"rawIdea": "an app for hikers to find lost trails"})
    assert g.status_code == 200
    body = g.get_json()
    assert body["ok"] is True
    inner = body["data"]
    assert inner["mode"] == "mock-fallback"
    assert inner["success"] is True
    assert all(k in inner for k in ["research", "blueprint", "claudeBuildPrompt", "brandCampaign", "visualPrompts", "evaluation", "workflow", "errors"])
    print(f"  /api/generate (no keys): mode={inner['mode']}, fields complete: PASS")


# ----------------------------------------------------------------------------
# Run all
# ----------------------------------------------------------------------------

# ----------------------------------------------------------------------------
# Test 9: Gemini auto-fallback on 404 deprecated model
# ----------------------------------------------------------------------------

def test_gemini_404_auto_fallback():
    banner("Gemini auto-fallback when configured model is deprecated (404)")
    os.environ["GEMINI_API_KEY"] = "fake"
    # User configures a deprecated model
    os.environ["GEMINI_MODEL"] = "gemini-2.0-flash"

    # Construct a FRESH service instance (not the cached singleton) so the
    # configured GEMINI_MODEL is read from the current env.
    from services.gemini_service import GeminiService
    svc = GeminiService()
    assert svc._model_name == "gemini-2.0-flash", f"unexpected model: {svc._model_name}"
    # Build a fake client so we don't need real network
    fake_client = MagicMock()
    svc._client = fake_client

    call_log = []

    def fake_generate(**kwargs):
        model = kwargs["model"]
        call_log.append(model)
        if "2.0" in model:
            raise RuntimeError("ClientError: 404 NOT_FOUND. {'error': {'code': 404, 'message': 'This model is no longer available'}}")
        # Healthy response from the modern model
        resp = MagicMock()
        resp.text = json.dumps({"problemValidation": "ok", "targetUsers": ["a"]})
        return resp

    fake_client.models.generate_content = fake_generate

    result = svc.research("test idea")
    assert result is not None, "should have recovered onto modern model"
    assert call_log[0] == "gemini-2.0-flash", f"first call should be configured model, got {call_log}"
    assert "2.5" in call_log[1] or "latest" in call_log[1], f"second call should be modern, got {call_log}"
    assert svc._working_model is not None
    print(f"  attempted models: {call_log}")
    print(f"  cached working_model: {svc._working_model}: PASS")

    # Second call should skip the deprecated one (cached)
    call_log.clear()
    result = svc.research("another idea")
    assert call_log == [svc._working_model], f"should use cached model only, got {call_log}"
    print(f"  second call cached: {call_log}: PASS")

    # Cleanup
    os.environ.pop("GEMINI_MODEL", None)


# ----------------------------------------------------------------------------
# Test 10: 429 (quota) does NOT trigger model fallback - stays on configured model
# ----------------------------------------------------------------------------

def test_gemini_429_does_not_switch_models():
    banner("Gemini 429 quota error does NOT silently switch model")
    os.environ["GEMINI_API_KEY"] = "fake"
    os.environ["GEMINI_MODEL"] = "gemini-2.5-flash"

    from services.gemini_service import GeminiService
    svc = GeminiService()
    fake_client = MagicMock()
    svc._client = fake_client

    call_log = []
    def fake_generate(**kwargs):
        call_log.append(kwargs["model"])
        raise RuntimeError("ClientError: 429 RESOURCE_EXHAUSTED. {'error': {'code': 429}}")
    fake_client.models.generate_content = fake_generate

    try:
        svc.research("x")
        assert False, "should have raised"
    except RuntimeError as e:
        assert "429" in str(e)
    assert call_log == ["gemini-2.5-flash"], f"429 must NOT switch models, got {call_log}"
    print(f"  attempted models on 429: {call_log}: PASS (raised, no silent fallback)")

    os.environ.pop("GEMINI_MODEL", None)


if __name__ == "__main__":
    test_normalization()
    test_bad_output_falls_back()
    test_no_keys_full_fallback()
    test_all_keys_live_mode()
    test_partial_fallback_on_provider_failure()
    test_bad_json_recovers()
    test_empty_idea_raises()
    test_flask_routes()
    test_gemini_404_auto_fallback()
    test_gemini_429_does_not_switch_models()
    print("\nALL TESTS PASSED")
