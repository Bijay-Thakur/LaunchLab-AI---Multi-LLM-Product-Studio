import SectionCard from "./SectionCard";
import type { Research } from "@/lib/types";
import { Search, Users, Target, AlertTriangle, Compass, Shield, Lightbulb } from "lucide-react";

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((it, i) => (
      <li key={i} className="flex gap-2.5">
        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent-cyan/80 shrink-0" />
        <span>{it}</span>
      </li>
    ))}
  </ul>
);

export default function ResearchTab({ research }: { research: Research }) {
  return (
    <div className="space-y-5">
      <SectionCard title="Executive Summary" badge="Mock Gemini Output" icon={<Search size={16} />}>
        <p>{research.summary}</p>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Problem Validation" icon={<Target size={16} />}>
          <Bullets items={research.problemValidation} />
        </SectionCard>
        <SectionCard title="Target Users" icon={<Users size={16} />}>
          <Bullets items={research.targetUsers} />
        </SectionCard>
        <SectionCard title="User Pain Points" icon={<AlertTriangle size={16} />}>
          <Bullets items={research.painPoints} />
        </SectionCard>
        <SectionCard title="Existing Solutions" icon={<Compass size={16} />}>
          <Bullets items={research.existingSolutions} />
        </SectionCard>
      </div>

      <SectionCard title="Market Gap" icon={<Lightbulb size={16} />}>
        <p>{research.marketGap}</p>
      </SectionCard>

      <SectionCard title="Ethical Concerns" icon={<Shield size={16} />}>
        <Bullets items={research.ethicalConcerns} />
      </SectionCard>

      <SectionCard title="Recommended MVP Direction" icon={<Lightbulb size={16} />}>
        <p>{research.recommendedMvp}</p>
      </SectionCard>
    </div>
  );
}
