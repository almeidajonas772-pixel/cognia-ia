import { Check, X } from "lucide-react";
import { PLAN_MATRIX } from "@/lib/billing/config";

function Cell({ value }: { value: string }) {
  if (value === "—")
    return (
      <span className="inline-flex items-center gap-1 text-muted">
        <X className="h-3.5 w-3.5" />
      </span>
    );
  if (value === "Ilimitado" || value === "Incluída" || value === "Incluídos" || value === "Completa" || value === "Sem anúncios")
    return (
      <span className="inline-flex items-center gap-1 text-emerald-400">
        <Check className="h-3.5 w-3.5" /> {value}
      </span>
    );
  return <span className="text-foreground">{value}</span>;
}

/** Tabela "Comparar Planos" (spec §4.1). */
export function PlanComparison() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="p-3 text-left font-medium text-muted">
              Funcionalidade
            </th>
            <th className="p-3 text-left font-medium text-muted">Gratuito</th>
            <th className="p-3 text-left font-medium text-secondary">
              Premium ★
            </th>
          </tr>
        </thead>
        <tbody>
          {PLAN_MATRIX.map((row) => (
            <tr key={row.feature} className="border-b border-border last:border-0">
              <td className="p-3 text-foreground">{row.feature}</td>
              <td className="p-3">
                <Cell value={row.free} />
              </td>
              <td className="p-3">
                <Cell value={row.premium} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
