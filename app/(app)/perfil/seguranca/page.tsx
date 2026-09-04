import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { MfaSetup } from "@/components/security/MfaSetup";
import { SessionList } from "@/components/security/SessionList";
import { getMfaEnabled } from "@/lib/security/mfa";
import { listSessions } from "@/lib/security/sessions";
import { listSecurityEvents } from "@/lib/security/audit";

export const metadata: Metadata = { title: "Segurança" };
export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  login_failed: "Tentativa de login falhou",
  password_changed: "Senha alterada",
  mfa_enabled: "2FA ativado",
  mfa_disabled: "2FA desativado",
  session_registered: "Novo dispositivo",
  session_revoked: "Sessão encerrada",
  sessions_revoked_all: "Saiu de todos os dispositivos",
  data_export_requested: "Exportação de dados solicitada",
  data_export_ready: "Exportação de dados pronta",
  account_deletion_requested: "Exclusão de conta solicitada",
  account_deletion_cancelled: "Exclusão de conta cancelada",
  consent_updated: "Consentimento atualizado",
  rate_limited: "Limite de requisições atingido",
};

export default async function SecurityPage() {
  const user = await requireUser();
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [mfaEnabled, sessions, events] = await Promise.all([
    getMfaEnabled(user.id),
    listSessions(user.id, session?.access_token ?? null),
    listSecurityEvents(user.id, 20),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-secondary" />
        <h1 className="text-xl font-semibold text-foreground">Segurança</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verificação em duas etapas (2FA)</CardTitle>
        </CardHeader>
        <CardBody>
          <MfaSetup initialEnabled={mfaEnabled} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Senha</CardTitle>
        </CardHeader>
        <CardBody className="text-sm text-muted">
          <p>
            A troca de senha é feita pelo fluxo de recuperação, que envia um link
            seguro para o seu e-mail.
          </p>
          <Link
            href="/esqueci-senha"
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-foreground hover:bg-white/5"
          >
            <KeyRound className="h-4 w-4" />
            Alterar senha
          </Link>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispositivos conectados</CardTitle>
        </CardHeader>
        <CardBody>
          <SessionList sessions={sessions} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atividade de segurança recente</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          {events.length === 0 && <p className="text-muted">Nada registrado ainda.</p>}
          {events.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0"
            >
              <span className="text-foreground">{EVENT_LABEL[e.event] ?? e.event}</span>
              <span className="text-xs text-muted">
                {new Date(e.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
