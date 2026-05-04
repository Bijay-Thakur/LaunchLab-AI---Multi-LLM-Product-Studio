import type { TabId } from "./types";

export const SAMPLE_IDEA =
  "An app for international students who feel lonely after moving to the U.S.";

export const TABS: { id: TabId; label: string; short: string }[] = [
  { id: "raw", label: "Raw Idea", short: "Idea" },
  { id: "research", label: "Gemini Research", short: "Research" },
  { id: "blueprint", label: "Product Blueprint", short: "Blueprint" },
  { id: "claude", label: "Claude Build Prompt", short: "Build Prompt" },
  { id: "brand", label: "Brand & Campaign", short: "Brand" },
  { id: "visual", label: "Visual Generator", short: "Visuals" },
  { id: "evaluation", label: "Evaluation Report", short: "Evaluation" },
  { id: "workflow", label: "Workflow Map", short: "Workflow" },
];

export const MODEL_ROLES = [
  {
    name: "Human",
    role: "Orchestrator",
    description: "You shape the idea, review every output, and decide what ships.",
    accent: "from-amber-300 to-rose-300",
  },
  {
    name: "Gemini",
    role: "Research & Judge",
    description: "Validates the problem, maps the market, and scores the final package.",
    accent: "from-sky-300 to-cyan-300",
  },
  {
    name: "ChatGPT",
    role: "Architect & Strategist",
    description: "Turns research into a product blueprint, build prompt, and brand campaign.",
    accent: "from-emerald-300 to-teal-300",
  },
  {
    name: "Claude Code",
    role: "Coding Agent",
    description: "Builds the actual web app from a precise prompt.",
    accent: "from-violet-300 to-fuchsia-300",
  },
  {
    name: "GPT Image",
    role: "Visual Designer",
    description: "Generates hero, poster, moodboard, and architecture visuals.",
    accent: "from-pink-300 to-orange-300",
  },
];

export const API_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5000/api";
