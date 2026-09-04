"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { saveContent, deleteContent } from "@/lib/admin/library";
import { RECURRENCE_OPTIONS, RECURRENCE } from "@/lib/biblioteca/recurrence";
import type { Recurrence } from "@/lib/biblioteca/types";
import type { AdminSubject, AdminTopic } from "@/lib/admin/queries";

type Existing = {
  id: string;
  subject_id: string;
  topic_id: string;
  title: string;
  summary_short: string;
  recurrence: string;
  reading_minutes: number;
  is_published: boolean;
  body: string;
};

export function ContentEditor({
  subjects,
  topics,
  existing,
}: {
  subjects: AdminSubject[];
  topics: AdminTopic[];
  existing?: Existing;
}) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(
    existing?.subject_id ?? subjects[0]?.id ?? ""
  );
  const [topicId, setTopicId] = useState(existing?.topic_id ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [summaryShort, setSummaryShort] = useState(existing?.summary_short ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [recurrence, setRecurrence] = useState<Recurrence>(
    (existing?.recurrence as Recurrence) ?? "ocasional"
  );
  const [readingMinutes, setReadingMinutes] = useState(
    existing?.reading_minutes ?? 8
  );
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const topicOptions = topics.filter((t) => t.subject_id === subjectId);

  async function save() {
    if (title.trim().length < 4 || !subjectId || !topicId) {
      setMsg("Preencha matéria, tema e título.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await saveContent({
      id: existing?.id,
      subjectId,
      topicId,
      title,
      summaryShort,
      body,
      recurrence,
      readingMinutes,
      isPublished,
    });
    setBusy(false);
    if (!res.ok) {
      setMsg(res.error ?? "Erro ao salvar.");
      return;
    }
    router.push("/admin/biblioteca");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Matéria">
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setTopicId("");
            }}
            disabled={!!existing}
            className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tema">
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            disabled={!!existing}
            className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
          >
            <option value="">Selecione…</option>
            {topicOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Título">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
        />
      </Field>

      <Field label="Resumo rápido (grátis) — markdown, só tópicos">
        <textarea
          value={summaryShort}
          onChange={(e) => setSummaryShort(e.target.value)}
          rows={5}
          className="w-full resize-y rounded-lg border border-border bg-surface p-3 text-sm text-foreground"
        />
      </Field>

      <Field label="Resumo completo (Premium) — markdown">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={16}
          className="w-full resize-y rounded-lg border border-border bg-surface p-3 font-mono text-xs text-foreground"
        />
      </Field>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Recorrência ENEM">
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as Recurrence)}
            className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
          >
            {RECURRENCE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {RECURRENCE[r].dot} {RECURRENCE[r].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Min. de leitura">
          <input
            type="number"
            min={2}
            value={readingMinutes}
            onChange={(e) => setReadingMinutes(Number(e.target.value))}
            className="h-9 w-20 rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Publicado
        </label>
      </div>

      {msg && <p className="text-sm text-rose-400">{msg}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </button>
        {existing && (
          <button
            type="button"
            onClick={() => {
              if (!confirm("Excluir este conteúdo?")) return;
              setBusy(true);
              deleteContent(existing.id).then(() => {
                router.push("/admin/biblioteca");
                router.refresh();
              });
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-500/40 px-4 text-sm text-rose-400 hover:bg-white/5"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
