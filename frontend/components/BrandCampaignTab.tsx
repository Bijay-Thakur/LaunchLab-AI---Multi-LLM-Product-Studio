import SectionCard from "./SectionCard";
import CopyButton from "./CopyButton";
import type { BrandCampaign } from "@/lib/types";
import { Megaphone, Heart, Sparkles, MessageSquareQuote, Send } from "lucide-react";

export default function BrandCampaignTab({ brand }: { brand: BrandCampaign }) {
  return (
    <div className="space-y-5">
      <section className="glass-strong rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
            ChatGPT Campaign Strategist Output
          </span>
          <Megaphone size={18} className="text-accent-peach" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
          {brand.brandName}
        </h2>
        <p className="text-accent-peach mt-1 italic">{brand.tagline}</p>
        <p className="text-white/75 mt-4 max-w-3xl">{brand.mission}</p>
      </section>

      <SectionCard title="Hero Copy" icon={<Sparkles size={16} />}>
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-wider text-white/50 mb-1">Headline</div>
            <p className="text-xl sm:text-2xl font-semibold text-white">{brand.heroHeadline}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-wider text-white/50 mb-1">Subheadline</div>
            <p className="text-white/85">{brand.heroSubheadline}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 rounded-xl btn-primary text-white text-sm font-medium">
              {brand.ctaPrimary}
            </span>
            <span className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-white/85 text-sm">
              {brand.ctaSecondary}
            </span>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Poster Copy" icon={<Heart size={16} />}>
          <div className="flex items-start justify-between gap-3">
            <pre className="whitespace-pre-wrap font-sans text-white/85">{brand.posterCopy}</pre>
            <CopyButton text={brand.posterCopy} />
          </div>
        </SectionCard>

        <SectionCard title="Social Caption" icon={<MessageSquareQuote size={16} />}>
          <div className="flex items-start justify-between gap-3">
            <p>{brand.socialCaption}</p>
            <CopyButton text={brand.socialCaption} />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Launch Announcement" icon={<Send size={16} />}>
        <div className="flex items-start justify-between gap-3">
          <p>{brand.launchAnnouncement}</p>
          <CopyButton text={brand.launchAnnouncement} />
        </div>
      </SectionCard>

      <SectionCard title="Voice & Tone">
        <div className="flex flex-wrap gap-2">
          {brand.voiceAndTone.map((v) => (
            <span
              key={v}
              className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-accent-violet/20 to-accent-blue/20 border border-white/10 text-white/85"
            >
              {v}
            </span>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
