import Link from "next/link";
import { Clock } from "lucide-react";
import type { BlogCard as BlogCardT } from "@/lib/blog/queries";

export function BlogCard({ post }: { post: BlogCardT }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt=""
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium text-secondary">
          {post.category}
        </span>
        <h3 className="mt-1 text-base font-semibold text-foreground">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{post.excerpt}</p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted">
          <span>{post.author_name}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.reading_minutes} min
          </span>
          {post.published_at && (
            <span>
              {new Date(post.published_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
