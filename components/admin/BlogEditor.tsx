"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { saveBlogPost, deleteBlogPost } from "@/lib/blog/actions";
import type { BlogPost } from "@/lib/blog/queries";

export function BlogEditor({ existing }: { existing?: BlogPost }) {
  const router = useRouter();
  const [f, setF] = useState({
    title: existing?.title ?? "",
    subtitle: existing?.subtitle ?? "",
    excerpt: existing?.excerpt ?? "",
    content: existing?.content ?? "",
    coverImageUrl: existing?.cover_image_url ?? "",
    category: existing?.category ?? "Estudos",
    tags: (existing?.tags ?? []).join(", "),
    keywords: (existing?.keywords ?? []).join(", "),
    seoTitle: existing?.seo_title ?? "",
    seoDescription: existing?.seo_description ?? "",
    scheduledFor: existing?.scheduled_for?.slice(0, 16) ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const up = (k: keyof typeof f) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setF({ ...f, [k]: e.target.value });

  async function save(action: "rascunho" | "publicar" | "agendar") {
    if (f.title.trim().length < 4 || f.content.trim().length < 20) {
      setMsg("Título e conteúdo são obrigatórios.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await saveBlogPost({
      id: existing?.id,
      ...f,
      action,
    });
    setBusy(false);
    if (!res.ok) {
      setMsg(res.error ?? "Erro ao salvar.");
      return;
    }
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <input
        value={f.title}
        onChange={up("title")}
        placeholder="Título"
        className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-base font-medium text-foreground"
      />
      <input
        value={f.subtitle}
        onChange={up("subtitle")}
        placeholder="Subtítulo"
        className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
      />
      <textarea
        value={f.excerpt}
        onChange={up("excerpt")}
        rows={2}
        placeholder="Resumo (aparece nos cards e na meta description)"
        className="w-full resize-y rounded-lg border border-border bg-surface p-3 text-sm text-foreground"
      />
      <textarea
        value={f.content}
        onChange={up("content")}
        rows={18}
        placeholder="Conteúdo em markdown…"
        className="w-full resize-y rounded-lg border border-border bg-surface p-3 font-mono text-xs text-foreground"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <input value={f.category} onChange={up("category")} placeholder="Categoria" className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <input value={f.coverImageUrl} onChange={up("coverImageUrl")} placeholder="URL da imagem de capa" className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <input value={f.tags} onChange={up("tags")} placeholder="tags, separadas, por vírgula" className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <input value={f.keywords} onChange={up("keywords")} placeholder="palavras-chave SEO" className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <input value={f.seoTitle} onChange={up("seoTitle")} placeholder="Título SEO (opcional)" className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
        <input value={f.seoDescription} onChange={up("seoDescription")} placeholder="Meta description (opcional)" className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" />
      </div>

      <label className="block text-xs text-muted">
        Agendar publicação
        <input
          type="datetime-local"
          value={f.scheduledFor}
          onChange={up("scheduledFor")}
          className="mt-1 block h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
        />
      </label>

      {msg && <p className="text-sm text-rose-400">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => save("publicar")} disabled={busy} primary>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Publicar
        </Btn>
        <Btn onClick={() => save("rascunho")} disabled={busy}>
          Salvar rascunho
        </Btn>
        {f.scheduledFor && (
          <Btn onClick={() => save("agendar")} disabled={busy}>
            Agendar
          </Btn>
        )}
        {existing && (
          <button
            type="button"
            onClick={() => {
              if (!confirm("Excluir este artigo?")) return;
              deleteBlogPost(existing.id).then(() => {
                router.push("/admin/blog");
                router.refresh();
              });
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-500/40 px-4 text-sm text-rose-400 hover:bg-white/5"
          >
            <Trash2 className="h-4 w-4" /> Excluir
          </button>
        )}
      </div>
    </div>
  );
}

function Btn({
  onClick,
  disabled,
  primary,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium disabled:opacity-60 ${
        primary
          ? "bg-primary text-white hover:bg-primary-hover"
          : "border border-border text-foreground hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}
