"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { LimitDialog } from "@/components/chat/LimitDialog";
import { SendToLibraryButton } from "@/components/comunidade/SendToLibraryButton";
import type { ChatDepth } from "@/lib/chat/types";
import type { GeneratedQuestion } from "@/lib/ai/types";

type Kind = "resumo" | "questoes";

export function GenerateDialog({
  kind,
  defaultDepth,
  onClose,
}: {
  kind: Kind;
  defaultDepth: ChatDepth;
  onClose: () => void;
}) {
  const [tema, setTema] = useState("");
  const [depth, setDepth] = useState<ChatDepth>(defaultDepth);
  const [formato, setFormato] = useState("revisao-enem");
  const [quantidade, setQuantidade] = useState(3);
  const [banca, setBanca] = useState("ENEM");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [limit, setLimit] = useState<{ title: string; body: string } | null>(
    null
  );
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  async function run() {
    if (!tema.trim()) return;
    setLoading(true);
    setErr(null);
    setMarkdown(null);
    setQuestions(null);
    try {
      const url = kind === "resumo" ? "/api/chat/summary" : "/api/chat/questions";
      const payload =
        kind === "resumo"
          ? {
              tema,
              depth,
              formato,
              recursos: { tabelas: true, exemplos: true, diagramas: true },
            }
          : { tema, quantidade, banca, depth };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 402) {
        const d = await res.json().catch(() => null);
        setLimit({ title: d?.title ?? "Limite atingido", body: d?.body ?? "" });
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (kind === "resumo") setMarkdown(data.markdown ?? "");
      else setQuestions(data.questions ?? []);
    } catch {
      setErr("Não foi possível gerar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative my-8 w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            {kind === "resumo"
              ? "Gerar resumo personalizado"
              : "Gerar questões estilo ENEM"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Tema (ex.: Revolução Industrial, funções do 2º grau)"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
          />

          <div className="flex flex-wrap gap-2">
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value as ChatDepth)}
              className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
            >
              <option value="basico">Básico</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>

            {kind === "resumo" ? (
              <select
                value={formato}
                onChange={(e) => setFormato(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
              >
                <option value="topicos">Tópicos</option>
                <option value="texto">Texto corrido</option>
                <option value="flashcards">Flashcards</option>
                <option value="mapa-mental">Mapa mental</option>
                <option value="revisao-enem">Revisão rápida ENEM</option>
              </select>
            ) : (
              <>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  className="h-9 w-16 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
                />
                <input
                  value={banca}
                  onChange={(e) => setBanca(e.target.value)}
                  placeholder="Banca"
                  className="h-9 w-28 rounded-lg border border-border bg-surface px-2 text-xs text-foreground"
                />
              </>
            )}

            <button
              type="button"
              onClick={run}
              disabled={loading || !tema.trim()}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Gerar
            </button>
          </div>

          {err && <p className="text-xs text-rose-400">{err}</p>}

          {markdown != null && (
            <div>
              <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border bg-surface p-4">
                <ChatMarkdown>{markdown}</ChatMarkdown>
              </div>
              {markdown.trim().length > 200 && (
                <SendToLibraryButton content={markdown} defaultTitle={tema} />
              )}
            </div>
          )}

          {questions != null && (
            <div className="max-h-[55vh] space-y-4 overflow-y-auto">
              {questions.map((q, qi) => (
                <div
                  key={qi}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <p className="text-sm text-foreground">{q.enunciado}</p>
                  <ul className="mt-2 space-y-1">
                    {q.alternativas.map((alt, ai) => (
                      <li
                        key={ai}
                        className={
                          revealed.has(qi) && ai === q.gabarito
                            ? "text-sm font-medium text-emerald-400"
                            : "text-sm text-muted"
                        }
                      >
                        {alt}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() =>
                      setRevealed((s) => new Set(s).add(qi))
                    }
                    className="mt-2 text-xs text-secondary hover:underline"
                  >
                    {revealed.has(qi) ? "Gabarito abaixo" : "Ver gabarito comentado"}
                  </button>
                  {revealed.has(qi) && (
                    <p className="mt-1 text-xs text-muted">
                      <strong className="text-foreground">
                        Resposta: {"ABCDE"[q.gabarito]}.
                      </strong>{" "}
                      {q.explicacao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {limit && (
        <LimitDialog
          title={limit.title}
          body={limit.body}
          onClose={() => setLimit(null)}
        />
      )}
    </div>
  );
}
