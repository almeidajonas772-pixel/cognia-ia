"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { markNotificationsRead } from "@/lib/comunidade/actions";
import type { Notification } from "@/lib/comunidade/types";

export function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (notifications.some((n) => !n.read)) void markNotificationsRead();
  }, [notifications]);

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Bell className="mx-auto h-6 w-6 text-muted" />
        <p className="mt-2 text-sm text-muted">Nenhuma notificação ainda.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {notifications.map((n) => {
        const inner = (
          <span className="flex items-start gap-3 p-3">
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                n.read ? "bg-transparent" : "bg-primary"
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-foreground">{n.title}</span>
              <span className="text-xs text-muted">
                {new Date(n.created_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
            {n.read && <Check className="h-3.5 w-3.5 shrink-0 text-muted" />}
          </span>
        );
        return (
          <li key={n.id} className="hover:bg-white/[0.03]">
            {n.href ? <Link href={n.href}>{inner}</Link> : inner}
          </li>
        );
      })}
    </ul>
  );
}
