import type { Metadata } from "next";
import Link from "next/link";
import {
  Library,
  MessageSquareText,
  PenLine,
  Users,
  BarChart3,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const features = [
  {
    icon: Library,
    title: "Biblioteca ENEM",
    desc: "Resumos rápidos e completos organizados por matéria, tema e recorrência de prova.",
  },
  {
    icon: MessageSquareText,
    title: "Chat IA",
    desc: "Tutor que explica passo a passo, gera resumos personalizados e questões no estilo ENEM.",
  },
  {
    icon: PenLine,
    title: "Correção de redação",
    desc: "Envie por texto, foto ou PDF. Nota por competência e plano de melhoria — ENEM, FUVEST e mais.",
  },
  {
    icon: BarChart3,
    title: "Progresso e analytics",
    desc: "Veja sua evolução por matéria, pontos fracos e o que revisar primeiro.",
  },
  {
    icon: Users,
    title: "Comunidade de estudos",
    desc: "Tire dúvidas com outros estudantes e compartilhe materiais — sem virar rede social.",
  },
  {
    icon: Sparkles,
    title: "Estudo adaptativo",
    desc: "A plataforma aprende com o seu uso e ajusta o nível das explicações e revisões.",
  },
];

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    cta: "Começar grátis",
    href: "/cadastro",
    highlight: false,
    items: [
      "Resumos rápidos da Biblioteca",
      "Chat IA com limite diário",
      "Comunidade e progresso básico",
      "Exportação de arquivos",
    ],
  },
  {
    name: "Premium",
    price: "R$ 14,90",
    period: "/mês · ou R$ 119,90/ano",
    cta: "Ver planos",
    href: "/precos",
    highlight: true,
    items: [
      "Biblioteca e resumos completos",
      "Chat IA e questões ilimitados",
      "Correção de redação e simulados",
      "Analytics avançado e memória completa da IA",
      "Sem anúncios",
    ],
  },
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-grid">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <Badge tone="primary" className="mx-auto">
            Preparação para ENEM e vestibulares
          </Badge>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Estude com inteligência artificial, do resumo à redação.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-muted sm:text-lg">
            Biblioteca de conteúdos, tutor com IA, correção de redação por banca e
            comunidade de estudos — tudo em uma plataforma só.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button href="/cadastro" size="lg">
              Criar conta grátis
            </Button>
            <Button href="/login" size="lg" variant="outline">
              Já tenho conta
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted">
            Sem cartão de crédito. Comece a estudar em 1 minuto.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-semibold text-foreground">
          Tudo o que você precisa para estudar
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardBody>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-secondary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {title}
                </p>
                <p className="mt-1 text-sm text-muted">{desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-center text-2xl font-semibold text-foreground">
          Planos simples
        </h2>
        <p className="mt-2 text-center text-sm text-muted">
          Comece de graça. Desbloqueie tudo quando quiser.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.highlight ? "border-primary/50 shadow-glow" : undefined
              }
            >
              <CardBody>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {plan.name}
                  </p>
                  {plan.highlight && <Badge tone="primary">Recomendado</Badge>}
                </div>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {plan.price}
                </p>
                <p className="text-xs text-muted">{plan.period}</p>
                <ul className="mt-4 space-y-2">
                  {plan.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  href={plan.href}
                  variant={plan.highlight ? "primary" : "outline"}
                  className="mt-6 w-full"
                >
                  {plan.cta}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <Card className="border-primary/40 bg-primary-soft">
          <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
            <h2 className="text-2xl font-semibold text-foreground">
              Pronto para começar?
            </h2>
            <p className="max-w-md text-sm text-muted">
              Crie sua conta gratuita e comece a estudar hoje mesmo.
            </p>
            <Button href="/cadastro" size="lg">
              Criar conta grátis
            </Button>
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
