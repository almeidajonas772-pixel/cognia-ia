"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

/** Fase 13 — captura de e-mail para a lista de espera. */
export function WaitlistForm({ source = "cadastro" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <Check className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-medium text-foreground">Você está na lista!</p>
        <p className="mt-1 text-xs text-muted">
          Avisaremos por e-mail assim que sua vaga abrir.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
      <h1 className="text-lg font-semibold text-foreground">Entre na lista de espera</h1>
      <p className="mt-1 text-sm text-muted">
        O acesso está sendo liberado aos poucos. Deixe seu e-mail e avisamos quando
        for a sua vez.
      </p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        className="mt-4 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
      />
      {state === "error" && (
        <p className="mt-2 text-xs text-rose-400">
          Não foi possível registrar agora. Tente novamente.
        </p>
      )}
      <button
        type="submit"
        disabled={state === "loading"}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {state === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        Quero ser avisado
      </button>
    </form>
  );
}
