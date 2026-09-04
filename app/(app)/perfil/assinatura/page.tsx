import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/billing/entitlements";
import { getMySubscription, getMyPayments } from "@/lib/billing/subscription";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { PremiumBadge } from "@/components/billing/PremiumBadge";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { SubscribeButtons } from "@/components/billing/SubscribeButtons";
import {
  CancelButton,
  ChangePlanButton,
  RenewNowButton,
} from "@/components/billing/SubscriptionActions";

export const metadata: Metadata = { title: "Minha assinatura" };

const brl = (n: number) =>
  "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

export default async function AssinaturaPage() {
  const user = await requireUser();
  const [ent, sub, payments] = await Promise.all([
    getEntitlements(user.id),
    getMySubscription(user.id),
    getMyPayments(user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <Link
        href="/perfil"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Perfil
      </Link>
      <h1 className="text-xl font-semibold text-foreground">Minha assinatura</h1>

      {ent.isPremium ? (
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  Plano Premium <PremiumBadge />
                </p>
                <p className="text-xs text-muted">
                  {sub?.cycle === "anual" ? "Anual" : "Mensal"} ·{" "}
                  {sub ? brl(Number(sub.price)) : "—"}
                  {sub?.coupon_code && ` · cupom ${sub.coupon_code}`}
                </p>
              </div>
              <span
                className={
                  ent.cancelAtPeriodEnd
                    ? "text-xs text-amber-400"
                    : "text-xs text-emerald-400"
                }
              >
                {ent.cancelAtPeriodEnd ? "Cancelamento agendado" : "Ativa"}
              </span>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <Info
                label={
                  ent.cancelAtPeriodEnd
                    ? "Acesso até"
                    : "Próxima renovação"
                }
                value={
                  ent.periodEnd
                    ? new Date(ent.periodEnd).toLocaleDateString("pt-BR")
                    : "—"
                }
              />
              <Info
                label="Forma de pagamento"
                value={
                  sub?.provider === "mercadopago"
                    ? "Mercado Pago"
                    : "Demonstração"
                }
              />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              {sub && <ChangePlanButton current={sub.cycle} />}
              {sub && <RenewNowButton cycle={sub.cycle} />}
              {!ent.cancelAtPeriodEnd && (
                <CancelButton periodEnd={ent.periodEnd} />
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="space-y-4">
            <p className="text-sm text-muted">
              Você está no <strong className="text-foreground">Plano Gratuito</strong>.
              Assine o Premium para acesso ilimitado.
            </p>
            <SubscribeButtons loggedIn />
          </CardBody>
        </Card>
      )}

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de pagamentos</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="divide-y divide-border text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <span className="text-muted">
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="text-foreground">{brl(Number(p.amount))}</span>
                  <span
                    className={
                      p.status === "approved"
                        ? "text-emerald-400"
                        : "text-muted"
                    }
                  >
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Comparar planos
        </h2>
        <PlanComparison />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
