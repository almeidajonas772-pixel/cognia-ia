import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPostByIdAdmin } from "@/lib/blog/queries";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const metadata: Metadata = { title: "Editar artigo" };

export default async function EditBlogPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPostByIdAdmin(params.id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" /> Blog
        </Link>
        {post.status === "publicado" && (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="text-xs text-secondary hover:underline"
          >
            Ver publicado ↗
          </Link>
        )}
      </div>
      <h1 className="text-xl font-semibold text-foreground">
        Editar: {post.title}
      </h1>
      <BlogEditor existing={post} />
    </div>
  );
}
