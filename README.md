# LaunchLab AI

A polished, demo-ready **multi-LLM product studio** that turns a rough human idea into a full launch-ready package: research, blueprint, build prompt, brand & campaign, image prompts, evaluation, and a visual workflow map.

This is **v0.2 (Step 2)**: the workflow now actually calls **Gemini** and **OpenAI** when keys are present, with **per-step mock fallback** so the demo never breaks.

---

## What LaunchLab AI demonstrates

A single human idea moves through a manual multi-LLM workflow, with each model playing a distinct role:

| Role | Model | Output |
| --- | --- | --- |
| Orchestrator / Reviewer | **Human** | Raw idea, final decisions |
| Research Analyst | **Gemini** | Validated problem, market gap, ethics |
| Product Architect | **OpenAI** | Named product, features, MVP scope |
| Prompt Engineer | **OpenAI** | Ready-to-paste Claude Code build brief |
| Campaign Strategist | **OpenAI** | Brand voice, hero copy, posters |
| Visual Designer | **OpenAI** | Hero, poster, moodboard, architecture image prompts |
| Evaluation Judge | **Gemini** | Scores + strengths + weaknesses + verdict |
| Coding Agent | **Claude Code / Cursor** | Builds the actual product from the prompt |

**Two orchestration modes** are now available side by side:

- **Version 1 (Manual Workflow)** - the original direct-function-call pipeline. Default.
- **Version 2 (LangGraph Workflow)** - the same six steps refactored into a deterministic LangGraph: shared state, six nodes, sequential edges. Drop-in: same response shape, same tabs, same UI.

The frontend has a `Manual v1 / LangGraph v2` toggle. Each generation tags itself with the workflow it was produced by, so the badge in the Mode banner and the Workflow Map tab reflect reality.

---

## Pipeline

```text
raw idea
  -> Gemini: research
  -> OpenAI: product blueprint
  -> OpenAI: Claude Code build prompt
  -> OpenAI: brand & campaign copy
  -> OpenAI: image generation prompts
  -> Gemini: evaluation report
```

Each step is isolated in a service function. If a step fails (no key, timeout, malformed JSON, network error), the orchestrator substitutes the existing mock content for that step and keeps going. The frontend's existing schema is canonical; model output is normalized into it.

---

## Tech stack

**Frontend** - Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion, lucide-react

**Backend** - Python 3.10+, Flask, flask-cors, python-dotenv, google-genai, openai

**Not used (by design):** LangChain, LangGraph, Redux/Zustand, auth, database, image-rendering APIs.

---

## Environment variables

Create a `.env` in the **project root** (already ignored by git). See [`.env.example`](.env.example).

```env
# Backend (Flask) - server-only, never sent to the frontend
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_MODEL=gemini-2.5-flash       # optional
OPENAI_MODEL=gpt-4o-mini             # optional
OPENAI_IMAGE_MODEL=gpt-image-1       # optional - swap if your account is on a different image model
OPENAI_IMAGE_SIZE=1024x1024          # optional
OPENAI_IMAGE_TIMEOUT=60              # optional
OPENAI_TIMEOUT=45                    # optional
FRONTEND_URL=http://localhost:3000   # CORS allow-list (single URL or comma-separated)
```

Frontend `.env.local` (in `frontend/`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Keys are read by the Flask backend only and never sent to the frontend. Only `NEXT_PUBLIC_*` vars are exposed to the browser. The Supabase **service role key must never** be put in any `NEXT_PUBLIC_*` var.

The app works with **0, 1, or 2 keys present**. Missing providers degrade to mock fallback for their steps. Sign-in is optional - the demo flow runs without Supabase.

---

## Run it

### Backend (Flask)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1            # Windows PowerShell
# source venv/bin/activate              # macOS / Linux
pip install -r requirements.txt
python app.py
```

Backend runs on <http://localhost:5000>.

### Frontend (Next.js)

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on <http://localhost:3000>. If you want a non-default backend URL, copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_API_URL`.

---

## API endpoints

### `GET /api/health`

```json
{
  "status": "ok",
  "service": "LaunchLab AI",
  "version": "0.2.0",
  "mode": "real-api-ready",
  "providers": { "gemini": true, "openai": true }
}
```

### `GET /api/sample`

Returns the deterministic sample package using mock data, wrapped in the standard `{ ok, data }` envelope. Useful for the live class demo.

### `POST /api/generate` (Version 1 - Manual)

Body: `{ "rawIdea": "messy product idea" }`

Response (success): `{ ok: true, data: { ...package, success: true, mode, errors, liveSteps, totalSteps } }`

### `POST /api/v2/run-workflow` (Version 2 - LangGraph)

Same input as v1. Same response shape, plus:

```jsonc
{
  "version": "v2",
  "workflowMode": "langgraph",
  "fallbackSteps": ["..."],
  "graphMetadata": {
    "graphType": "sequential-langgraph",
    "description": "LangGraph state-based orchestration (sequential)",
    "nodes": ["research", "product_architect", "prompt_engineer", "campaign_strategist", "visual_prompt_designer", "evaluation_judge"],
    "edges": [["START","research"], ["research","product_architect"], ...],
    "nodesRun": ["research", "product_architect", ...]
  }
}
```

If `langgraph` is not installed, the v2 route falls back to running the v1 manual orchestrator and tags the response as `v2 / mock-fallback / fallbackSteps: ["graph"]` so the demo never breaks.

`mode` is one of:

- `live` - all 6 steps used real APIs
- `partial-fallback` - some steps used mock; `errors` lists which and why (no stack traces)
- `mock-fallback` - all steps used mock (e.g. no keys)

Empty `rawIdea` returns `400 { success: false, error: "Raw idea is required." }`.

---

## Fallback behavior (demo safety)

| Situation | What the user sees |
| --- | --- |
| Both keys present and APIs respond | Live mode banner, fully generated content |
| One key missing | Partial-fallback banner, mock data for that provider's steps |
| Both keys missing | Mock-fallback banner, full mock package |
| Backend not running | Local fallback (frontend uses bundled mock data) |
| API returns malformed JSON | That step gets mock fallback, other steps continue |

In **every** case, all 8 tabs render and the demo is presentable.

---

## Demo flow (live class script)

1. Open `http://localhost:3000` and look at the header: backend badge + Gemini/OpenAI provider chips show whether keys are loaded.
2. **Raw Idea** tab - show the model role cards.
3. Click **Use Sample Idea**, then **Generate Product Package**.
4. Walk left to right through the tabs:
   - Gemini Research
   - Product Blueprint
   - Claude Build Prompt (use Copy)
   - Brand & Campaign
   - Visual Generator (use Copy on each)
   - Evaluation Report
   - Workflow Map
5. Type a fresh messy idea, regenerate live, and show the same structure with fresh content.

---

## Important files (Step 2 changes)

```text
.env.example                                   (new)
.gitignore                                     (updated)
README.md                                      (updated)

backend/
  app.py                                       (loads root .env first)
  requirements.txt                             (+google-generativeai, +openai)
  .env.example                                 (new)
  prompts/
    gemini_prompts.py                          (new)
    openai_prompts.py                          (new)
  services/
    gemini_service.py                          (new)
    openai_service.py                          (new)
    orchestration_service.py                   (new - manual pipeline + normalization)
    mock_ai_service.py                         (unchanged - still used as fallback)
  routes/launchlab_routes.py                   (rewritten - new /health + orchestrated /generate)
  utils/json_helpers.py                        (new - safe JSON parsing)

frontend/
  lib/api.ts                                   (healthCheck now returns provider info)
  lib/types.ts                                 (added mode, errors, liveSteps, totalSteps)
  lib/fallbackData.ts                          (tags package as mock-fallback)
  components/AppShell.tsx                      (added Gemini/OpenAI provider chips)
  app/page.tsx                                 (added ModeBanner, uses HealthStatus)
```

---

## OpenAI image generation

The Visual Generator tab can render real images via `POST /api/images/generate`. The default model is `gpt-image-1`.

If your OpenAI account is not yet verified for image generation, the backend detects this and returns a clean `permission_denied` status. The UI then shows a polished card with:

> _Image generation is not enabled for this OpenAI account or model yet. The prompt is still available for manual generation._

The prompt stays visible and copyable. The rest of the workflow continues to work.

### Troubleshooting `permission denied` from OpenAI image API

1. Open <https://platform.openai.com/settings/organization/general> and complete **organization verification**. Image generation is gated behind verification on most accounts.
2. After verification, wait a few minutes for the change to propagate, then retry from the Visual Generator tab.
3. If you want to use a different image model, set `OPENAI_IMAGE_MODEL` in `.env` (e.g. `gpt-image-1-mini` if your account has access). Restart the backend.
4. Confirm `OPENAI_API_KEY` belongs to the verified org. Project-scoped keys must be tied to that org.
5. The app remains fully usable even if image generation never works - prompts stay available everywhere.

### Image generation policy (demo safety)

- `ENABLE_IMAGE_GENERATION=false` (the default) hard-disables the real image API. The Visual Generator returns `status: "disabled"` and shows a polished prompt-only card.
- When enabled, **only the hero image auto-generates**, and only once per `(rawIdea, prompt)` pair. Campaign poster, UI moodboard, and architecture diagram show a "Generate image" button you click on demand. This keeps paid quota safe during a live demo.
- All failure paths (`billing_limit`, `quota_exceeded`, `permission_denied`, `rate_limited`, `timeout`, `error`, `fallback`) end the loading state and keep the prompt copyable. The card never goes blank.

### Provider warnings & fallback modes

Every workflow run reports one of three modes plus a structured `providerWarnings` array:

- `live` - all six steps used real APIs.
- `partial-fallback` - one or more steps fell back to mock content. The mode banner says which.
- `mock-fallback` - none of the steps reached a live provider.

Provider warnings are friendly chips, e.g. _"Gemini was temporarily unavailable, so fallback research was used."_ - they never include stack traces or API details. The full error type is logged server-side under `[provider-warning]`.

Gemini calls retry up to two times with brief backoff on `503 / overloaded / high demand`. OpenAI quota / rate / billing errors are not retried - the workflow falls back immediately so the demo finishes fast.

---

## Supabase setup (Google sign-in + saved projects)

Sign-in and project history are optional. They activate automatically when the two `NEXT_PUBLIC_SUPABASE_*` vars are present.

**Steps:**

1. Create a Supabase project. Copy the project URL and the **anon** public key into `frontend/.env.local`.
2. Open the Supabase **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql). This creates `profiles` and `launchlab_projects` with **Row Level Security** policies so each user can only read/write their own rows. RLS is the authoritative auth boundary - frontend filters are defense-in-depth only.
3. In **Authentication → Providers**, enable **Google**. Add your Google OAuth client ID and secret.
4. In **Authentication → URL Configuration**, set:
   - **Site URL:** `http://localhost:3000` (and your production URL when you deploy)
   - **Redirect URLs:** `http://localhost:3000`, `http://localhost:3000/auth/callback` (and the production equivalents)
5. In your Google Cloud OAuth credentials, add the Supabase callback URL Supabase shows you (looks like `https://<project>.supabase.co/auth/v1/callback`) as an authorized redirect URI.
6. Restart the frontend (`npm run dev`).

The app uses the Supabase JS client with `detectSessionInUrl: true`, so the OAuth redirect lands back on `/` and the session is exchanged automatically. No custom callback route is required.

### Database tables

| Table | Purpose |
| --- | --- |
| `profiles` | One row per signed-in user. Auto-created by trigger on `auth.users` insert. |
| `launchlab_projects` | One row per saved generation. Stores raw idea, mode, and full `package_json`. |

### RLS reminder

`schema.sql` enables RLS on both tables and adds these policies:

- `profiles`: select / insert / update where `auth.uid() = id`.
- `launchlab_projects`: select / insert / update / delete where `auth.uid() = user_id`.

If you skip RLS, signed-in users could read each other's projects. **Always run the SQL before going live.**

---

## Security audit & checklist

LaunchLab AI is a classroom demo, not a production system, but the following hardening is in place:

| Area | Status |
| --- | --- |
| OpenAI / Gemini API keys | Server-side only. Never sent to the frontend. |
| Supabase service role key | Not used by default. If added, it lives in backend `.env` only. |
| Frontend env vars | Only `NEXT_PUBLIC_*` are exposed to the browser. |
| CORS | Restricted to `FRONTEND_URL` (defaults to `http://localhost:3000`). |
| Auth | Google OAuth via Supabase. No email/password. |
| Per-user data | RLS on `profiles` and `launchlab_projects`. Client also filters by `auth.uid()`. |
| Save action | Requires sign-in. `user_id` is taken from the Supabase session, never from request body. |
| Project history | Requires sign-in. Shows a protected empty state otherwise. |
| Input validation | `rawIdea` capped at 5000 chars. Image prompt capped at 4000 chars. |
| Prompt injection | User idea is treated as untrusted input. System prompts never include API keys or env values. |
| Output rendering | Plain React text rendering. **No `dangerouslySetInnerHTML`** anywhere. |
| Image generation errors | Caught and translated to a stable status enum. Raw provider stack traces never leave the backend. |
| Backend errors | Generic safe message to client. Full stack traces are logged server-side only. |
| Workflow safety | Each step has independent fallback. Failed image generation never blocks the rest of the workflow. |
| Demo safety | App still works with 0 API keys, no Supabase, no image permission, or backend offline. |

### Suggested checks before demo

```powershell
# Backend
cd backend
pip list --outdated

# Frontend
cd frontend
npm audit
```

---

## Troubleshooting

| Symptom | Likely fix |
| --- | --- |
| Google login does nothing | Add Site URL + Redirect URLs in Supabase, and the `https://<project>.supabase.co/auth/v1/callback` URI in Google Cloud OAuth. Restart the frontend. |
| `Auth off` chip in header | `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` missing in `frontend/.env.local`. |
| Sign-in redirects but stays signed out | The redirect URL isn't on Supabase's allow-list. Add `http://localhost:3000` to **Redirect URLs**. |
| `permission_denied` on every image | OpenAI account/org not verified for image generation. See "Troubleshooting OpenAI image API" above. |
| API key missing badges | Set `GEMINI_API_KEY` / `OPENAI_API_KEY` in root `.env` and restart the backend. App falls back to mock data otherwise. |
| Backend chip says "Local fallback" | Backend not running or `NEXT_PUBLIC_API_URL` is wrong. Default backend URL is `http://localhost:5000/api`. |
| CORS error in browser console | Frontend URL not in `FRONTEND_URL`. Add it (single URL or comma-separated list) and restart backend. |
| Save fails with RLS error | Run `supabase/schema.sql` in the Supabase SQL Editor. |
| LangGraph: `'research' is already being used as a state key` | Fixed - graph nodes are now suffixed with `_node` (e.g. `research_node`). Pull latest, restart the backend. |
| Gemini `503 UNAVAILABLE` / "model is overloaded" | Transient. The backend retries up to 2 times with backoff, then falls back to mock content for that step and surfaces a provider warning. |
| OpenAI `429 insufficient_quota` | Account is over-quota. Workflow falls back to polished mock content for the affected step and shows a provider warning. The demo continues. |
| OpenAI image `Billing hard limit has been reached` | Set `ENABLE_IMAGE_GENERATION=false` in `.env`. The Visual Generator stays prompt-only and never calls the image API. |
| All four images generate at once | Fixed - only `heroImage` auto-generates. Other cards now show a "Generate image" button. |
| Image card stuck on loading | Fixed - all backend statuses (`disabled`, `billing_limit`, `quota_exceeded`, `permission_denied`, `rate_limited`, `timeout`, `error`, `fallback`) end loading and show a polished card with the prompt copyable. |

---

## Version 1 vs Version 2 (LangGraph)

| Aspect | Manual v1 | LangGraph v2 |
| --- | --- | --- |
| Architecture | Direct function calls in `services/orchestration_service.py` | Graph nodes + shared state in `backend/graph/` |
| Extensibility | Hand-edit the orchestrator | Add nodes/edges in `graph/builder.py` |
| Branching / retries | Hand-rolled `try/except` | First-class graph primitives |
| Failure isolation | Per-step | Per-node, plus state-level tracking |
| Best for | First prototype, easy debug | Branching, retries, future human-in-loop |

**V2 preserves V1.** V1 is untouched. V2 imports V1's normalization helpers (`normalize_research`, `normalize_blueprint`, etc.) and the existing `gemini_service` / `openai_service` wrappers, so prompts and provider logic are not duplicated.

**Same final output, different architecture.** Both modes intentionally return the same package shape so the same tabs render them. The architectural payoff (retries, branching, human-in-loop, persistence) shows up as **explicit graph behavior** in v2 instead of hidden procedural code in v1. The Workflow Map tab now visualizes both as a side-by-side comparison: a linear pipeline for v1, a shared-state graph diagram for v2, advantage cards, run metadata, and a comparison table.

### Backend layout

```text
backend/
  services/
    orchestration_service.py       (V1, unchanged)
    langgraph_workflow.py          (V2 runner + response normalization)
  graph/                           (V2 only)
    state.py                       (TypedDict graph state)
    nodes.py                       (six deterministic nodes)
    builder.py                     (sequential StateGraph)
  routes/
    launchlab_routes.py            (V1 - /api/generate)
    langgraph_routes.py            (V2 - /api/v2/run-workflow)
```

### LangGraph dependencies

Already added to `backend/requirements.txt`:

```text
langgraph>=0.2.0,<0.5.0
langchain-core>=0.3.0,<0.4.0
```

Install with `pip install -r requirements.txt`. If you skip them, the v2 route gracefully degrades to the v1 manual orchestrator and tags the response as `v2 / mock-fallback / fallbackSteps: ["graph"]`.

### Demo script (class)

1. Open the dashboard with the toggle on **Manual v1** (default).
2. Click **Use Sample Idea** -> **Generate Product Package**. Walk the tabs. Show the **Manual v1** badge in the Mode banner and on the Workflow Map.
3. Open **Workflow Map**. Show the linear pipeline of stages.
4. Flip the toggle to **LangGraph v2**. Click **Generate Product Package** again on the same idea.
5. Same tabs, same content shape. Show the **LangGraph v2** badge.
6. Open **Workflow Map** again. The view now shows the six **graph nodes**, which ones **ran**, which ones **fell back**, plus the comparison table.
7. Talking points: "In v1, I called each model myself. In v2, every role is a graph node, the graph passes shared state, and adding retries / human-in-loop / parallel branches becomes a graph edit instead of an orchestrator rewrite."

### V2 troubleshooting

| Symptom | Fix |
| --- | --- |
| `v2 / mock-fallback / fallbackSteps: ["graph"]` | `langgraph` is not installed. Run `pip install -r backend/requirements.txt` and restart the backend. |
| `404 /api/v2/run-workflow` | Backend wasn't restarted after pulling V2. Restart `python app.py`. |
| Frontend toggle doesn't appear | Hard-refresh (`Ctrl+F5`) so the new bundle loads. |
| `partial-fallback` with the same fallback steps in both v1 and v2 | API key is missing for the failed step's provider. Set the right env var and restart. |
| LangGraph version conflict at install | Pin to the same `langchain-core` major as `langgraph`. The pinned ranges in `requirements.txt` already match. |

---

## Current limitations

- The Claude Build Prompt is generated as plain text (not strict JSON) on purpose.
- Provider timeouts are conservative (~45s); a slow OpenAI call still feels long in a live demo.
- Project history shows recent projects but no detail / delete UI inside the dashboard yet.
- Image generation requires an OpenAI org that has been verified for `gpt-image-1`.

## Future upgrades

- LangGraph branching graph (parallel campaign + visual prompt nodes).
- Per-node retries with exponential backoff inside the graph.
- Human-in-loop approval node before evaluation.
- LangGraph checkpointing / persistent runs.
- Streaming node progress to the frontend.
- PDF export of the package.
- Project sharing (public read-only links).
- Inline image gallery + per-project thumbnails.
- Deployment guides (Vercel + Render / Fly).
