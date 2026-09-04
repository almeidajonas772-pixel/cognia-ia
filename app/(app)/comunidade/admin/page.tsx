import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";
import {
  getPendingPosts,
  getOpenReports,
  getPendingSubmissions,
} from "@/lib/comunidade/queries";
import { AdminPanels } from "@/components/comunidade/AdminPanels";

export const metadata: Metadata = { title: "Admin — Comunidade" };

export default async function ComunidadeAdminPage() {
  const user = await requireUser();
  if (!(await isAppAdmin(user.id))) {
    return (
      <div className="mx-auto max-w-lg animate-fade-in py-16 text-center">
        <Shield className="mx-auto h-8 w-8 text-muted" />
        <h1 className="mt-3 text-lg font-semibold text-foreground">
          Área restrita
        </h1>
        <p className="mt-1 text-sm text-muted">
          Somente administradores da plataforma têm acesso.
        </p>
        <Link
          href="/comunidade"
          className="mt-4 inline-block text-sm text-secondary hover:underline"
        >
          Voltar
        </Link>
      </div>
    );
  }

  const [pendingPosts, reports, submissions] = await Promise.all([
    getPendingPosts(),
    getOpenReports(),
    getPendingSubmissions(),
  ]);

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <Link
        href="/comunidade"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Comunidade
      </Link>
      <h1 className="text-xl font-semibold text-foreground">
        Administração da comunidade
      </h1>
      <AdminPanels
        pendingPosts={pendingPosts}
        reports={reports}
        submissions={submissions}
      />
    </div>
  );
}
