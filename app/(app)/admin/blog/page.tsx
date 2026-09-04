import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listAllPostsAdmin } from "@/lib/blog/queries";

export const metadata: Metadata = { title: "Blog (admin)" };

export default async function AdminBlogPage() {
  const posts = await listAllPostsAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Blog</h1>
        <Link
          href="/admin/blog/novo"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" /> Novo artigo
        </Link>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border">
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/admin/blog/${p.id}`}
            className="flex items-center justify-between p-3 hover:bg-white/[0.03]"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm text-foreground">
                {p.title}
              </span>
              <span className="text-xs text-muted">
                {p.category} ·{" "}
                {p.published_at
                  ? new Date(p.published_at).toLocaleDateString("pt-BR")
                  : "sem data"}
              </span>
            </span>
            <span
              className={
                p.status === "publicado"
                  ? "text-xs text-emerald-400"
                  : p.status === "agendado"
                    ? "text-xs text-amber-400"
                    : "text-xs text-muted"
              }
            >
              {p.status}
            </span>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="p-4 text-center text-sm text-muted">Nenhum artigo.</p>
        )}
      </div>
    </div>
  );
}
