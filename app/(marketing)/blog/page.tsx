import type { Metadata } from "next";
import { listPublishedPosts } from "@/lib/blog/queries";
import { BlogCard } from "@/components/blog/BlogCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Dicas de estudo, técnicas de redação e guias de ENEM e vestibulares do COGNI IA.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const posts = await listPublishedPosts(30);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Blog</h1>
        <p className="mt-2 text-sm text-muted">
          Estratégias de estudo, redação e preparação para o ENEM e vestibulares.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-muted">Nenhum artigo publicado ainda.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((p) => (
            <BlogCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </main>
  );
}
