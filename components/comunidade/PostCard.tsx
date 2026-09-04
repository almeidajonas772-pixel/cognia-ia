import Link from "next/link";
import { Pin, FileText, LinkIcon, Image as ImageIcon } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { PostActions } from "@/components/comunidade/PostActions";
import {
  AuthorLine,
  KindBadge,
  OfficialBadge,
  SourceRefChip,
} from "@/components/comunidade/shared";
import type { Post } from "@/lib/comunidade/types";

export function PostCard({
  post,
  currentUserId,
  isAdmin = false,
  showGroup = false,
  preview = true,
}: {
  post: Post;
  currentUserId: string;
  isAdmin?: boolean;
  showGroup?: boolean;
  preview?: boolean;
}) {
  const canDelete = isAdmin || post.author.id === currentUserId;

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {post.pinned && <Pin className="h-3.5 w-3.5 text-secondary" />}
          <KindBadge kind={post.kind} />
          {post.official && <OfficialBadge />}
          {showGroup && (
            <Link
              href={`/comunidade/g/${post.group_slug}`}
              className="text-xs text-secondary hover:underline"
            >
              {post.group_name}
            </Link>
          )}
          {post.moderation === "revisao" && (
            <span className="text-xs text-amber-400">em revisão</span>
          )}
        </div>

        <Link href={`/comunidade/p/${post.id}`} className="block">
          <h3 className="text-base font-semibold text-foreground">
            {post.title}
          </h3>
          <p
            className={
              preview
                ? "mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted"
                : "mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground"
            }
          >
            {post.content}
          </p>
        </Link>

        {post.source_ref && (
          <SourceRefChip
            href={post.source_ref.href}
            label={post.source_ref.label}
          />
        )}

        {post.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.attachments.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
              >
                {a.type === "link" ? (
                  <LinkIcon className="h-3 w-3" />
                ) : a.type === "image" ? (
                  <ImageIcon className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                {a.name}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <AuthorLine author={post.author} when={post.created_at} />
          <PostActions
            postId={post.id}
            commentCount={post.comment_count}
            initialLikes={post.like_count}
            initialLiked={!!post.liked}
            initialSaved={!!post.saved}
            canDelete={canDelete}
          />
        </div>
      </CardBody>
    </Card>
  );
}
