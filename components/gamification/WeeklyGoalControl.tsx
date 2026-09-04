"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setWeeklyGoal } from "@/lib/gamification/actions";

const OPTIONS = [90, 150, 210, 300, 420];

export function WeeklyGoalControl({
  current,
  done,
}: {
  current: number;
  done: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [pending, start] = useTransition();
  const pct = Math.min(100, Math.round((done / Math.max(1, value)) * 100));

  function save(next: number) {
    setValue(next);
    start(async () => {
      await setWeeklyGoal(next);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Esta semana</span>
        <span className="text-foreground">
          {done} / {value} min ({pct}%)
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 100 ? "bg-emerald-400" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o}
            type="button"
            disabled={pending}
            onClick={() => save(o)}
            className={`h-8 rounded-lg border px-3 text-xs transition ${
              value === o
                ? "border-primary bg-primary-soft text-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {o} min
          </button>
        ))}
      </div>
    </div>
  );
}
