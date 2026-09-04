import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getNotifications } from "@/lib/comunidade/queries";
import { NotificationList } from "@/components/comunidade/NotificationList";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificacoesPage() {
  const user = await requireUser();
  const notifications = await getNotifications(user.id);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-5">
      <Link
        href="/comunidade"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Comunidade
      </Link>
      <h1 className="text-xl font-semibold text-foreground">Notificações</h1>
      <NotificationList notifications={notifications} />
    </div>
  );
}
