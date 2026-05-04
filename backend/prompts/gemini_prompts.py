"""Prompt templates for Gemini calls.

Both prompts ask for STRICT JSON only. The orchestration layer normalizes
the parsed output into the frontend's existing schema.
"""


def research_prompt(raw_idea: str) -> str:
    return f"""You are a senior product research analyst.

The user has a rough product idea:
\"\"\"{raw_idea}\"\"\"

Produce a structured research report. Return VALID JSON ONLY. No markdown,
no backticks, no commentary outside the JSON. Match this exact schema:

{{
  "problemValidation": "1-2 paragraph summary of how real and severe this problem is, with concrete signals",
  "targetUsers": ["3-5 specific user segments"],
  "userPainPoints": ["5-7 concrete pain points in plain language"],
  "existingSolutions": ["3-5 named or categorized current alternatives and why they fall short"],
  "marketGap": "1 short paragraph identifying the underserved opportunity",
  "ethicalConcerns": ["3-5 specific ethical risks the team must address"],
  "recommendedMvpDirection": "1 short paragraph proposing the smallest valuable MVP"
}}

Be specific, opinionated, and grounded. Do not hedge."""


def evaluation_prompt(package_summary: str) -> str:
    return f"""You are a tough but fair product evaluation judge.

Below is a generated product package (research + blueprint + brand + visual prompts):

{package_summary}

Score the package and write a verdict. Return VALID JSON ONLY. No markdown,
no backticks, no commentary outside the JSON. Use 0-10 integer scores. Match this schema:

{{
  "scores": {{
    "productMarketFit": 0,
    "userEmpathy": 0,
    "technicalFeasibility": 0,
    "ethicalSafety": 0,
    "accessibility": 0,
    "campaignQuality": 0,
    "overallReadiness": 0
  }},
  "strengths": ["4-6 concrete strengths"],
  "weaknesses": ["4-6 concrete weaknesses"],
  "recommendedImprovements": ["4-6 specific actionable next steps"],
  "finalVerdict": "1 short paragraph verdict, including the single biggest risk"
}}

Be specific. Do not output prose outside the JSON."""
