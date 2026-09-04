import { PRIORITY_META, type Improvement } from "@/lib/redacao/types";

/**
 * "PONTOS PARA MELHORAR" — formato obrigatório (spec §12 e §13):
 * lista das áreas, ordenadas por impacto, com indicador de prioridade.
 */
export function ImprovementList({ items }: { items: Improvement[] }) {
  const sorted = [...items].sort(
    (a, b) => PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight
  );

  return (
    <ul className="divide-y divide-border">
      {sorted.map((it) => {
        const meta = PRIORITY_META[it.priority];
        return (
          <li key={it.area} className="flex gap-3 py-2.5">
            <span className="mt-0.5 shrink-0" title={meta.label}>
              {meta.dot}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {it.area}
                <span className={`ml-2 text-xs font-normal ${meta.color}`}>
                  {meta.label}
                </span>
              </p>
              <p className="text-sm text-muted">{it.note}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
