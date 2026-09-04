import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";
import { getPost, getComments } from "@/lib/comunidade/queries";
import { PostCard } from "@/components/comunidade/PostCard";
import { CommentThread } from "@/components/comunidade/CommentThread";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await requireUser();
  const post = await getPost(user.id, params.id);
  return { title: post ? post.title : "Publicação" };
}

export default async function PostPage({ params }: Props) {
  const user = await requireUser();
  const post = await getPost(user.id, params.id);
  if (!post) notFound();

  const [comments, admin] = await Promise.all([
    getComments(post.id),
    isAppAdmin(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-5">
      <Link
        href={`/comunidade/g/${post.group_slug}`}
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        {post.group_name}
      </Link>

      <PostCard
        post={post}
        currentUserId={user.id}
        isAdmin={admin}
        preview={false}
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Comentários ({post.comment_count})
        </h2>
        <CommentThread
          postId={post.id}
          comments={comments}
          currentUserId={user.id}
          isAdmin={admin}
        />
      </div>
    </div>
  );
}
