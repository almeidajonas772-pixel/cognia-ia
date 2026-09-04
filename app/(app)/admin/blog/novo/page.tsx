import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BlogEditor } from "@/components/admin/BlogEditor";

export const metadata: Metadata = { title: "Novo artigo" };

export default function NewBlogPostPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/admin/blog"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" /> Blog
      </Link>
      <h1 className="text-xl font-semibold text-foreground">Novo artigo</h1>
      <BlogEditor />
    </div>
  );
}
