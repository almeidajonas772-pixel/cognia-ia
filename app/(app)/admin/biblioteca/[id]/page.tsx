import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAdminContent, listAdminLibrary } from "@/lib/admin/queries";
import { ContentEditor } from "@/components/admin/ContentEditor";

export const metadata: Metadata = { title: "Editar conteúdo" };

export default async function EditContentPage({
  params,
}: {
  params: { id: string };
}) {
  const [content, { subjects, topics }] = await Promise.all([
    getAdminContent(params.id),
    listAdminLibrary(),
  ]);
  if (!content) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/admin/biblioteca"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" /> Biblioteca
      </Link>
      <h1 className="text-xl font-semibold text-foreground">
        Editar: {content.title}
      </h1>
      <ContentEditor
        subjects={subjects}
        topics={topics}
        existing={{
          id: content.id,
          subject_id: content.subject_id,
          topic_id: content.topic_id,
          title: content.title,
          summary_short: content.summary_short,
          recurrence: content.recurrence,
          reading_minutes: content.reading_minutes,
          is_published: content.is_published,
          body: content.body,
        }}
      />
    </div>
  );
}
