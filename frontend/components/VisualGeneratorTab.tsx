"use client";

import {
  Image as ImageIcon,
  Frame,
  Palette,
  Network,
  Wand2,
  Download,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Ban,
  Hourglass,
  PowerOff,
  CreditCard,
  Sparkles,
} from "lucide-react";

import CopyButton from "./CopyButton";
import ImageGenerationLoader from "./loaders/ImageGenerationLoader";
import type { GeneratedImage, ImageType, VisualPrompts } from "@/lib/types";
import type { ImageCardsByType, ImageCardState } from "@/hooks/useImageGeneration";

const ITEMS: { key: keyof VisualPrompts; type: ImageType; title: string; icon: React.ReactNode }[] = [
  { key: "heroImage", type: "heroImage", title: "Hero Image", icon: <ImageIcon size={16} /> },
  { key: "campaignPoster", type: "campaignPoster", title: "Campaign Poster", icon: <Frame size={16} /> },
  { key: "uiMoodboard", type: "uiMoodboard", title: "UI Moodboard", icon: <Palette size={16} /> },
  { key: "architectureDiagram", type: "architectureDiagram", title: "Architecture Diagram", icon: <Network size={16} /> },
];

type Props = {
  visuals: VisualPrompts;
  cards: ImageCardsByType;
  onRegenerate: (type: ImageType, prompt: string) => void | Promise<void>;
  onRegenerateAll: () => void | Promise<void>;
  generatingAll: boolean;
};

export default function VisualGeneratorTab({
  visuals,
  cards,
  onRegenerate,
  onRegenerateAll,
  generatingAll,
}: Props) {
  return (
    <div className="space-y-5">
      <section className="glass-strong rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
              GPT Image Prompt Pack
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-3">
              Image generation
            </h2>
            <p className="text-white/60 mt-2 max-w-2xl text-sm">
              Images auto-generate as soon as the workflow finishes. Switch tabs freely - results
              persist. If image generation is unavailable, the prompt still works.
            </p>
          </div>
          <button
            type="button"
            onClick={onRegenerateAll}
            disabled={generatingAll}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 size={16} />
            {generatingAll ? "Regenerating all..." : "Regenerate all"}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {ITEMS.map(({ key, type, title, icon }) => {
          const state: ImageCardState = cards[type] ?? { status: "idle" };
          const promptText = visuals[key];
          const hasBytes = !!(state.image?.imageUrl || state.image?.imageBase64);
          const showImage = state.image && hasBytes && state.status !== "loading";
          const showLoading = state.status === "loading";
          const showFallback =
            state.status === "fallback" ||
            (state.status === "idle" && state.image && !hasBytes);
          const showQueued = state.status === "idle" && !state.image;

          return (
            <div
              key={key}
              className="glass rounded-2xl p-5 sm:p-6 flex flex-col gap-3 hover:translate-y-[-2px] transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-accent-cyan/90">{icon}</span>
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton text={promptText} label="Copy prompt" />
                </div>
              </div>

              {/* Image preview area. The render order matters: loading wins so a
                  regenerate-in-progress doesn't briefly flicker the prior state. */}
              {showLoading ? (
                <div className="relative">
                  <ImageGenerationLoader type={type} />
                  {/* If we had a previous image, peek at it dimly underneath so the
                      card doesn't feel like a reset. */}
                  {state.image && hasBytes && (
                    <img
                      src={state.image.imageUrl || state.image.imageBase64 || ""}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-20 pointer-events-none"
                    />
                  )}
                </div>
              ) : showImage && state.image ? (
                <GeneratedImageView
                  image={state.image}
                  onRegenerate={() => onRegenerate(type, promptText)}
                />
              ) : showFallback && state.image ? (
                <FallbackImageNotice
                  image={state.image}
                  onRetry={() => onRegenerate(type, promptText)}
                />
              ) : showQueued ? (
                <QueuedNotice
                  title={title}
                  isHero={type === "heroImage"}
                  onRunNow={() => onRegenerate(type, promptText)}
                  hasPrompt={!!(promptText && promptText.trim())}
                />
              ) : null}

              {/* Prompt body always visible */}
              <div className="rounded-xl bg-black/30 border border-white/10 p-4 text-[13px] leading-relaxed text-white/85 font-mono whitespace-pre-wrap">
                {promptText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GeneratedImageView({
  image,
  onRegenerate,
}: {
  image: GeneratedImage;
  onRegenerate: () => void;
}) {
  const src = image.imageUrl || image.imageBase64 || "";
  return (
    <div className="relative group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={image.title}
        className="w-full aspect-[16/10] object-cover rounded-xl border border-white/10 bg-black/30"
      />
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
        <a
          href={src}
          download={`${image.type}.png`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/15 bg-black/60 hover:bg-black/80 text-white/90"
        >
          <Download size={14} />
          Download
        </a>
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/15 bg-black/60 hover:bg-black/80 text-white/90"
        >
          <RefreshCw size={14} />
          Regenerate
        </button>
      </div>
    </div>
  );
}

function FallbackImageNotice({
  image,
  onRetry,
}: {
  image: GeneratedImage;
  onRetry: () => void;
}) {
  const { Icon, title, tone } = describeStatus(image.status);
  const message =
    image.message ||
    image.error ||
    "Image generation is unavailable for this OpenAI account/model. Your prompt is still ready to copy or use manually.";

  return (
    <div
      className={`aspect-[16/10] rounded-xl border ${tone.border} ${tone.bg} flex flex-col items-center justify-center text-center px-4 gap-2`}
    >
      <Icon size={18} className={tone.icon} />
      <div className={`text-sm font-medium ${tone.title}`}>{title}</div>
      <p className={`${tone.body} text-xs max-w-xs leading-relaxed`}>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/90"
      >
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

function QueuedNotice({
  title,
  isHero,
  hasPrompt,
  onRunNow,
}: {
  title: string;
  isHero: boolean;
  hasPrompt: boolean;
  onRunNow: () => void;
}) {
  const Icon = isHero ? Hourglass : Sparkles;
  const heading = isHero ? "Queued for generation" : "Manual generation";
  const body = !hasPrompt
    ? "Prompt not available yet."
    : isHero
      ? `${title} will start automatically. Click below to run it now.`
      : `${title} is generated on demand to keep image quota safe. Click Generate to render it.`;

  return (
    <div className="aspect-[16/10] rounded-xl border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center text-center px-4 gap-2">
      <Icon size={18} className="text-white/55" />
      <div className="text-sm font-medium text-white/80">{heading}</div>
      <p className="text-white/50 text-xs max-w-xs leading-relaxed">{body}</p>
      {hasPrompt && (
        <button
          type="button"
          onClick={onRunNow}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white/90"
        >
          <Wand2 size={14} /> {isHero ? "Generate now" : "Generate image"}
        </button>
      )}
    </div>
  );
}

function describeStatus(status: GeneratedImage["status"]) {
  switch (status) {
    case "disabled":
      return {
        Icon: PowerOff,
        title: "Image generation disabled",
        tone: {
          border: "border-white/15",
          bg: "bg-white/[0.04]",
          icon: "text-white/70",
          title: "text-white/90",
          body: "text-white/65",
        },
      };
    case "billing_limit":
      return {
        Icon: CreditCard,
        title: "Billing limit reached",
        tone: {
          border: "border-rose-300/20",
          bg: "bg-rose-300/5",
          icon: "text-rose-300",
          title: "text-rose-100",
          body: "text-rose-200/85",
        },
      };
    case "quota_exceeded":
      return {
        Icon: CreditCard,
        title: "Quota unavailable",
        tone: {
          border: "border-amber-300/20",
          bg: "bg-amber-300/5",
          icon: "text-amber-300",
          title: "text-amber-100",
          body: "text-amber-200/85",
        },
      };
    case "permission_denied":
      return {
        Icon: ShieldAlert,
        title: "Image generation not enabled",
        tone: {
          border: "border-sky-300/20",
          bg: "bg-sky-300/5",
          icon: "text-sky-300",
          title: "text-sky-100",
          body: "text-sky-200/85",
        },
      };
    case "rate_limited":
      return {
        Icon: Clock,
        title: "Rate limited",
        tone: {
          border: "border-amber-300/20",
          bg: "bg-amber-300/5",
          icon: "text-amber-300",
          title: "text-amber-100",
          body: "text-amber-200/85",
        },
      };
    case "model_unavailable":
      return {
        Icon: Ban,
        title: "Model unavailable",
        tone: {
          border: "border-amber-300/20",
          bg: "bg-amber-300/5",
          icon: "text-amber-300",
          title: "text-amber-100",
          body: "text-amber-200/85",
        },
      };
    case "timeout":
      return {
        Icon: Clock,
        title: "Image timed out",
        tone: {
          border: "border-amber-300/20",
          bg: "bg-amber-300/5",
          icon: "text-amber-300",
          title: "text-amber-100",
          body: "text-amber-200/85",
        },
      };
    default:
      return {
        Icon: AlertTriangle,
        title: "Image unavailable",
        tone: {
          border: "border-amber-300/20",
          bg: "bg-amber-300/5",
          icon: "text-amber-300",
          title: "text-amber-100",
          body: "text-amber-200/85",
        },
      };
  }
}
