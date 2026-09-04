"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Bookmark, MessageSquare, Flag, Trash2 } from "lucide-react";
import { toggleLike, savePost, deletePost } from "@/lib/comunidade/actions";
import { ReportDialog } from "@/components/comunidade/ReportDialog";
import { cn } from "@/lib/utils";

export function PostActions({
  postId,
  commentCount,
  initialLikes,
  initialLiked,
  initialSaved,
  canDelete,
}: {
  postId: string;
  commentCount: number;
  initialLikes: number;
  initialLiked: boolean;
  initialSaved: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [saved, setSaved] = useState(initialSaved);
  const [report, setReport] = useState(false);
  const [, start] = useTransition();

  function like() {
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    start(async () => {
      const res = await toggleLike(postId, next);
      if (!res?.ok) {
        setLiked(!next);
        setLikes((n) => n + (next ? -1 : 1));
      }
    });
  }
  function save() {
    const next = !saved;
    setSaved(next);
    start(() => void savePost(postId, next));
  }
  function remove() {
    if (!confirm("Excluir esta publicação?")) return;
    start(async () => {
      await deletePost(postId);
      router.push("/comunidade");
    });
  }

  return (
    <div className="flex items-center gap-1 text-muted">
      <button
        type="button"
        onClick={like}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-white/5",
          liked && "text-rose-400"
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", liked && "fill-rose-400")} />
        {likes}
      </button>
      <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs">
        <MessageSquare className="h-3.5 w-3.5" />
        {commentCount}
      </span>
      <button
        type="button"
        onClick={save}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-white/5",
          saved && "text-amber-400"
        )}
      >
        <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-amber-400")} />
        Salvar
      </button>
      <button
        type="button"
        onClick={() => setReport(true)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-white/5"
      >
        <Flag className="h-3.5 w-3.5" />
        Denunciar
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={remove}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-white/5 hover:text-rose-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      {report && (
        <ReportDialog
          targetType="post"
          targetId={postId}
          onClose={() => setReport(false)}
        />
      )}
    </div>
  );
}
