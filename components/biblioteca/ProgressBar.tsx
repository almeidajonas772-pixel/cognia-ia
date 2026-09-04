import { cn } from "@/lib/utils";

export function ProgressBar({
  done,
  total,
  showLabel = true,
  className,
}: {
  done: number;
  total: number;
  showLabel?: boolean;
  className?: string;
}) {
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted">
          {done} de {total} concluídos · {pct}%
        </p>
      )}
    </div>
  );
}
