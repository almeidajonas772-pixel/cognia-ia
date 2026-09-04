import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import {
  getContinueReading,
  getOverallProgress,
  getSubjectsWithCounts,
  getUserLibraryState,
} from "@/lib/biblioteca/queries";
import { AdSlot } from "@/components/ads/AdSlot";
import { AREA_LABELS, AREA_ORDER } from "@/lib/biblioteca/types";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/biblioteca/ProgressBar";
import { SubjectCard } from "@/components/biblioteca/SubjectCard";
import { LibrarySearch } from "@/components/biblioteca/LibrarySearch";
import { RecurrenceBadge } from "@/components/biblioteca/RecurrenceBadge";

export const metadata: Metadata = { title: "Biblioteca" };

export default async function BibliotecaPage() {
  const user = await requireUser();
  const [subjects, state, overall, continueReading, profile] = await Promise.all([
    getSubjectsWithCounts(),
    getUserLibraryState(user.id),
    getOverallProgress(user.id),
    getContinueReading(user.id, 3),
    getProfile(),
  ]);
  const isPremium = profile?.plan === "premium";

  const doneBySubject = (slug: string) =>
    [...state.completed].filter((k) => k.startsWith(`${slug}/`)).length;

  const byArea = AREA_ORDER.map((area) => ({
    area,
    subjects: subjects.filter((s) => s.area === area),
  })).filter((g) => g.subjects.length > 0);

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Biblioteca ENEM</h1>
        <p className="mt-1 text-sm text-muted">
          Estude por matéria e tema. Resumo rápido é gratuito; o resumo completo
          é Premium.
        </p>
      </div>

      <LibrarySearch />

      <Card>
        <CardBody className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Progresso geral
          </p>
          <ProgressBar done={overall.done} total={overall.total} />
        </CardBody>
      </Card>

      {continueReading.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Continuar de onde parou
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {continueReading.map(({ content, subjectSlug }) => (
              <Link
                key={content.id}
                href={`/biblioteca/${subjectSlug}/${content.slug}`}
                className="group"
              >
                <Card className="h-full transition-colors group-hover:border-primary/40">
                  <CardBody className="space-y-2">
                    <RecurrenceBadge
                      recurrence={content.recurrence}
                      variant="compact"
                    />
                    <p className="line-clamp-2 text-sm font-medium text-foreground">
                      {content.title}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Clock className="h-3 w-3" />
                      {content.reading_minutes} min
                    </p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Anúncio nativo — apenas plano gratuito (Fase 8) */}
      <AdSlot placement="biblioteca_feed" isPremium={isPremium} />

      {byArea.map(({ area, subjects: list }) => (
        <section key={area}>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            {AREA_LABELS[area]}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                done={doneBySubject(subject.slug)}
              />
            ))}
          </div>
        </section>
      ))}

      {subjects.length === 0 && (
        <Card>
          <CardBody className="text-center text-sm text-muted">
            Nenhum conteúdo ainda. Rode <code>npm run seed:biblioteca</code> para
            carregar o catálogo inicial.
            <span className="mt-1 block">
              Fim da lista · <ArrowRight className="inline h-3 w-3" />
            </span>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
