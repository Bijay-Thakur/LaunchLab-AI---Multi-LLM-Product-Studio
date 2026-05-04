"use client";

import { TABS } from "@/lib/constants";
import type { TabId } from "@/lib/types";
import {
  Lightbulb,
  Search,
  LayoutGrid,
  Code2,
  Megaphone,
  Image as ImageIcon,
  ClipboardCheck,
  Workflow,
} from "lucide-react";

const ICONS: Record<TabId, React.ReactNode> = {
  raw: <Lightbulb size={16} />,
  research: <Search size={16} />,
  blueprint: <LayoutGrid size={16} />,
  claude: <Code2 size={16} />,
  brand: <Megaphone size={16} />,
  visual: <ImageIcon size={16} />,
  evaluation: <ClipboardCheck size={16} />,
  workflow: <Workflow size={16} />,
};

type Props = {
  active: TabId;
  onChange: (tab: TabId) => void;
  hasPackage: boolean;
};

export default function TabNavigation({ active, onChange, hasPackage }: Props) {
  return (
    <nav className="glass rounded-2xl p-2 flex flex-wrap gap-1.5">
      {TABS.map((t) => {
        const isActive = t.id === active;
        const isDisabled = t.id !== "raw" && !hasPackage;
        return (
          <button
            key={t.id}
            onClick={() => !isDisabled && onChange(t.id)}
            disabled={isDisabled}
            className={[
              "flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-xl transition relative",
              isActive
                ? "bg-gradient-to-r from-accent-violet/30 to-accent-blue/30 text-white shadow-glow border border-white/10"
                : "text-white/70 hover:text-white hover:bg-white/5",
              isDisabled ? "opacity-40 cursor-not-allowed hover:bg-transparent" : "",
            ].join(" ")}
            title={isDisabled ? "Generate a package first" : t.label}
          >
            {ICONS[t.id]}
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.short}</span>
          </button>
        );
      })}
    </nav>
  );
}
