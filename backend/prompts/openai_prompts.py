"""Prompt templates for OpenAI calls.

All structured prompts ask for STRICT JSON only. The Claude Build Prompt
returns plain text on purpose (it is itself a prompt).
"""

import json


def blueprint_prompt(raw_idea: str, research: dict) -> str:
    research_json = json.dumps(research, ensure_ascii=False, indent=2)
    return f"""You are a senior product architect.

Raw idea:
\"\"\"{raw_idea}\"\"\"

Research report:
{research_json}

Produce a tight, opinionated product blueprint. Return VALID JSON ONLY.
No markdown, no backticks, no commentary outside the JSON. Match this schema:

{{
  "productName": "single memorable brand-ready name",
  "oneLinePitch": "one sentence: what it is, who it serves, what changes",
  "targetUsers": ["3-4 specific user segments"],
  "coreFeatures": ["5-7 core features as short noun phrases"],
  "userJourney": ["5-7 ordered steps a new user takes"],
  "mvpScope": ["6-8 concrete MVP build items"],
  "pagesNeeded": ["6-10 page or screen names"],
  "successMetrics": ["4-6 measurable success metrics"]
}}

Be specific. Skip therapy or regulated features unless clearly safe in MVP."""


def claude_build_prompt(blueprint: dict, research: dict) -> str:
    blueprint_json = json.dumps(blueprint, ensure_ascii=False, indent=2)
    research_json = json.dumps(research, ensure_ascii=False, indent=2)
    return f"""You are a senior prompt engineer writing a build brief for Claude Code (or Cursor).

Below is a product blueprint and the research that informed it. Produce a single,
ready-to-paste Claude Code prompt that an engineering agent can use to build the
described product end-to-end.

The output MUST be plain text (a prompt). Do NOT wrap it in JSON or markdown fences.

The prompt you write must include, in this order, with clear headers:
- PROJECT (name + one-line goal)
- PRIMARY USER (who it serves and why)
- DESIGN PRINCIPLES (4-6 short principles tied to the product's emotional tone)
- TECH STACK (sensible modern default: Next.js 14 + TypeScript + Tailwind + shadcn/ui + lucide-react; Python/Flask backend if needed; mock data only for v1)
- PAGES (numbered list mapping to the blueprint pages)
- COMPONENTS (key components to build)
- DATA MODEL (TypeScript types)
- API ENDPOINTS (if any) with request/response shapes
- UI REQUIREMENTS (responsive, empty/loading/error states, copy buttons where useful)
- ERROR HANDLING (graceful fallbacks, never blank UI)
- ACCEPTANCE CRITERIA (numbered checklist of 6-10 testable items)
- ETHICAL CONSTRAINTS (taken from the research)
- DEMO SAFETY (works without API keys, no auth, no DB in v1)

Blueprint:
{blueprint_json}

Research:
{research_json}

Now write the Claude Code build prompt. Plain text only. Begin."""


def brand_campaign_prompt(blueprint: dict, research: dict) -> str:
    blueprint_json = json.dumps(blueprint, ensure_ascii=False, indent=2)
    research_json = json.dumps(research, ensure_ascii=False, indent=2)
    return f"""You are a senior brand and campaign strategist.

Blueprint:
{blueprint_json}

Research:
{research_json}

Produce brand and campaign copy. Return VALID JSON ONLY. No markdown,
no backticks, no commentary outside the JSON. Match this schema:

{{
  "brandName": "use the productName from the blueprint",
  "tagline": "short emotional tagline, 5-9 words",
  "mission": "1-2 sentence mission, warm and specific",
  "heroHeadline": "landing page hero headline, 6-10 words",
  "heroSubheadline": "1 sentence subheadline that makes the value crystal clear",
  "ctaCopy": "primary CTA, 2-4 words",
  "posterCopy": "3-line poster body, separated by \\n",
  "socialMediaCaption": "1-2 sentence social caption with 1-2 hashtags",
  "launchAnnouncement": "2-3 sentence launch announcement"
}}

Voice: warm, plain, never hype. No exclamation marks."""


def visual_prompts(blueprint: dict, brand_campaign: dict) -> str:
    blueprint_json = json.dumps(blueprint, ensure_ascii=False, indent=2)
    brand_json = json.dumps(brand_campaign, ensure_ascii=False, indent=2)
    return f"""You are a senior art director writing prompts for a text-to-image model.

Blueprint:
{blueprint_json}

Brand & campaign:
{brand_json}

Produce four detailed image generation prompts. Return VALID JSON ONLY.
No markdown, no backticks, no commentary outside the JSON. Match this schema:

{{
  "heroImagePrompt": "rich photographic prompt for a hero image, include mood, lighting, composition, lens, aspect ratio, no text or logos",
  "campaignPosterPrompt": "minimalist poster prompt with composition, color, typography hints, aspect ratio",
  "uiMoodboardPrompt": "moodboard prompt describing palette, typography, components, micro-illustrations, mood, layout",
  "architectureDiagramPrompt": "clean technical architecture diagram prompt with lanes, modules, arrows, color, aspect ratio"
}}

Each prompt must be one paragraph, specific, and ready to paste into ChatGPT Image, Midjourney, or any text-to-image model."""
