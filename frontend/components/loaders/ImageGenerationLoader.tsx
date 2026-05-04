"use client";

import { motion } from "framer-motion";
import type { ImageType } from "@/lib/types";

const VERBS: Record<ImageType, string> = {
  heroImage: "Generating hero image",
  campaignPoster: "Rendering campaign poster",
  uiMoodboard: "Creating UI moodboard",
  architectureDiagram: "Drawing architecture diagram",
  socialGraphic: "Composing social graphic",
};

export default function ImageGenerationLoader({ type }: { type: ImageType }) {
  return (
    <div className="aspect-[16/10] rounded-xl relative overflow-hidden border border-white/10 bg-black/30">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(110deg, transparent 0%, rgba(139,92,246,0.18) 35%, rgba(56,189,248,0.18) 50%, rgba(34,211,238,0.18) 65%, transparent 100%)",
          backgroundSize: "220% 100%",
        }}
        animate={{ backgroundPosition: ["-100% 0%", "200% 0%"] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <div className="flex items-center gap-2 text-white/85 text-sm">
          <motion.span
            className="inline-block w-2 h-2 rounded-full bg-accent-cyan"
            animate={{ scale: [0.6, 1, 0.6], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span>{VERBS[type]}…</span>
        </div>
        <div className="text-[11px] text-white/50 mt-1">First render can take 10-30s.</div>
      </div>
    </div>
  );
}
