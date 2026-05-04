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

import {
  generateProductPackage,
  getSamplePackage,
  healthCheck,
} from "@/lib/api";
import { SAMPLE_IDEA } from "@/lib/constants";
import type { ProductPackage, TabId } from "@/lib/types";
import { AlertCircle, Info } from "lucide-react";

export default function HomePage() {
  const [rawIdea, setRawIdea] = useState("");
  const [pkg, setPkg] = useState<ProductPackage | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("raw");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    healthCheck().then((ok) => {
      if (mounted) setBackendOnline(ok);
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
      const result = await generateProductPackage(idea);
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
    <AppShell backendOnline={backendOnline}>
      <Hero />

      <div className="mt-6 space-y-5">
        <TabNavigation active={activeTab} onChange={setActiveTab} hasPackage={!!pkg} />

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
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
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
      return <VisualGeneratorTab visuals={p.pkg.visualPrompts} />;
    case "evaluation":
      return <EvaluationTab evaluation={p.pkg.evaluation} />;
    case "workflow":
      return <WorkflowMapTab workflow={p.pkg.workflow} />;
    default:
      return <EmptyState />;
  }
}
