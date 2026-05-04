import type { ReactNode } from "react";

type Props = {
  title: string;
  badge?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({ title, badge, icon, children, className = "" }: Props) {
  return (
    <section
      className={`glass rounded-2xl p-5 sm:p-6 shadow-glow ${className}`}
    >
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          {icon ? <span className="text-accent-cyan/90">{icon}</span> : null}
          <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white">
            {title}
          </h3>
        </div>
        {badge ? (
          <span className="text-[10px] sm:text-xs uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
            {badge}
          </span>
        ) : null}
      </header>
      <div className="text-sm sm:text-[15px] leading-relaxed text-white/80">{children}</div>
    </section>
  );
}
