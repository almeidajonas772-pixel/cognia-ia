"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImagePlus, X, Loader2 } from "lucide-react";
import { BANCAS } from "@/lib/redacao/bancas";
import { createEssay } from "@/lib/redacao/actions";
import type { RubricLite } from "@/lib/redacao/queries";
import type {
  CorrectionMode,
  CorrectionType,
  DetailLevel,
} from "@/lib/redacao/types";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "cogni:redacao:draft";
const MAX_BYTES = 8 * 1024 * 1024;

type FileItem = { dataUrl: string; name: string; isPdf: boolean };

export function RedacaoComposer({ rubrics }: { rubrics: RubricLite[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"texto" | "arquivo">("texto");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [banca, setBanca] = useState("enem");
  const [useRubric, setUseRubric] = useState(false);
  const [rubricId, setRubricId] = useState<string | null>(null);
  const [rubricText, setRubricText] = useState("");
  const [interpreting, setInterpreting] = useState(false);
  const [correctionType, setCorrectionType] = useState<CorrectionType>("comentada");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("equilibrada");
  const [mode, setMode] = useState<CorrectionMode>("treino");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // rascunho automático (spec §1.1) — por navegador
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setTitle(d.title ?? "");
        setText(d.text ?? "");
      }
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, text }));
      } catch {
        /* ignore */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [title, text]);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setErr(null);
    const next: FileItem[] = [];
    for (const f of Array.from(list)) {
      if (files.length + next.length >= 6) break;
      const isPdf = f.type === "application/pdf";
      if (!f.type.startsWith("image/") && !isPdf) continue;
      if (f.size > MAX_BYTES) {
        setErr("Cada arquivo deve ter até 8 MB.");
        continue;
      }
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      next.push({ dataUrl, name: f.name, isPdf });
    }
    setFiles((p) => [...p, ...next].slice(0, 6));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function interpretRubric() {
    if (rubricText.trim().length < 20) {
      setErr("Cole o texto da rubrica (mínimo ~20 caracteres).");
      return;
    }
    setInterpreting(true);
    setErr(null);
    try {
      const res = await fetch("/api/redacao/rubrica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Rubrica personalizada",
          raw: rubricText,
          source: "texto",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "erro");
      setRubricId(data.rubricId);
    } catch {
      setErr("Não foi possível interpretar a rubrica agora.");
    } finally {
      setInterpreting(false);
    }
  }

  async function submit() {
    setErr(null);
    if (tab === "texto" && text.trim().length < 40) {
      setErr("A redação está muito curta.");
      return;
    }
    if (tab === "arquivo" && files.length === 0) {
      setErr("Envie ao menos um arquivo.");
      return;
    }
    if (useRubric && !rubricId) {
      setErr("Interprete a rubrica antes de enviar.");
      return;
    }
    setBusy(true);
    try {
      let transcription: string | undefined;
      let source: "texto" | "imagem" | "pdf" = "texto";

      if (tab === "arquivo") {
        source = files.some((f) => f.isPdf) ? "pdf" : "imagem";
        const res = await fetch("/api/redacao/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: files.map((f) => ({ dataUrl: f.dataUrl, name: f.name })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "ocr");
        transcription = data.transcription;
      }

      const result = await createEssay({
        title: title || (tab === "texto" ? text.slice(0, 60) : "Redação"),
        source,
        text: tab === "texto" ? text : undefined,
        transcription,
        banca: useRubric ? "custom" : banca,
        rubricId: useRubric ? rubricId : null,
        correctionType,
        detailLevel,
        mode,
      });

      if (!result.ok) {
        setErr(
          result.error === "premium_required"
            ? "Recurso exclusivo do Premium."
            : "Não foi possível criar a redação."
        );
        setBusy(false);
        return;
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      router.push(`/redacao/${result.id}`);
    } catch {
      setErr("Falha ao processar. Tente novamente.");
      setBusy(false);
    }
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título da redação (opcional)"
        className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
      />

      <div className="flex gap-2">
        <TabBtn active={tab === "texto"} onClick={() => setTab("texto")}>
          <FileText className="h-4 w-4" /> Texto digitado
        </TabBtn>
        <TabBtn active={tab === "arquivo"} onClick={() => setTab("arquivo")}>
          <ImagePlus className="h-4 w-4" /> Foto / PDF
        </TabBtn>
      </div>

      {tab === "texto" ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={14}
            placeholder="Cole ou digite sua redação aqui…"
            className="w-full resize-y rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />
          <p className="mt-1 text-xs text-muted">
            {wordCount} palavras · rascunho salvo automaticamente neste navegador
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-6 text-sm text-muted hover:text-foreground"
          >
            <ImagePlus className="h-5 w-5" />
            Selecionar fotos ou PDF da redação manuscrita
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            hidden
            onChange={(e) => addFiles(e.target.files)}
          />
          {files.length > 0 && (
            <ul className="mt-3 space-y-1">
              {files.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded bg-white/5 px-3 py-1.5 text-xs text-foreground"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((p) => p.filter((_, idx) => idx !== i))
                    }
                    aria-label="Remover"
                  >
                    <X className="h-3.5 w-3.5 text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted">
            O texto será extraído por OCR e você confere a transcrição antes da
            correção.
          </p>
        </div>
      )}

      {/* modelo de correção */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Modelo de correção
        </p>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={useRubric}
            onChange={(e) => {
              setUseRubric(e.target.checked);
              setRubricId(null);
            }}
          />
          Usar rubrica personalizada
        </label>

        {!useRubric ? (
          <select
            value={banca}
            onChange={(e) => setBanca(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
          >
            {BANCAS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — escala 0 a {b.scaleMax}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-2">
            {rubrics.length > 0 && (
              <select
                value={rubricId ?? ""}
                onChange={(e) => setRubricId(e.target.value || null)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
              >
                <option value="">Nova rubrica…</option>
                {rubrics.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
            {!rubricId && (
              <>
                <textarea
                  value={rubricText}
                  onChange={(e) => setRubricText(e.target.value)}
                  rows={4}
                  placeholder="Cole aqui os critérios da sua rubrica (pesos, o que cada critério avalia, escala)…"
                  className="w-full resize-y rounded-lg border border-border bg-surface p-2 text-xs text-foreground placeholder:text-muted focus:outline-none"
                />
                <button
                  type="button"
                  onClick={interpretRubric}
                  disabled={interpreting}
                  className="inline-flex h-8 items-center gap-2 rounded-lg border border-border px-3 text-xs text-foreground hover:bg-white/5 disabled:opacity-50"
                >
                  {interpreting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Interpretar rubrica
                </button>
              </>
            )}
            {rubricId && (
              <p className="text-xs text-emerald-400">Rubrica pronta para uso.</p>
            )}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-3">
          <select
            value={correctionType}
            onChange={(e) => setCorrectionType(e.target.value as CorrectionType)}
            className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
          >
            <option value="simples">Correção simples</option>
            <option value="comentada">Correção comentada</option>
          </select>
          <select
            value={detailLevel}
            onChange={(e) => setDetailLevel(e.target.value as DetailLevel)}
            className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
          >
            <option value="objetiva">Objetiva</option>
            <option value="equilibrada">Equilibrada</option>
            <option value="detalhada">Extremamente detalhada</option>
          </select>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as CorrectionMode)}
            className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
          >
            <option value="treino">Modo treino</option>
            <option value="simulacao">Modo simulação oficial</option>
          </select>
        </div>
      </div>

      {err && <p className="text-sm text-rose-400">{err}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {tab === "arquivo" ? "Enviar e transcrever" : "Enviar para correção"}
      </button>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary-soft text-secondary"
          : "border-border text-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
