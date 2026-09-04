import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { canUseRedacao } from "@/lib/redacao/access";
import { listRubrics } from "@/lib/redacao/queries";
import { PremiumGate } from "@/components/redacao/PremiumGate";
import { RedacaoComposer } from "@/components/redacao/RedacaoComposer";

export const metadata: Metadata = { title: "Nova redação" };

export default async function NovaRedacaoPage() {
  const user = await requireUser();
  const profile = await getProfile();
  if (!canUseRedacao(profile)) return <PremiumGate />;

  const rubrics = await listRubrics(user.id);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-5">
      <Link
        href="/redacao"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Redação
      </Link>
      <h1 className="text-xl font-semibold text-foreground">Nova redação</h1>
      <RedacaoComposer rubrics={rubrics} />
    </div>
  );
}
