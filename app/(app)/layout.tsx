import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { StudyHeartbeat } from "@/components/progresso/StudyHeartbeat";
import { AchievementToast } from "@/components/gamification/AchievementToast";
import { SessionSync } from "@/components/security/SessionSync";
import { CancelDeletionButton } from "@/components/security/CancelDeletionButton";
import { LaunchBanner } from "@/components/launch/LaunchBanner";
import { getUnreadCount } from "@/lib/comunidade/queries";
import { isSessionValid } from "@/lib/security/sessions";
import { getDeletionState } from "@/lib/privacy/deletion";
import type { Plan } from "@/lib/supabase/types";

/**
 * Shell do app autenticado: sidebar fixa + topbar.
 * Proteção em camadas: middleware (borda) + verificações aqui (Fases 9 e 11):
 * conta suspensa, sessão revogada (logout global) e exclusão de conta agendada.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Conta suspensa / banida (Fase 9)
  const { data: blocked } = await supabase.rpc("user_is_blocked", {
    p_user: user.id,
  });
  if (blocked) return <Gate title="Sua conta está suspensa" text="Entre em contato com o suporte para regularizar o acesso." />;

  // Sessão invalidada por logout global (Fase 11)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const sessionOk = await isSessionValid(user.id, session?.access_token ?? null);
  if (!sessionOk) {
    return (
      <Gate
        title="Sessão encerrada"
        text="Você saiu de todos os dispositivos. Entre novamente para continuar."
        action={{ href: "/login", label: "Entrar" }}
      />
    );
  }

  // Exclusão de conta agendada (Fase 11)
  const deletion = await getDeletionState(user.id);
  if (deletion.requested) {
    const when = deletion.scheduledFor
      ? new Date(deletion.scheduledFor).toLocaleDateString("pt-BR")
      : "—";
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold text-foreground">
            Conta agendada para exclusão
          </h1>
          <p className="mt-2 text-sm text-muted">
            Seus dados serão apagados definitivamente em <strong>{when}</strong>.
            Você pode reverter isso até lá.
          </p>
          <div className="mt-4">
            <CancelDeletionButton />
          </div>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, plan, avatar_url")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name || user.email || "Estudante";
  const email = profile?.email || user.email || "";
  const plan: Plan = profile?.plan ?? "free";
  const unread = await getUnreadCount(user.id).catch(() => 0);

  return (
    <div className="flex min-h-screen flex-col">
      <LaunchBanner />
      <div className="flex min-h-0 flex-1">
        <Sidebar plan={plan} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            name={name}
            email={email}
            avatarUrl={profile?.avatar_url ?? null}
            unread={unread}
          />
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
      <StudyHeartbeat />
      <AchievementToast />
      <SessionSync />
    </div>
  );
}

function Gate({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted">{text}</p>
        {action && (
          <Link
            href={action.href}
            className="mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
