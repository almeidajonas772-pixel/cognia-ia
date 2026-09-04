"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Library,
  FileCheck2,
  MessagesSquare,
  PenLine,
  Newspaper,
  BarChart3,
  Settings,
  ScrollText,
  DollarSign,
  Activity,
  Cpu,
  ShieldCheck,
  BrainCircuit,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/biblioteca", label: "Biblioteca", icon: Library },
  { href: "/admin/resumos", label: "Resumos enviados", icon: FileCheck2 },
  { href: "/comunidade/admin", label: "Comunidade", icon: MessagesSquare },
  { href: "/admin/redacoes", label: "Redações", icon: PenLine },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/monetizacao", label: "Monetização", icon: DollarSign },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/consumo", label: "Consumo de IA", icon: Cpu },
  { href: "/admin/ia", label: "IA (rotas/memória)", icon: BrainCircuit },
  { href: "/admin/saude", label: "Saúde", icon: Activity },
  { href: "/admin/seguranca", label: "Segurança", icon: ShieldCheck },
  { href: "/admin/logs", label: "Logs", icon: ScrollText },
  { href: "/admin/config", label: "Configurações", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-56 shrink-0 border-r border-border lg:block">
      <div className="sticky top-16 space-y-1 p-3">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
          Administração
        </p>
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
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
        <Link
          href="/dashboard"
          className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao app
        </Link>
      </div>
    </aside>
  );
}
