import { cn } from "@/lib/utils";

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid size-9 place-items-center rounded-xl bg-brand shadow-glow">
        <svg viewBox="0 0 24 24" className="size-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M5 6h14M12 6v13" />
          <circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" />
          <path d="M7.5 10.5l-2 2 2 2M16.5 10.5l2 2-2 2" strokeWidth="1.6" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[17px] font-bold tracking-[0.14em] text-metal">TOUVIS</div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-primary/80">AI Platform</div>
        </div>
      )}
    </div>
  );
}
