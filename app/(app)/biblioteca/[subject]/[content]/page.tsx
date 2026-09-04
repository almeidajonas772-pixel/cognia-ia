import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import {
  getContentView,
  getPremiumBody,
  getUserLibraryState,
} from "@/lib/biblioteca/queries";
import { canAccessFullSummary } from "@/lib/biblioteca/access";
import { AREA_LABELS } from "@/lib/biblioteca/types";
import { RECURRENCE } from "@/lib/biblioteca/recurrence";
import { createClient } from "@/lib/supabase/server";
import { Markdown } from "@/components/biblioteca/Markdown";
import { RecurrenceBadge } from "@/components/biblioteca/RecurrenceBadge";
import { ContentActions } from "@/components/biblioteca/ContentActions";
import { PremiumLock } from "@/components/biblioteca/PremiumLock";
import { ViewTracker } from "@/components/biblioteca/ViewTracker";
import { DifficultyRating } from "@/components/progresso/DifficultyRating";
import type { DifficultyLevel } from "@/lib/progresso/types";

type Props = { params: { subject: string; content: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const view = await getContentView(params.subject, params.content);
  return { title: view ? view.content.title : "Conteúdo" };
}

export default async function ContentPage({ params }: Props) {
  const user = await requireUser();
  const [view, profile, state] = await Promise.all([
    getContentView(params.subject, params.content),
    getProfile(),
    getUserLibraryState(user.id),
  ]);

  if (!view) notFound();

  const { content, subject, topic, prev, next } = view;
  const isPremium = canAccessFullSummary(profile);
  const supabase = createClient();
  const [fullBody, { data: diffRow }] = await Promise.all([
    isPremium ? getPremiumBody(content.id) : Promise.resolve(null),
    supabase
      .from("content_difficulty")
      .select("level")
      .eq("user_id", user.id)
      .eq("content_id", content.id)
      .maybeSingle(),
  ]);

  const completed = state.completed.has(`${subject.slug}/${content.slug}`);
  const favorite = state.favorites.has(content.id);
  const href = `/biblioteca/${subject.slug}/${content.slug}`;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <ViewTracker
        contentId={content.id}
        subjectSlug={subject.slug}
        title={content.title}
        href={href}
      />

      <nav className="flex flex-wrap items-center gap-1 text-xs text-muted">
        <Link href="/biblioteca" className="hover:text-foreground">
          Biblioteca
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/biblioteca/${subject.slug}`}
          className="hover:text-foreground"
        >
          {subject.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{topic.name}</span>
      </nav>

      <header className="space-y-3">
        <p className="text-xs font-medium text-secondary">
          {AREA_LABELS[subject.area]}
        </p>
        <h1 className="text-2xl font-semibold text-foreground">{content.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <RecurrenceBadge recurrence={content.recurrence} />
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {content.reading_minutes} min de leitura
          </span>
          <span>{RECURRENCE[content.recurrence].short}</span>
        </div>
      </header>

      <ContentActions
        contentId={content.id}
        subjectSlug={subject.slug}
        contentSlug={content.slug}
        title={content.title}
        initialCompleted={completed}
        initialFavorite={favorite}
        canDownload={isPremium}
      />

      {/* RESUMO RÁPIDO — gratuito */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Resumo rápido
        </h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <Markdown>{content.summary_short}</Markdown>
        </div>
      </section>

      {/* RESUMO COMPLETO — Premium */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Resumo completo
        </h2>
        {isPremium && fullBody ? (
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <Markdown>{fullBody}</Markdown>
          </div>
        ) : (
          <PremiumLock />
        )}
      </section>

      {completed && (
        <DifficultyRating
          contentId={content.id}
          subjectSlug={subject.slug}
          contentSlug={content.slug}
          initial={(diffRow?.level as DifficultyLevel | undefined) ?? null}
        />
      )}

      <nav className="flex items-stretch justify-between gap-3 border-t border-border pt-4">
        {prev ? (
          <Link
            href={`/biblioteca/${subject.slug}/${prev.slug}`}
            className="group flex flex-1 items-center gap-2 rounded-lg border border-border p-3 text-left hover:bg-white/5"
          >
            <ChevronLeft className="h-4 w-4 shrink-0 text-muted" />
            <span className="min-w-0">
              <span className="block text-xs text-muted">Anterior</span>
              <span className="block truncate text-sm text-foreground">
                {prev.title}
              </span>
            </span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/biblioteca/${subject.slug}/${next.slug}`}
            className="group flex flex-1 items-center justify-end gap-2 rounded-lg border border-border p-3 text-right hover:bg-white/5"
          >
            <span className="min-w-0">
              <span className="block text-xs text-muted">Próximo</span>
              <span className="block truncate text-sm text-foreground">
                {next.title}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </div>
  );
}
