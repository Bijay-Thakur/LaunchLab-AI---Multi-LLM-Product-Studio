import type { ProductPackage } from "./types";
import { SAMPLE_IDEA } from "./constants";

const PRODUCT_NAME = "BridgeMate";

export function buildFallbackPackage(idea: string): ProductPackage {
  const rawIdea = idea?.trim() || SAMPLE_IDEA;
  return {
    rawIdea,
    research: {
      summary:
        "International students transitioning to U.S. universities face a sharp social and emotional adjustment in their first 6-12 months. Existing tools focus on logistics (housing, visas) but underserve the deeper loneliness, cultural disorientation, and mental-health gap.",
      problemValidation: [
        "60%+ of international students report severe loneliness in the first semester (NAFSA, university counseling reports).",
        "Most arrive without local social capital and rely on a few classmates from the same country.",
        "Counseling services are stretched thin and often culturally mismatched.",
        "Generic friendship apps (Bumble BFF, Meetup) are not tuned for the international student context.",
      ],
      targetUsers: [
        "Undergraduate international students (ages 18-22) in first year of U.S. study.",
        "Master's students relocating alone to a new city.",
        "PhD students in small cohorts who lack a built-in peer group.",
        "Exchange / visiting students staying for one or two semesters.",
      ],
      painPoints: [
        "No easy way to find peers from a similar background nearby.",
        "Stigma around admitting loneliness or asking for help.",
        "Cultural and language barriers in joining American social circles.",
        "Existing campus events feel performative or overwhelming.",
        "Mental-health resources feel clinical and intimidating.",
      ],
      existingSolutions: [
        "WhatsApp / WeChat country-of-origin groups - large, noisy, hard to find friends.",
        "University ISO offices - logistical, not emotional support.",
        "Bumble BFF / Meetup - not contextual to international student life.",
        "TalkLife / 7 Cups - peer support but generic and U.S.-centric.",
      ],
      marketGap:
        "There is no warm, low-pressure, culturally-aware product that bridges social belonging and lightweight mental wellness for international students. The opportunity sits between friendship apps and mental-health apps - a 'soft landing' product.",
      ethicalConcerns: [
        "Mental-health features must avoid pretending to be therapy.",
        "User data must never be sold to recruiters or universities.",
        "Matching must be opt-in and avoid reinforcing only same-country bubbles.",
        "Crisis content must route to verified human resources, not LLMs.",
      ],
      recommendedMvp:
        "Build a small, opinionated app that pairs new international students with a 'BridgeMate' - a slightly more senior international student at the same university - plus a weekly themed group hangout and a private journaling space with optional gentle reflections. Skip therapy features in v1.",
    },
    blueprint: {
      productName: PRODUCT_NAME,
      onelinePitch:
        "BridgeMate is a soft landing app that pairs new international students with a senior peer mentor and a small weekly group, so the first semester abroad feels less lonely.",
      targetUsers: [
        "First-year international undergraduate and master's students in the U.S.",
        "Senior international students who want to mentor and earn small stipends or credit.",
        "University international student offices that want better retention outcomes.",
      ],
      coreFeatures: [
        {
          name: "BridgeMate Match",
          description:
            "Pairs each new student with a senior international peer based on country, language, major, and shared interests.",
        },
        {
          name: "Weekly Pods",
          description:
            "Small 4-6 person groups that meet weekly around themed prompts (food, homesickness, exam stress).",
        },
        {
          name: "Soft Journal",
          description:
            "Private space for short daily reflections with gentle, non-clinical prompts.",
        },
        {
          name: "Campus Pulse",
          description: "Curated, low-pressure campus events filtered for international students.",
        },
        {
          name: "Crisis Bridge",
          description:
            "One tap to access verified human counselors and the campus international office.",
        },
      ],
      userJourney: [
        "Onboarding: pick country, university, language, vibe.",
        "Day 1: matched with a BridgeMate senior peer, exchange first message.",
        "Week 1: invited to a Weekly Pod with 4 other students.",
        "Ongoing: gentle journal prompts, optional pod meetups, curated events.",
        "Anytime: tap Crisis Bridge to reach real counselors instantly.",
      ],
      mvpScope: [
        "Authentication via university email.",
        "Matching algorithm (rule-based first, ML later).",
        "1:1 chat with a BridgeMate.",
        "Pod chat + scheduling.",
        "Soft journal with prompts.",
        "Static event feed (manually curated).",
        "Crisis Bridge resource page.",
      ],
      pagesNeeded: [
        "Landing page",
        "Onboarding flow",
        "Home feed",
        "BridgeMate chat",
        "Weekly Pod room",
        "Soft Journal",
        "Campus Pulse",
        "Crisis Bridge",
        "Profile & settings",
      ],
      successMetrics: [
        "% of new users who message their BridgeMate within 48 hours.",
        "Weekly active users in their first 30 days.",
        "Pod attendance rate by week 4.",
        "Self-reported loneliness score change after 6 weeks.",
        "Crisis Bridge reach time (under 60 seconds).",
      ],
    },
    claudeBuildPrompt: `You are Claude Code, a senior full-stack engineer.

PROJECT: BridgeMate - a soft-landing web app that helps new international students in the U.S. feel less lonely by pairing them with a senior peer mentor (a "BridgeMate"), placing them in a small Weekly Pod, and giving them a private Soft Journal.

PRIMARY USER: A first-year international student, age 18-22, just arrived in the U.S., emotionally overwhelmed, low trust in clinical tools, high trust in peers from a similar background.

DESIGN PRINCIPLES:
- Warm, not clinical. Soft gradients, generous spacing, friendly copy.
- Calm by default. No streaks, no engagement-bait, no notifications spam.
- Privacy first. Journal entries never leave the device until the user explicitly shares.
- Cultural respect. Never assume English fluency. Never collapse identity to a country flag.

TECH STACK:
- Next.js 14 (App Router) + React + TypeScript
- Tailwind CSS for styling
- shadcn/ui for primitives (Button, Card, Dialog, Input, Textarea)
- Framer Motion for subtle transitions
- Lucide React for icons
- Local mock data only in v1 (no backend yet)

PAGES TO BUILD:
1. /                Landing page with hero, three feature cards, soft CTA.
2. /onboarding      Multi-step form: country, university, language, vibe tags.
3. /home            Dashboard with BridgeMate card, today's Pod, journal nudge, Campus Pulse strip.
4. /bridgemate      1:1 chat with mentor (mock messages).
5. /pod             Weekly Pod room with this week's theme + member avatars + chat.
6. /journal         Soft Journal with daily prompt and entry list.
7. /pulse           Curated campus events filtered for international students.
8. /crisis          Crisis Bridge page with verified counselor contacts.

COMPONENTS TO BUILD:
- AppShell with sidebar nav, soft gradient background.
- BridgeMateCard, PodCard, JournalPromptCard, EventCard, CrisisCard.
- SoftPrompt component for journal prompts.
- VibeTagPicker for onboarding.

DATA MODEL (TypeScript types in /lib/types.ts):
- User { id, name, country, university, language, vibeTags, role: 'new' | 'bridgemate' }
- Match { id, userId, bridgemateId, status }
- Pod { id, theme, weekOf, memberIds, scheduledAt }
- JournalEntry { id, userId, prompt, body, createdAt, isPrivate: true }
- Event { id, title, when, where, tags, isInternationalFriendly }

MOCK DATA: Seed /lib/mockData.ts with one realistic user, one matched BridgeMate, one Pod with 4 members, 3 journal entries, 6 events. Make it feel real.

ACCEPTANCE CRITERIA:
1. App runs on \`npm run dev\` with no errors.
2. All 8 routes render with mock data.
3. Onboarding flow can complete and route to /home.
4. Soft Journal can add a new entry locally (useState).
5. Crisis Bridge page is reachable from every screen via a persistent footer link.
6. Mobile responsive down to 375px.
7. No clinical, alarming, or gamified copy anywhere.
8. No external API calls.

ETHICAL CONSTRAINTS:
- Do NOT add streaks, badges, or engagement metrics.
- Do NOT add an AI chatbot pretending to be a friend in v1.
- Do NOT collect mental-health data beyond journal entries that stay local.
- Crisis Bridge MUST link to real-style human resources, never to an LLM.

OUTPUT:
Return the project file by file. Start with the directory tree, then each file's full contents. Keep code clean, typed, and readable. Prefer small components over big ones. After the code, list any TODOs you deferred and why.

Begin now.`,
    brandCampaign: {
      brandName: PRODUCT_NAME,
      tagline: "A softer landing in your new country.",
      mission:
        "BridgeMate exists so that no international student has to face their first semester abroad alone. We pair newcomers with senior peers who have been exactly where they are.",
      heroHeadline: "Your first semester abroad, less lonely.",
      heroSubheadline:
        "BridgeMate matches you with a senior international student at your university and a small weekly pod, so the hardest part of moving doesn't have to be the loneliest.",
      ctaPrimary: "Find my BridgeMate",
      ctaSecondary: "How it works",
      posterCopy:
        "New country. New campus. New everything.\nYou don't have to figure it out alone.\nMeet your BridgeMate this week.",
      socialCaption:
        "Moving abroad is the hardest soft thing you'll ever do. BridgeMate pairs you with a senior international student who's been exactly where you are. First semester, but warmer. #BridgeMate #StudyAbroad",
      launchAnnouncement:
        "Today we're opening BridgeMate to international students at 12 U.S. universities. If you remember what your first month abroad felt like, you know why we built this. Sign up, get matched in 48 hours, and join a Weekly Pod that meets every Sunday.",
      voiceAndTone: [
        "Warm, not clinical.",
        "Plain English, never assumes fluency.",
        "Respectful of cultural difference.",
        "Quiet confidence, never hype.",
      ],
    },
    visualPrompts: {
      heroImage:
        "Editorial photograph of a young international student standing on a quiet university quad at golden hour, soft sunlight, slight motion blur of other students walking past, warm autumn tones, shallow depth of field, hopeful and slightly bittersweet mood, cinematic 35mm look, no logos, no text, 16:9 aspect ratio.",
      campaignPoster:
        "Minimalist campaign poster, soft gradient background blending warm peach and deep navy, centered serif headline 'A softer landing in your new country.', small BridgeMate wordmark in lower right, an illustrated paper-airplane icon trailing a thin line across the poster, generous negative space, premium print feel, 2:3 portrait ratio.",
      uiMoodboard:
        "UI moodboard for a calm, warm web app for international students. Color palette: deep navy background, warm cream text, accent gradients of peach to violet. Typography: large humanist serif for headlines, clean geometric sans for body. Components: rounded-2xl cards with soft inner glow, soft drop shadows, no harsh borders, gentle micro-illustrations of birds, paper boats, and lanterns. Mood: hopeful, quiet, slightly homesick. 4 panels in a 2x2 grid.",
      architectureDiagram:
        "Clean technical architecture diagram for a web app named BridgeMate. Three vertical lanes labeled 'Client (Next.js)', 'API (Flask)', and 'Data (Postgres)'. Show arrows from Client through API to Data, and side modules for Matching Service, Pod Scheduler, Soft Journal Store, and Crisis Bridge Resource. Use a dark navy background, soft cyan and violet accent lines, minimalist icons, clear monospaced labels, 16:9 landscape, presentation-ready.",
    },
    evaluation: {
      scores: {
        productMarketFit: 86,
        userEmpathy: 92,
        technicalFeasibility: 88,
        ethicalSafety: 90,
        accessibility: 78,
        campaignQuality: 84,
        overallReadiness: 86,
      },
      strengths: [
        "Sharp, underserved audience with measurable pain.",
        "Clear emotional product premise that translates into a simple MVP.",
        "Ethical guardrails are built into the product, not bolted on.",
        "Brand voice is warm and distinct, not generic SaaS.",
        "Workflow demonstrates genuine multi-LLM orchestration.",
      ],
      weaknesses: [
        "No accessibility audit yet (color contrast, screen reader, language).",
        "Matching algorithm is rule-based and may reinforce same-country bubbles.",
        "Mentor incentives and abuse moderation are underspecified.",
        "No clear monetization path past v1.",
        "Crisis Bridge needs verified human partners before launch.",
      ],
      recommendedImprovements: [
        "Run a 5-user diary study with real international students before coding.",
        "Add WCAG 2.1 AA accessibility checklist to the build prompt.",
        "Add a moderation and reporting system in MVP, not v2.",
        "Partner with at least one university counseling center before public launch.",
        "Translate onboarding into the top 5 source-country languages on day one.",
      ],
      judgeNotes:
        "Overall, this concept is unusually thoughtful for a v1. The biggest risk is not technical, it is ethical: shipping a peer-support product without real moderation and crisis partners. Address that before the campaign goes live.",
    },
    workflow: [
      {
        stage: "Raw Idea",
        owner: "Human",
        model: "You",
        description: "A messy, human-shaped sentence describing a real problem.",
      },
      {
        stage: "Research",
        owner: "Research Analyst",
        model: "Gemini",
        description: "Validates the problem, maps the market, surfaces ethical concerns.",
      },
      {
        stage: "Product Architecture",
        owner: "Product Architect",
        model: "ChatGPT",
        description: "Turns research into a named product with features, journey, and MVP scope.",
      },
      {
        stage: "Build Prompt",
        owner: "Prompt Engineer",
        model: "ChatGPT",
        description:
          "Compiles a precise Claude Code build brief with constraints and acceptance criteria.",
      },
      {
        stage: "Code",
        owner: "Coding Agent",
        model: "Claude Code",
        description: "Generates the actual web app from the build prompt.",
      },
      {
        stage: "Brand & Campaign",
        owner: "Campaign Strategist",
        model: "ChatGPT",
        description: "Writes brand voice, hero copy, posters, and launch announcements.",
      },
      {
        stage: "Visuals",
        owner: "Visual Designer",
        model: "GPT Image",
        description: "Produces hero image, poster, moodboard, and architecture diagram prompts.",
      },
      {
        stage: "Evaluation",
        owner: "Evaluation Judge",
        model: "Gemini",
        description: "Scores the package on fit, empathy, feasibility, ethics, and readiness.",
      },
      {
        stage: "Final Package",
        owner: "Human",
        model: "You",
        description: "Reviews, edits, and decides what ships.",
      },
    ],
  };
}
