import { Crown } from "lucide-react";

/** Selo Premium (spec §1). */
export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400 ${className}`}
    >
      <Crown className="h-3 w-3" />
      Premium
    </span>
  );
}
