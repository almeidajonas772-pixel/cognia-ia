import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listAdminLibrary } from "@/lib/admin/queries";
import { RECURRENCE } from "@/lib/biblioteca/recurrence";
import type { Recurrence } from "@/lib/biblioteca/types";

export const metadata: Metadata = { title: "Biblioteca (admin)" };

export default async function AdminLibraryPage() {
  const { subjects, topics, contents } = await listAdminLibrary();
  const subjName = new Map(subjects.map((s) => [s.id, s.name]));
  const topicName = new Map(topics.map((t) => [t.id, t.name]));

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">
          Gerenciar Biblioteca
        </h1>
        <Link
          href="/admin/biblioteca/novo"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> Novo conteúdo
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-surface text-left text-xs text-muted">
            <tr>
              <th className="p-3">Conteúdo</th>
              <th className="p-3">Matéria / Tema</th>
              <th className="p-3">Recorrência</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {contents.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">
                  <Link
                    href={`/admin/biblioteca/${c.id}`}
                    className="text-foreground hover:text-secondary"
                  >
                    {c.title}
                  </Link>
                </td>
                <td className="p-3 text-xs text-muted">
                  {subjName.get(c.subject_id)} · {topicName.get(c.topic_id)}
                </td>
                <td className="p-3 text-xs">
                  {RECURRENCE[c.recurrence as Recurrence]?.dot}{" "}
                  {RECURRENCE[c.recurrence as Recurrence]?.label}
                </td>
                <td className="p-3 text-xs">
                  <span
                    className={
                      c.is_published ? "text-emerald-400" : "text-muted"
                    }
                  >
                    {c.is_published ? "publicado" : "rascunho"}
                  </span>
                </td>
              </tr>
            ))}
            {contents.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted">
                  Nenhum conteúdo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
