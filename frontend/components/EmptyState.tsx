import { Sparkles } from "lucide-react";

type Props = { title?: string; subtitle?: string };

export default function EmptyState({
  title = "No package generated yet.",
  subtitle = "Head to the Raw Idea tab and click Generate Product Package.",
}: Props) {
  return (
    <div className="glass rounded-2xl p-10 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-blue flex items-center justify-center mb-4">
        <Sparkles className="text-white" size={22} />
      </div>
      <h3 className="text-white font-medium">{title}</h3>
      <p className="text-white/60 text-sm mt-1 max-w-md">{subtitle}</p>
    </div>
  );
}
