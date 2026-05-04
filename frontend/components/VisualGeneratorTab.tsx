import CopyButton from "./CopyButton";
import type { VisualPrompts } from "@/lib/types";
import { Image as ImageIcon, Frame, Palette, Network } from "lucide-react";

const ITEMS: { key: keyof VisualPrompts; title: string; icon: React.ReactNode }[] = [
  { key: "heroImage", title: "Hero Image", icon: <ImageIcon size={16} /> },
  { key: "campaignPoster", title: "Campaign Poster", icon: <Frame size={16} /> },
  { key: "uiMoodboard", title: "UI Moodboard", icon: <Palette size={16} /> },
  { key: "architectureDiagram", title: "Architecture Diagram", icon: <Network size={16} /> },
];

export default function VisualGeneratorTab({ visuals }: { visuals: VisualPrompts }) {
  return (
    <div className="space-y-5">
      <section className="glass-strong rounded-2xl p-6 sm:p-8">
        <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
          GPT Image Prompt Pack
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-3">
          Image generation prompts
        </h2>
        <p className="text-white/60 mt-2 max-w-2xl text-sm">
          Drop these into ChatGPT Image, Midjourney, or any text-to-image model. v1 only generates
          the prompts; image API calls are deferred to v2.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {ITEMS.map(({ key, title, icon }) => (
          <div
            key={key}
            className="glass rounded-2xl p-5 sm:p-6 flex flex-col gap-3 hover:translate-y-[-2px] transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white">
                <span className="text-accent-cyan/90">{icon}</span>
                <h3 className="font-semibold">{title}</h3>
              </div>
              <CopyButton text={visuals[key]} />
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-4 text-[13px] leading-relaxed text-white/85 font-mono">
              {visuals[key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
