import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { canUseRedacao } from "@/lib/redacao/access";
import { getEssay, getErrorBank } from "@/lib/redacao/queries";
import { Card, CardBody } from "@/components/ui/Card";
import { PremiumGate } from "@/components/redacao/PremiumGate";
import { TranscriptionReview } from "@/components/redacao/TranscriptionReview";
import { RunCorrection } from "@/components/redacao/RunCorrection";
import { CorrectionReport } from "@/components/redacao/CorrectionReport";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await requireUser();
  const essay = await getEssay(user.id, params.id);
  return { title: essay ? essay.title : "Redação" };
}

export default async function EssayPage({ params }: Props) {
  const user = await requireUser();
  const profile = await getProfile();
  if (!canUseRedacao(profile)) return <PremiumGate />;

  const essay = await getEssay(user.id, params.id);
  if (!essay) notFound();

  const errorBank =
    essay.status === "corrigida" ? await getErrorBank(user.id) : [];

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-5">
      <Link
        href="/redacao"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Redação
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-foreground">{essay.title}</h1>
        <p className="mt-1 text-xs text-muted">
          {essay.banca === "custom" ? "Rubrica personalizada" : essay.banca.toUpperCase()} ·{" "}
          {new Date(essay.created_at).toLocaleDateString("pt-BR")}
        </p>
      </div>

      {essay.status === "aguardando_transcricao" && (
        <TranscriptionReview
          essayId={essay.id}
          initialText={essay.transcription ?? ""}
        />
      )}

      {(essay.status === "transcricao_confirmada" ||
        essay.status === "corrigindo") && (
        <RunCorrection
          essayId={essay.id}
          auto={essay.status === "transcricao_confirmada"}
        />
      )}

      {essay.status === "erro" && (
        <Card>
          <CardBody className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Não foi possível avaliar esta redação
              </p>
              <p className="mt-1 text-sm text-muted">
                {essay.summary ||
                  "O texto pode não ser uma redação dissertativa ou está incompleto."}
              </p>
              {essay.raw_text && essay.transcription_confirmed && (
                <p className="mt-2 text-xs text-muted">
                  Você pode revisar o texto e criar uma nova redação.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {essay.status === "corrigida" && (
        <CorrectionReport essay={essay} errorBank={errorBank} />
      )}

      {essay.raw_text && essay.status === "corrigida" && (
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Ver texto corrigido
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {essay.raw_text}
          </p>
        </details>
      )}
    </div>
  );
}
