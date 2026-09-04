import { Gift, Users2, CheckCircle2, Clock } from "lucide-react";
import { CopyLinkButton } from "@/components/referral/CopyLinkButton";
import type { ReferralState } from "@/lib/referral/queries";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando 1º passo",
  qualified: "Qualificada",
  rewarded: "Recompensada",
  void: "Cancelada",
};

/** Fase 14 — painel do programa de indicação. Server component. */
export function ReferralPanel({ state }: { state: ReferralState }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-secondary" />
          <h2 className="text-sm font-semibold text-foreground">
            Convide e ganhem juntos
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted">
          Quando quem você convidar concluir a configuração inicial, vocês dois
          ganham <strong className="text-foreground">XP</strong> e uma
          <strong className="text-foreground"> proteção de sequência</strong>.
          Você recebe 300 XP; seu convidado, 150 XP.
        </p>

        {state.link ? (
          <div className="mt-4">
            <p className="text-xs text-muted">Seu link de convite</p>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <code className="flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground">
                {state.link}
              </code>
              <CopyLinkButton value={state.link} />
            </div>
            <p className="mt-1 text-xs text-muted">
              Código: <span className="font-mono text-foreground">{state.code}</span>
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Seu link de convite aparece aqui quando o programa estiver disponível.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Metric icon={<Users2 className="h-4 w-4" />} value={state.total} label="convites" />
        <Metric icon={<CheckCircle2 className="h-4 w-4" />} value={state.qualified} label="qualificados" />
        <Metric icon={<Clock className="h-4 w-4" />} value={state.pending} label="pendentes" />
      </div>

      {state.list.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th className="p-3">Quando</th>
                <th className="p-3">Situação</th>
                <th className="p-3 text-right">XP</th>
              </tr>
            </thead>
            <tbody>
              {state.list.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-3 text-xs text-muted">
                    {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-3 text-foreground">
                    {STATUS_LABEL[r.status] ?? r.status}
                  </td>
                  <td className="p-3 text-right tabular-nums text-foreground">
                    {r.rewardXp ? `+${r.rewardXp}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-center gap-1 text-secondary">
        {icon}
        <span className="text-lg font-semibold text-foreground">{value}</span>
      </div>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
