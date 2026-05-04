# LaunchLab AI

A polished, demo-ready **multi-LLM product studio** that turns a rough human idea into a full launch-ready package: research, blueprint, build prompt, brand & campaign, image prompts, evaluation, and a visual workflow map.

This is **v1**. It uses **mock/fallback data only** so the demo always works, even with no API keys, no database, and no auth.

---

## What LaunchLab AI demonstrates

A single human idea ("an app for international students who feel lonely after moving to the U.S.") moves through a workflow where **different LLMs play different roles**:

| Role | Model | Output |
| --- | --- | --- |
| Orchestrator / Reviewer | **Human** | Raw idea, final decisions |
| Research Analyst | **Gemini** | Validated problem, market gap, ethics |
| Product Architect | **ChatGPT** | Named product, features, MVP scope |
| Prompt Engineer | **ChatGPT** | A precise Claude Code build brief |
| Coding Agent | **Claude Code** | The actual web app |
| Campaign Strategist | **ChatGPT** | Brand voice, hero copy, posters |
| Visual Designer | **GPT Image** | Hero, poster, moodboard, architecture prompts |
| Evaluation Judge | **Gemini** | Scores + strengths + improvements |

---

## Tech stack

**Frontend**
- Next.js 14 (App Router) + React + TypeScript
- Tailwind CSS
- Framer Motion (subtle tab transitions)
- lucide-react (icons)

**Backend**
- Python 3.10+
- Flask + flask-cors + python-dotenv
- Mock service layer ready to swap for real LLM calls later

**Not used (on purpose, per Caveman Method):** LangChain, LangGraph, Redux/Zustand, real LLM APIs, image APIs, auth, database.

---

## Run it locally

### 1. Backend (Flask)

```bash
cd backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1
# macOS / Linux
# source venv/bin/activate

pip install -r requirements.txt
python app.py
```

Backend runs on **http://localhost:5000** (`/api/health`, `/api/sample`, `/api/generate`).

### 2. Frontend (Next.js)

In a separate terminal:

```bash
cd frontend
npm install

# optional: configure backend URL
copy .env.local.example .env.local      # Windows
# cp .env.local.example .env.local      # macOS / Linux

npm run dev
```

Frontend runs on **http://localhost:3000**.

> If the backend is not running, the frontend automatically falls back to local mock data and shows a small "Local fallback" badge. The demo never breaks.

---

## Demo flow (live class script)

1. Open `http://localhost:3000`.
2. Land on the **Raw Idea** tab. Show the model role cards.
3. Click **Use Sample Idea** (the international students one). The package generates instantly.
4. Walk the audience through each tab in order:
   - **Gemini Research** - validated problem and ethical concerns
   - **Product Blueprint** - named product (BridgeMate), features, journey, MVP
   - **Claude Build Prompt** - paste-ready prompt for Claude Code, with Copy button
   - **Brand & Campaign** - hero copy, poster, social, launch announcement
   - **Visual Generator** - 4 image prompts with Copy buttons
   - **Evaluation Report** - scorecard, strengths, weaknesses, improvements
   - **Workflow Map** - the full multi-LLM pipeline visualized
5. Optional: type your own messy idea, generate, and show the same structure with generic fallback content.

---

## Important files

```
LaunchLab AI/
├── README.md
├── backend/
│   ├── app.py                          # Flask app + CORS
│   ├── requirements.txt
│   ├── routes/launchlab_routes.py      # /api/health, /sample, /generate, optional per-section
│   ├── services/mock_ai_service.py     # The seam where real LLMs will plug in later
│   ├── data/mock_outputs.py            # All deterministic mock content
│   └── utils/response_helpers.py
└── frontend/
    ├── app/page.tsx                    # Main dashboard, state, tab switching
    ├── app/layout.tsx
    ├── app/globals.css                 # Theme, gradients, glass cards, buttons
    ├── components/
    │   ├── AppShell.tsx                # Header, backend status badge, footer
    │   ├── TabNavigation.tsx           # The 8 tabs
    │   ├── RawIdeaTab.tsx              # Idea input + model role cards
    │   ├── ResearchTab.tsx
    │   ├── BlueprintTab.tsx
    │   ├── ClaudePromptTab.tsx         # Copy-friendly prompt panel
    │   ├── BrandCampaignTab.tsx
    │   ├── VisualGeneratorTab.tsx      # 4 image prompt cards
    │   ├── EvaluationTab.tsx           # Score bars, strengths, weaknesses
    │   ├── WorkflowMapTab.tsx          # Multi-LLM pipeline visual
    │   ├── SectionCard.tsx
    │   ├── CopyButton.tsx
    │   ├── LoadingState.tsx
    │   └── EmptyState.tsx
    ├── lib/
    │   ├── api.ts                      # healthCheck, getSamplePackage, generateProductPackage
    │   ├── types.ts
    │   ├── constants.ts                # Tabs, model roles, sample idea, API_URL
    │   └── fallbackData.ts             # Same mock content, used if backend is down
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── next.config.js
    ├── tsconfig.json
    ├── package.json
    └── .env.local.example
```

---

## Current limitations

- All AI outputs are mocked. Sample idea returns the rich BridgeMate package; any other idea returns the same structured package with the user's idea echoed in.
- No persistence: refresh = lose the generated package.
- No authentication, no database, no rate limiting.
- Visual Generator only writes prompts; no image is actually rendered yet.
- Accessibility audit is not yet wired (it's flagged as a weakness inside the evaluation itself).

---

## Future upgrades

- Connect **Gemini API** for real research + evaluation.
- Connect **OpenAI API** for product architect, prompt engineer, campaign strategist.
- Connect **Claude API** to actually run the build prompt.
- Connect an **image generation API** (DALL-E, Imagen, or Replicate) and render thumbnails inline.
- Add a **LangChain version** of the orchestration as a comparison.
- Add a **LangGraph version** with explicit branches, retries, and human-in-the-loop gates.
- Export the package to **PDF**.
- Add a lightweight **project history database** (SQLite) so past packages can be revisited.
