import { RECURRENCE } from "@/lib/biblioteca/recurrence";
import type { Recurrence } from "@/lib/biblioteca/types";
import { cn } from "@/lib/utils";

export function RecurrenceBadge({
  recurrence,
  variant = "full",
  className,
}: {
  recurrence: Recurrence;
  variant?: "full" | "dot" | "compact";
  className?: string;
}) {
  const meta = RECURRENCE[recurrence];

  if (variant === "dot") {
    return (
      <span title={`Recorrência ENEM: ${meta.label}`} className={className}>
        {meta.dot}
      </span>
    );
  }

  return (
    <span
      title={meta.short}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-medium",
        meta.color,
        className
      )}
    >
      <span aria-hidden>{meta.dot}</span>
      {variant === "full" ? meta.label : null}
    </span>
  );
}
