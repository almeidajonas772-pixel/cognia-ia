import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Crown,
  Library,
  PenLine,
  MessageSquareText,
  ClipboardList,
  MessagesSquare,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { getAdminStats } from "@/lib/admin/stats";
import { getAdminNotifications } from "@/lib/admin/queries";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart } from "@/components/progresso/Charts";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminDashboard() {
  const [s, notif] = await Promise.all([
    getAdminStats(),
    getAdminNotifications(),
  ]);

  const alerts = [
    notif.openReports > 0 &&
      `${notif.openReports} denúncia(s) aberta(s)`,
    notif.pendingSubmissions > 0 &&
      `${notif.pendingSubmissions} resumo(s) aguardando revisão`,
    notif.rejectedPayments > 0 &&
      `${notif.rejectedPayments} pagamento(s) recusado(s)`,
    notif.newPremium24h > 0 &&
      `${notif.newPremium24h} nova(s) assinatura(s) nas últimas 24h`,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>

      {alerts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardBody>
            <p className="flex items-center gap-2 text-sm font-medium text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              Notificações administrativas
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {alerts.map((a) => (
                <li key={a}>· {a}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Users} label="Usuários" value={s.users} hint={`${s.newUsers7d} novos (7d)`} />
        <Stat icon={Crown} label="Premium" value={s.premium} hint={`${s.free} no gratuito`} />
        <Stat icon={Users} label="Ativos (7d)" value={s.activeUsers7d} />
        <Stat icon={Library} label="Conteúdos" value={s.contents} />
        <Stat icon={MessageSquareText} label="Msgs do chat (30d)" value={s.chatMessages} />
        <Stat icon={ClipboardList} label="Questões geradas" value={s.questionsGenerated} />
        <Stat icon={PenLine} label="Redações corrigidas" value={s.essaysCorrected} />
        <Stat icon={MessagesSquare} label="Publicações" value={s.communityPosts} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilização diária (7 dias)</CardTitle>
        </CardHeader>
        <CardBody>
          <BarChart
            data={s.dailyUse.map((d) => ({ label: d.day, value: d.count }))}
          />
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/usuarios" className="rounded-lg border border-border px-3 py-1.5 text-muted hover:text-foreground">
          Gerenciar usuários
        </Link>
        <Link href="/admin/biblioteca" className="rounded-lg border border-border px-3 py-1.5 text-muted hover:text-foreground">
          Gerenciar biblioteca
        </Link>
        <Link href="/admin/resumos" className="rounded-lg border border-border px-3 py-1.5 text-muted hover:text-foreground">
          Revisar resumos ({notif.pendingSubmissions})
        </Link>
        <Link href="/admin/blog" className="rounded-lg border border-border px-3 py-1.5 text-muted hover:text-foreground">
          Blog
        </Link>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 text-secondary">
          <Icon className="h-4 w-4" />
          <span className="text-xs text-muted">{label}</span>
        </div>
        <p className="mt-1 text-xl font-semibold text-foreground">
          {value.toLocaleString("pt-BR")}
        </p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </CardBody>
    </Card>
  );
}
