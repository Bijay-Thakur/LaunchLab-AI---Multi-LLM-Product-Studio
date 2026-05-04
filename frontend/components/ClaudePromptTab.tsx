import CopyButton from "./CopyButton";
import { Code2, Terminal } from "lucide-react";

export default function ClaudePromptTab({ prompt }: { prompt: string }) {
  return (
    <div className="space-y-5">
      <section className="glass-strong rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 mb-3">
              <Code2 size={12} /> ChatGPT Prompt Engineer Output
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Claude Code Build Prompt
            </h2>
            <p className="text-white/60 mt-2 max-w-2xl text-sm">
              Paste this directly into Claude Code or Cursor to build the product. It encodes the
              blueprint, design principles, ethical constraints, and acceptance criteria.
            </p>
          </div>
          <CopyButton text={prompt} label="Copy prompt" />
        </div>
      </section>

      <section className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-2 text-white/70 text-xs">
            <Terminal size={14} />
            <span className="font-mono">build-prompt.md</span>
          </div>
          <CopyButton text={prompt} label="Copy" />
        </div>
        <pre className="p-4 sm:p-6 text-[12.5px] sm:text-[13.5px] leading-relaxed font-mono text-white/85 whitespace-pre-wrap overflow-x-auto max-h-[70vh]">
{prompt}
        </pre>
      </section>
    </div>
  );
}
