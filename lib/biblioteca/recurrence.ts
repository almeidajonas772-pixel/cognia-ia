import type { Recurrence } from "@/lib/biblioteca/types";

type RecurrenceMeta = {
  label: string;
  short: string;
  dot: string; // emoji do indicador
  /** classe de cor do ponto/realce */
  color: string;
  /** peso para ordenar destaque (maior = mais recorrente) */
  weight: number;
};

export const RECURRENCE: Record<Recurrence, RecurrenceMeta> = {
  muito_recorrente: {
    label: "Muito recorrente",
    short: "Cai quase todo ano",
    dot: "🔴",
    color: "text-rose-400",
    weight: 3,
  },
  recorrente: {
    label: "Recorrente",
    short: "Aparece com frequência",
    dot: "🟠",
    color: "text-amber-400",
    weight: 2,
  },
  ocasional: {
    label: "Ocasional",
    short: "Aparece às vezes",
    dot: "🟡",
    color: "text-yellow-300",
    weight: 1,
  },
  raro: {
    label: "Raro",
    short: "Pouco cobrado",
    dot: "🟢",
    color: "text-emerald-400",
    weight: 0,
  },
};

export const RECURRENCE_OPTIONS = (
  Object.keys(RECURRENCE) as Recurrence[]
).sort((a, b) => RECURRENCE[b].weight - RECURRENCE[a].weight);
