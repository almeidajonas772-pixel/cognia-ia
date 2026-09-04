import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import { PRICES } from "@/lib/billing/config";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { SubscribeButtons } from "@/components/billing/SubscribeButtons";
import { FaqJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Planos e preços",
  description:
    "Compare o Plano Gratuito e o Premium do COGNI IA. Assine mensal ou anual.",
  alternates: { canonical: "/precos" },
};

const FAQ = [
  {
    q: "O plano gratuito tem prazo de validade?",
    a: "Não. O Plano Gratuito é para sempre, com limites diários/semanais de uso de resumos completos, chat e questões.",
  },
  {
    q: "Quanto custa o Premium?",
    a: `${PRICES.mensal.label} no plano mensal, ou ${PRICES.anual.label} no anual (equivalente a cerca de R$ 9,99/mês).`,
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. O cancelamento é imediato pelo próprio painel e o acesso Premium continua até o fim do período já pago.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Cartão de crédito, Pix e boleto, processados pelo Mercado Pago. Não armazenamos dados do cartão.",
  },
  {
    q: "O Premium remove os anúncios?",
    a: "Sim. Assinantes Premium navegam sem anúncios em toda a plataforma.",
  },
];

export default async function PrecosPage() {
  const user = await getUser();

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground">
          Estude sem limites
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
          Comece de graça. Quando quiser, desbloqueie a Biblioteca completa, o
          Chat ilimitado, a correção de redação e as estatísticas avançadas.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold text-foreground">Gratuito</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">R$ 0</p>
          <p className="text-xs text-muted">para sempre</p>
          <ul className="mt-4 space-y-1.5 text-sm text-muted">
            <li>Resumos rápidos da Biblioteca</li>
            <li>Chat IA com limite diário</li>
            <li>2 resumos personalizados por semana</li>
            <li>Comunidade e progresso básico</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-primary/50 bg-card p-6 shadow-glow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Premium ★</p>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-secondary">
              Recomendado
            </span>
          </div>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {PRICES.mensal.label}
          </p>
          <p className="text-xs text-muted">
            ou {PRICES.anual.label} (~33% de economia)
          </p>
          <div className="mt-4">
            <SubscribeButtons loggedIn={!!user} />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <h2 className="mb-3 text-center text-sm font-semibold text-foreground">
          Comparativo completo
        </h2>
        <PlanComparison />
      </div>

      <section className="mx-auto mt-12 max-w-2xl">
        <h2 className="mb-3 text-center text-sm font-semibold text-foreground">
          Perguntas frequentes
        </h2>
        <div className="divide-y divide-border rounded-xl border border-border">
          {FAQ.map((it) => (
            <details key={it.q} className="group p-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                {it.q}
              </summary>
              <p className="mt-2 text-sm text-muted">{it.a}</p>
            </details>
          ))}
        </div>
        <FaqJsonLd items={FAQ} />
      </section>
    </main>
  );
}
