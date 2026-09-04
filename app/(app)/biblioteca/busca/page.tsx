import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { searchContents, getUserLibraryState } from "@/lib/biblioteca/queries";
import { Card } from "@/components/ui/Card";
import { ContentRow } from "@/components/biblioteca/ContentRow";
import { LibrarySearch } from "@/components/biblioteca/LibrarySearch";

export const metadata: Metadata = { title: "Busca" };

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const user = await requireUser();
  const q = (searchParams.q ?? "").trim();

  const [hits, state] = await Promise.all([
    q.length >= 2 ? searchContents(q) : Promise.resolve([]),
    getUserLibraryState(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-5">
      <Link
        href="/biblioteca"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Biblioteca
      </Link>

      <h1 className="text-2xl font-semibold text-foreground">Busca</h1>
      <LibrarySearch initialQuery={q} />

      {q.length < 2 ? (
        <p className="text-sm text-muted">Digite ao menos 2 caracteres.</p>
      ) : hits.length === 0 ? (
        <p className="text-sm text-muted">
          Nada encontrado para <strong className="text-foreground">{q}</strong>.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted">
            {hits.length} {hits.length === 1 ? "resultado" : "resultados"}
          </p>
          <Card className="overflow-hidden">
            {hits.map((hit) => (
              <ContentRow
                key={hit.id}
                content={hit}
                subjectSlug={hit.subject_slug}
                completed={state.completed.has(
                  `${hit.subject_slug}/${hit.slug}`
                )}
                favorite={state.favorites.has(hit.id)}
              />
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
