"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Reply, Pencil, Trash2, Flag } from "lucide-react";
import {
  addComment,
  updateComment,
  deleteComment,
} from "@/lib/comunidade/actions";
import { ReportDialog } from "@/components/comunidade/ReportDialog";
import { AuthorLine } from "@/components/comunidade/shared";
import type { Comment } from "@/lib/comunidade/types";

export function CommentThread({
  postId,
  comments,
  currentUserId,
  isAdmin,
}: {
  postId: string;
  comments: Comment[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  return (
    <div className="space-y-4">
      <NewComment postId={postId} />
      {comments.length === 0 ? (
        <p className="text-sm text-muted">Seja o primeiro a comentar.</p>
      ) : (
        comments.map((c) => (
          <CommentItem
            key={c.id}
            postId={postId}
            comment={c}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            depth={0}
          />
        ))
      )}
    </div>
  );
}

function NewComment({
  postId,
  parentId,
  onDone,
}: {
  postId: string;
  parentId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    if (text.trim().length < 2) return;
    setBusy(true);
    const res = await addComment({ postId, parentId, content: text });
    setBusy(false);
    if (!res.ok) {
      setMsg(
        res.error === "bloqueado"
          ? "Comentário bloqueado pela moderação."
          : "Não foi possível comentar."
      );
      return;
    }
    setText("");
    setMsg(res.pendingReview ? "Enviado — em revisão." : null);
    onDone?.();
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={parentId ? 2 : 3}
        placeholder={parentId ? "Responder…" : "Escreva um comentário…"}
        className="w-full resize-y rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
      />
      {msg && <p className="text-xs text-amber-400">{msg}</p>}
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="inline-flex h-8 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {parentId ? "Responder" : "Comentar"}
      </button>
    </div>
  );
}

function CommentItem({
  postId,
  comment,
  currentUserId,
  isAdmin,
  depth,
}: {
  postId: string;
  comment: Comment;
  currentUserId: string;
  isAdmin: boolean;
  depth: number;
}) {
  const router = useRouter();
  const mine = comment.author.id === currentUserId;
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [report, setReport] = useState(false);
  const [, start] = useTransition();

  return (
    <div className={depth > 0 ? "ml-6 border-l border-border pl-4" : ""}>
      <div className="rounded-lg bg-white/[0.03] p-3">
        <AuthorLine author={comment.author} when={comment.created_at} />
        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-border bg-surface p-2 text-sm text-foreground focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                start(async () => {
                  await updateComment(comment.id, editText);
                  setEditing(false);
                  router.refresh();
                })
              }
              className="h-7 rounded-lg bg-primary px-3 text-xs font-medium text-white"
            >
              Salvar
            </button>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {comment.content}
            {comment.edited && (
              <span className="ml-1 text-xs text-muted">(editado)</span>
            )}
          </p>
        )}

        <div className="mt-1 flex items-center gap-1 text-muted">
          <IconBtn onClick={() => setReplying((v) => !v)} icon={<Reply className="h-3 w-3" />}>
            Responder
          </IconBtn>
          {mine && (
            <IconBtn onClick={() => setEditing((v) => !v)} icon={<Pencil className="h-3 w-3" />}>
              Editar
            </IconBtn>
          )}
          {(mine || isAdmin) && (
            <IconBtn
              onClick={() =>
                start(async () => {
                  await deleteComment(comment.id, postId);
                  router.refresh();
                })
              }
              icon={<Trash2 className="h-3 w-3" />}
            >
              Excluir
            </IconBtn>
          )}
          <IconBtn onClick={() => setReport(true)} icon={<Flag className="h-3 w-3" />}>
            Denunciar
          </IconBtn>
        </div>
      </div>

      {replying && (
        <div className="ml-6 mt-2">
          <NewComment
            postId={postId}
            parentId={comment.id}
            onDone={() => setReplying(false)}
          />
        </div>
      )}

      {(comment.replies ?? []).map((r) => (
        <div key={r.id} className="mt-2">
          <CommentItem
            postId={postId}
            comment={r}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            depth={depth + 1}
          />
        </div>
      ))}

      {report && (
        <ReportDialog
          targetType="comment"
          targetId={comment.id}
          onClose={() => setReport(false)}
        />
      )}
    </div>
  );
}

function IconBtn({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] hover:bg-white/5 hover:text-foreground"
    >
      {icon}
      {children}
    </button>
  );
}
