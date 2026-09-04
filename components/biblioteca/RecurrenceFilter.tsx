"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RECURRENCE, RECURRENCE_OPTIONS } from "@/lib/biblioteca/recurrence";
import { cn } from "@/lib/utils";

/** Filtra a lista de conteúdos por recorrência ENEM via querystring `?rec=`. */
export function RecurrenceFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("rec");

  function setRec(value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set("rec", value);
    else next.delete("rec");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Chip label="Todas" activeChip={!active} onClick={() => setRec(null)} />
      {RECURRENCE_OPTIONS.map((r) => (
        <Chip
          key={r}
          label={`${RECURRENCE[r].dot} ${RECURRENCE[r].label}`}
          activeChip={active === r}
          onClick={() => setRec(r)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  activeChip,
  onClick,
}: {
  label: string;
  activeChip: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        activeChip
          ? "border-primary bg-primary-soft text-secondary"
          : "border-border text-muted hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
