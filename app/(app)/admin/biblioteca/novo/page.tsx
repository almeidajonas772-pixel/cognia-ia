import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listAdminLibrary } from "@/lib/admin/queries";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { TopicCreator } from "@/components/admin/TopicCreator";

export const metadata: Metadata = { title: "Novo conteúdo" };

export default async function NewContentPage() {
  const { subjects, topics } = await listAdminLibrary();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/admin/biblioteca"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" /> Biblioteca
      </Link>
      <h1 className="text-xl font-semibold text-foreground">Novo conteúdo</h1>
      <TopicCreator subjects={subjects} />
      <ContentEditor subjects={subjects} topics={topics} />
    </div>
  );
}
