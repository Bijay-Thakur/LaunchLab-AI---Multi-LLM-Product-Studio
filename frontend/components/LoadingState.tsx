import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Generating product package..." }: { label?: string }) {
  return (
    <div className="glass rounded-2xl p-10 flex flex-col items-center justify-center text-center">
      <Loader2 className="animate-spin text-accent-cyan mb-3" size={28} />
      <p className="text-white/80 text-sm">{label}</p>
      <p className="text-white/40 text-xs mt-1">Routing through the multi-LLM workflow.</p>
    </div>
  );
}
