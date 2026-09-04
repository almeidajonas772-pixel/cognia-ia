import type { Metadata } from "next";
import Link from "next/link";
import { User, ShieldCheck, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProfileForm } from "@/components/auth/ProfileForm";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const isPremium = profile?.plan === "premium";
  const createdAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("pt-BR")
    : "—";

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-secondary">
          <User className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">Perfil</h1>
            <Badge tone={isPremium ? "primary" : "neutral"}>
              {isPremium ? "Premium" : "Gratuito"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted">Seus dados e preferências.</p>
        </div>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Email" value={profile?.email ?? user.email ?? "—"} />
            <Info label="Membro desde" value={createdAt} />
          </div>
          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Editar dados
            </p>
            <ProfileForm
              userId={user.id}
              initialName={profile?.full_name ?? ""}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Plano
            </p>
            <p className="mt-1 text-sm text-foreground">
              {isPremium ? "Plano Premium" : "Plano Gratuito"}
            </p>
          </div>
          <Link
            href="/perfil/assinatura"
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm text-foreground hover:bg-white/5"
          >
            {isPremium ? "Gerenciar assinatura" : "Ver planos e assinar"}
          </Link>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/perfil/seguranca"
          className="rounded-xl border border-border bg-card p-4 hover:border-secondary/40"
        >
          <div className="flex items-center gap-2 text-secondary">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium text-foreground">Segurança</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            2FA, dispositivos conectados e atividade da conta.
          </p>
        </Link>
        <Link
          href="/perfil/privacidade"
          className="rounded-xl border border-border bg-card p-4 hover:border-secondary/40"
        >
          <div className="flex items-center gap-2 text-secondary">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium text-foreground">
              Privacidade e dados
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Consentimento, exportação de dados e exclusão de conta (LGPD).
          </p>
        </Link>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm text-foreground">{value}</p>
    </div>
  );
}
