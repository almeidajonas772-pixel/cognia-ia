import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getSubjectBySlug, getUserLibraryState } from "@/lib/biblioteca/queries";
import { AREA_LABELS, type Recurrence } from "@/lib/biblioteca/types";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/biblioteca/ProgressBar";
import { ContentRow } from "@/components/biblioteca/ContentRow";
import { RecurrenceFilter } from "@/components/biblioteca/RecurrenceFilter";

type Props = {
  params: { subject: string };
  searchParams: { rec?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const subject = await getSubjectBySlug(params.subject);
  return { title: subject ? subject.name : "Matéria" };
}

export default async function SubjectPage({ params, searchParams }: Props) {
  const user = await requireUser();
  const [subject, state] = await Promise.all([
    getSubjectBySlug(params.subject),
    getUserLibraryState(user.id),
  ]);

  if (!subject) notFound();

  const rec = searchParams.rec as Recurrence | undefined;
  const allContents = subject.topics.flatMap((t) => t.contents);
  const total = allContents.length;
  const done = allContents.filter((c) =>
    state.completed.has(`${subject.slug}/${c.slug}`)
  ).length;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <Link
        href="/biblioteca"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Biblioteca
      </Link>

      <div>
        <p className="text-xs font-medium text-secondary">
          {AREA_LABELS[subject.area]}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          {subject.name}
        </h1>
        {subject.description && (
          <p className="mt-1 text-sm text-muted">{subject.description}</p>
        )}
      </div>

      <Card>
        <CardBody>
          <ProgressBar done={done} total={total} />
        </CardBody>
      </Card>

      <Suspense fallback={<div className="h-7" />}>
        <RecurrenceFilter />
      </Suspense>

      {subject.topics.map((topic) => {
        const contents = rec
          ? topic.contents.filter((c) => c.recurrence === rec)
          : topic.contents;
        if (contents.length === 0) return null;

        return (
          <section key={topic.id}>
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              {topic.name}
            </h2>
            <Card className="overflow-hidden">
              {contents.map((content) => (
                <ContentRow
                  key={content.id}
                  content={content}
                  subjectSlug={subject.slug}
                  completed={state.completed.has(
                    `${subject.slug}/${content.slug}`
                  )}
                  favorite={state.favorites.has(content.id)}
                />
              ))}
            </Card>
          </section>
        );
      })}

      {rec &&
        subject.topics.every(
          (t) => t.contents.filter((c) => c.recurrence === rec).length === 0
        ) && (
          <p className="text-sm text-muted">
            Nenhum conteúdo com essa recorrência nesta matéria.
          </p>
        )}
    </div>
  );
}
