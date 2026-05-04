"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import AppShell from "@/components/AppShell";
import TabNavigation from "@/components/TabNavigation";
import RawIdeaTab from "@/components/RawIdeaTab";
import ResearchTab from "@/components/ResearchTab";
import BlueprintTab from "@/components/BlueprintTab";
import ClaudePromptTab from "@/components/ClaudePromptTab";
import BrandCampaignTab from "@/components/BrandCampaignTab";
import VisualGeneratorTab from "@/components/VisualGeneratorTab";
import EvaluationTab from "@/components/EvaluationTab";
import WorkflowMapTab from "@/components/WorkflowMapTab";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import WorkflowLoader from "@/components/loaders/WorkflowLoader";
import SaveProjectButton from "@/components/SaveProjectButton";
import ProjectHistory from "@/components/ProjectHistory";

import {
  generateProductPackage,
  getSamplePackage,
  healthCheck,
  type HealthStatus,
} from "@/lib/api";
import { SAMPLE_IDEA } from "@/lib/constants";
import type { ProductPackage, ProviderWarning, TabId, WorkflowMode } from "@/lib/types";
import { AlertCircle, CheckCircle2, Info, GitBranch, Workflow as WorkflowIcon, AlertTriangle } from "lucide-react";
import { useImageGeneration } from "@/hooks/useImageGeneration";

const WORKFLOW_MODE_KEY = "launchlab.workflowMode";

export default function HomePage() {
  const [rawIdea, setRawIdea] = useState("");
  const [pkg, setPkg] = useState<ProductPackage | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("raw");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("manual");

  // Persist the demo's chosen workflow mode across reloads.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(WORKFLOW_MODE_KEY);
      if (saved === "manual" || saved === "langgraph") setWorkflowMode(saved);
    } catch {
      /* localStorage may be unavailable; safe to ignore. */
    }
  }, []);

  const onWorkflowModeChange = (mode: WorkflowMode) => {
    setWorkflowMode(mode);
    try {
      window.localStorage.setItem(WORKFLOW_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  // Image generation owns its own card state at the page level so that
  // tab-switching never unmounts the results. The hook also auto-fires the
  // first generation per (type, prompt) pair and protects against loops.
  const imageGen = useImageGeneration(pkg);

  useEffect(() => {
    let mounted = true;
    healthCheck().then((h) => {
      if (mounted) setHealth(h);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const runGenerate = async (idea: string) => {
    setError(null);
    setWarning(null);
    setLoading(true);
    try {
      const result = await generateProductPackage(idea, workflowMode);
      setPkg(result.data);
      if (result.warning) setWarning(result.warning);
      setActiveTab("research");
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const runUseSample = async () => {
    setError(null);
    setWarning(null);
    setRawIdea(SAMPLE_IDEA);
    setLoading(true);
    try {
      const result = await getSamplePackage();
      setPkg(result.data);
      if (result.warning) setWarning(result.warning);
      setActiveTab("research");
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell health={health}>
      <Hero />

      <div className="mt-6 space-y-5">
        <ProjectHistory
          refreshKey={historyKey}
          onLoad={(loaded, idea) => {
            setPkg(loaded);
            setRawIdea(idea);
            setActiveTab("research");
          }}
        />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabNavigation active={activeTab} onChange={setActiveTab} hasPackage={!!pkg} />
          <div className="flex items-center gap-2 flex-wrap">
            <WorkflowModeToggle value={workflowMode} onChange={onWorkflowModeChange} />
            {pkg && (
              <SaveProjectButton
                pkg={pkg}
                images={imageGen.snapshotImages()}
                onSaved={() => setHistoryKey((k) => k + 1)}
              />
            )}
          </div>
        </div>

        {pkg && <ModeBanner pkg={pkg} />}
        {pkg && pkg.providerWarnings && pkg.providerWarnings.length > 0 && (
          <ProviderWarnings warnings={pkg.providerWarnings} />
        )}
        {warning && (
          <div className="flex items-start gap-2.5 text-sm rounded-xl px-4 py-3 border border-amber-300/20 bg-amber-300/5 text-amber-200/90">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>{warning}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2.5 text-sm rounded-xl px-4 py-3 border border-rose-400/20 bg-rose-400/5 text-rose-200/90">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && activeTab !== "raw" ? (
          <WorkflowLoader rawIdea={rawIdea} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {renderTab(activeTab, {
                rawIdea,
                setRawIdea,
                onGenerate: () => runGenerate(rawIdea),
                onUseSample: runUseSample,
                loading,
                pkg,
                imageCards: imageGen.cards,
                onRegenerateImage: imageGen.regenerate,
                onRegenerateAllImages: imageGen.generateAll,
                generatingAllImages: imageGen.generatingAll,
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </AppShell>
  );
}

function ModeBanner({ pkg }: { pkg: ProductPackage }) {
  const mode = pkg.mode ?? "mock-fallback";
  if (mode === "live") {
    return (
      <div className="flex items-start gap-2.5 text-sm rounded-xl px-4 py-3 border border-emerald-300/20 bg-emerald-300/5 text-emerald-200/90">
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
        <span className="flex-1">
          Live multi-LLM generation complete - {pkg.liveSteps ?? 6}/{pkg.totalSteps ?? 6} steps used
          real APIs.
        </span>
        <VersionBadge pkg={pkg} />
      </div>
    );
  }
  if (mode === "partial-fallback") {
    const failed = pkg.errors?.map((e) => e.step).join(", ") || "some steps";
    return (
      <div className="flex items-start gap-2.5 text-sm rounded-xl px-4 py-3 border border-sky-300/20 bg-sky-300/5 text-sky-200/90">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span className="flex-1">
          Live generation completed with fallback support ({pkg.liveSteps ?? 0}/{pkg.totalSteps ?? 6}{" "}
          live). Mock fallback used for: {failed}.
        </span>
        <VersionBadge pkg={pkg} />
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 text-sm rounded-xl px-4 py-3 border border-amber-300/20 bg-amber-300/5 text-amber-200/90">
      <Info size={16} className="mt-0.5 shrink-0" />
      <span className="flex-1">Using mock fallback data for demo safety. Add API keys to enable live generation.</span>
      <VersionBadge pkg={pkg} />
    </div>
  );
}

function ProviderWarnings({ warnings }: { warnings: ProviderWarning[] }) {
  // De-duplicate by `${provider}::${step}::${code}` so a noisy run doesn't
  // produce a wall of repeated chips.
  const seen = new Set<string>();
  const unique = warnings.filter((w) => {
    const k = `${w.provider}::${w.step}::${w.code}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (unique.length === 0) return null;
  return (
    <div className="rounded-xl px-4 py-3 border border-amber-300/20 bg-amber-300/5">
      <div className="flex items-center gap-2 text-amber-200/90 text-xs font-medium uppercase tracking-wider mb-2">
        <AlertTriangle size={14} />
        Provider warnings
      </div>
      <ul className="space-y-1.5">
        {unique.map((w, i) => (
          <li
            key={`${w.provider}-${w.step}-${w.code}-${i}`}
            className="flex items-start gap-2 text-sm text-amber-100/90"
          >
            <span className="text-[10px] uppercase tracking-widest text-amber-200/60 mt-1 shrink-0 w-20">
              {w.provider}
            </span>
            <span className="flex-1">{w.message}</span>
            <span className="text-[10px] uppercase tracking-widest text-amber-200/55 mt-1 shrink-0">
              {w.code}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VersionBadge({ pkg }: { pkg: ProductPackage }) {
  const isV2 = pkg.workflowMode === "langgraph" || pkg.version === "v2";
  const label = isV2 ? "LangGraph v2" : "Manual v1";
  const Icon = isV2 ? GitBranch : WorkflowIcon;
  const tone = isV2
    ? "border-violet-300/30 bg-violet-300/10 text-violet-100"
    : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  const nodesRun = pkg.graphMetadata?.nodesRun?.length;
  return (
    <span
      title={
        isV2 && nodesRun != null
          ? `LangGraph workflow - ${nodesRun} node${nodesRun === 1 ? "" : "s"} executed`
          : isV2
            ? "Generated by LangGraph workflow"
            : "Generated by manual orchestration"
      }
      className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${tone}`}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

function WorkflowModeToggle({
  value,
  onChange,
}: {
  value: WorkflowMode;
  onChange: (m: WorkflowMode) => void;
}) {
  const opt = (m: WorkflowMode, label: string, Icon: typeof WorkflowIcon) => {
    const active = value === m;
    return (
      <button
        type="button"
        onClick={() => onChange(m)}
        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition ${
          active
            ? "bg-white/10 text-white shadow-inner"
            : "text-white/60 hover:text-white/85 hover:bg-white/5"
        }`}
        aria-pressed={active}
      >
        <Icon size={13} />
        {label}
      </button>
    );
  };
  return (
    <div
      role="radiogroup"
      aria-label="Workflow mode"
      className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.03] p-0.5"
    >
      {opt("manual", "Manual v1", WorkflowIcon)}
      {opt("langgraph", "LangGraph v2", GitBranch)}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden glass-strong rounded-3xl p-6 sm:p-10">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
          v1 demo - mock data, zero API keys required
        </span>
        <h1 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-white max-w-3xl">
          Turn a messy idea into a <span className="gradient-text">launch-ready</span> product
          package.
        </h1>
        <p className="mt-3 text-white/65 max-w-2xl text-sm sm:text-base">
          LaunchLab AI orchestrates a multi-LLM workflow - Gemini researches, ChatGPT architects
          and writes, Claude Code builds, GPT Image visualizes, Gemini judges. You stay in the
          driver's seat.
        </p>
      </div>
    </section>
  );
}

type TabRenderProps = {
  rawIdea: string;
  setRawIdea: (v: string) => void;
  onGenerate: () => void;
  onUseSample: () => void;
  loading: boolean;
  pkg: ProductPackage | null;
  imageCards: ReturnType<typeof useImageGeneration>["cards"];
  onRegenerateImage: ReturnType<typeof useImageGeneration>["regenerate"];
  onRegenerateAllImages: ReturnType<typeof useImageGeneration>["generateAll"];
  generatingAllImages: boolean;
};

function renderTab(tab: TabId, p: TabRenderProps) {
  if (tab === "raw") {
    return (
      <RawIdeaTab
        rawIdea={p.rawIdea}
        setRawIdea={p.setRawIdea}
        onGenerate={p.onGenerate}
        onUseSample={p.onUseSample}
        loading={p.loading}
      />
    );
  }
  if (p.loading) return <LoadingState />;
  if (!p.pkg) return <EmptyState />;
  switch (tab) {
    case "research":
      return <ResearchTab research={p.pkg.research} />;
    case "blueprint":
      return <BlueprintTab blueprint={p.pkg.blueprint} />;
    case "claude":
      return <ClaudePromptTab prompt={p.pkg.claudeBuildPrompt} />;
    case "brand":
      return <BrandCampaignTab brand={p.pkg.brandCampaign} />;
    case "visual":
      return (
        <VisualGeneratorTab
          visuals={p.pkg.visualPrompts}
          cards={p.imageCards}
          onRegenerate={p.onRegenerateImage}
          onRegenerateAll={p.onRegenerateAllImages}
          generatingAll={p.generatingAllImages}
        />
      );
    case "evaluation":
      return <EvaluationTab evaluation={p.pkg.evaluation} />;
    case "workflow":
      return <WorkflowMapTab workflow={p.pkg.workflow} pkg={p.pkg} />;
    default:
      return <EmptyState />;
  }
}
