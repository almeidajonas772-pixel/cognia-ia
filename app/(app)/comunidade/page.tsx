import type { Metadata } from "next";
import Link from "next/link";
import { Users, Bell, Shield } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";
import { AdSlot } from "@/components/ads/AdSlot";
import {
  listGroups,
  getMyGroupIds,
  getUserFeed,
  getUnreadCount,
} from "@/lib/comunidade/queries";
import { Card, CardBody } from "@/components/ui/Card";
import { JoinButton } from "@/components/comunidade/JoinButton";
import { PostCard } from "@/components/comunidade/PostCard";

export const metadata: Metadata = { title: "Comunidade" };

export default async function ComunidadePage() {
  const user = await requireUser();
  const [groups, myIds, feed, unread, admin, profile] = await Promise.all([
    listGroups(),
    getMyGroupIds(user.id),
    getUserFeed(user.id, 15),
    getUnreadCount(user.id),
    isAppAdmin(user.id),
    getProfile(),
  ]);
  const isPremium = profile?.plan === "premium";

  const myGroups = groups.filter((g) => myIds.has(g.id));
  const discover = groups.filter((g) => !myIds.has(g.id));

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-secondary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Comunidade de estudos
            </h1>
            <p className="mt-1 text-sm text-muted">
              Grupos, dúvidas e materiais. Foco total em aprender junto.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/comunidade/notificacoes"
            className="relative inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            Notificações
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {unread}
              </span>
            )}
          </Link>
          {admin && (
            <Link
              href="/comunidade/admin"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted hover:text-foreground"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">
            Dos seus grupos
          </h2>
          {feed.length === 0 ? (
            <Card>
              <CardBody className="text-sm text-muted">
                Entre em grupos para ver publicações aqui.
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {feed.map((p, i) => (
                <div key={p.id} className="space-y-4">
                  <PostCard
                    post={p}
                    currentUserId={user.id}
                    isAdmin={admin}
                    showGroup
                  />
                  {i === 2 && (
                    <AdSlot placement="comunidade_feed" isPremium={isPremium} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {myGroups.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                Meus grupos
              </h2>
              <div className="space-y-2">
                {myGroups.map((g) => (
                  <Link
                    key={g.id}
                    href={`/comunidade/g/${g.slug}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-primary/40"
                  >
                    <span className="truncate text-foreground">{g.name}</span>
                    <span className="text-xs text-muted">{g.member_count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              Descobrir grupos
            </h2>
            <div className="space-y-2">
              {discover.map((g) => (
                <div
                  key={g.id}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/comunidade/g/${g.slug}`}
                      className="min-w-0"
                    >
                      <p className="truncate text-sm font-medium text-foreground">
                        {g.name}
                      </p>
                      <p className="text-xs text-muted">
                        {g.category} · {g.member_count} membros
                      </p>
                    </Link>
                    <JoinButton
                      groupId={g.id}
                      initialMember={false}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
