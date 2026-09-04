"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV } from "@/lib/nav";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/supabase/types";

export function Sidebar({ plan = "free" }: { plan?: Plan }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {APP_NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-secondary"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="rounded-lg bg-primary-soft p-3">
          <p className="text-xs font-semibold text-foreground">
            {plan === "premium" ? "Plano Premium" : "Plano Gratuito"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {plan === "premium"
              ? "Acesso completo liberado."
              : "Recursos completos com o Premium."}
          </p>
          {plan !== "premium" && (
            <Link
              href="/perfil"
              className="mt-2 inline-block text-xs font-medium text-secondary hover:underline"
            >
              Ver planos →
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
