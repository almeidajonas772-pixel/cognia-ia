"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LinkIcon, X } from "lucide-react";
import { createPost } from "@/lib/comunidade/actions";
import { POST_KIND_LABEL, type Attachment, type PostKind } from "@/lib/comunidade/types";

export function PostComposer({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PostKind>("duvida");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [links, setLinks] = useState<Attachment[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function addLink() {
    const u = linkUrl.trim();
    if (!/^https?:\/\//.test(u)) {
      setMsg("Link inválido (use http:// ou https://).");
      return;
    }
    setLinks((l) => [
      ...l,
      { type: "link", url: u, name: u.replace(/^https?:\/\//, "").slice(0, 40) },
    ]);
    setLinkUrl("");
    setMsg(null);
  }

  async function submit() {
    if (title.trim().length < 4 || content.trim().length < 10) {
      setMsg("Preencha título e conteúdo.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await createPost({
      groupId,
      kind,
      title,
      content,
      attachments: links,
    });
    setBusy(false);
    if (!res.ok) {
      const reason =
        "reason" in res && typeof res.reason === "string" ? res.reason : "";
      setMsg(
        res.error === "bloqueado"
          ? `Publicação bloqueada pela moderação. ${reason}`
          : res.error === "limite_diario"
            ? "Você atingiu o limite de publicações por dia."
            : "Não foi possível publicar."
      );
      return;
    }
    setTitle("");
    setContent("");
    setLinks([]);
    setOpen(false);
    router.refresh();
    if (res.pendingReview)
      setMsg("Enviada! Está em revisão e aparecerá após aprovação.");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted hover:border-primary/40"
      >
        Escrever uma publicação…
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as PostKind)}
        className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
      >
        {(Object.keys(POST_KIND_LABEL) as PostKind[]).map((k) => (
          <option key={k} value={k}>
            {POST_KIND_LABEL[k]}
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título"
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="Escreva aqui. Seja claro e específico — é uma comunidade de estudos."
        className="w-full resize-y rounded-lg border border-border bg-surface p-3 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-1">
          <LinkIcon className="h-3.5 w-3.5 text-muted" />
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Anexar link (material, artigo…)"
            className="h-8 flex-1 rounded-lg border border-border bg-surface px-2 text-xs text-foreground placeholder:text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={addLink}
            className="h-8 rounded-lg border border-border px-2 text-xs text-foreground hover:bg-white/5"
          >
            Adicionar
          </button>
        </div>
      </div>
      {links.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {links.map((l, i) => (
            <li
              key={i}
              className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-xs text-foreground"
            >
              {l.name}
              <button
                type="button"
                onClick={() => setLinks((ls) => ls.filter((_, x) => x !== i))}
              >
                <X className="h-3 w-3 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {msg && <p className="text-xs text-amber-400">{msg}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Publicar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-9 rounded-lg border border-border px-4 text-sm text-muted hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
      <p className="text-[11px] text-muted">
        Toda publicação passa por moderação automática antes de aparecer.
      </p>
    </div>
  );
}
