"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { createTopic } from "@/lib/admin/library";
import type { AdminSubject } from "@/lib/admin/queries";

export function TopicCreator({ subjects }: { subjects: AdminSubject[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs text-muted hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Criar novo tema
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-3">
      <select
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
        className="h-8 rounded border border-border bg-surface px-2 text-xs text-foreground"
      >
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do tema"
        className="h-8 rounded border border-border bg-surface px-2 text-xs text-foreground"
      />
      <button
        type="button"
        disabled={busy || name.trim().length < 3}
        onClick={async () => {
          setBusy(true);
          await createTopic({ subjectId, name });
          setBusy(false);
          setName("");
          setOpen(false);
          router.refresh();
        }}
        className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-white disabled:opacity-60"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Criar tema
      </button>
    </div>
  );
}
