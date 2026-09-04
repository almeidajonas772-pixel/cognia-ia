"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, Loader2, SkipForward } from "lucide-react";
import { saveOnboarding, completeOnboarding, skipOnboarding } from "@/lib/onboarding/actions";
import {
  GOALS,
  LEVELS,
  FOCUS_AREAS,
  type Goal,
  type Level,
} from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";

type Draft = {
  goal: Goal | null;
  examDate: string | null;
  targetCourse: string | null;
  focusAreas: string[];
  level: Level | null;
};

const STEPS = ["Objetivo", "Quando", "Matérias", "Nível"] as const;

export function OnboardingWizard({ initial }: { initial: Draft }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setD((prev) => ({ ...prev, [k]: v }) as Draft);

  const toggleArea = (id: string) =>
    setD((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(id)
        ? prev.focusAreas.filter((a) => a !== id)
        : [...prev.focusAreas, id],
    }));

  const canNext =
    (step === 0 && !!d.goal) ||
    step === 1 ||
    (step === 2 && d.focusAreas.length > 0) ||
    (step === 3 && !!d.level);

  function finish() {
    setErr(null);
    start(async () => {
      const saved = await saveOnboarding(d);
      if (!saved.ok) return setErr("Não foi possível salvar. Tente de novo.");
      const done = await completeOnboarding();
      if (!done.ok) return setErr("Não foi possível concluir. Tente de novo.");
      router.replace("/dashboard?welcome=1");
      router.refresh();
    });
  }

  function skip() {
    start(async () => {
      await skipOnboarding();
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Passo {step + 1} de {STEPS.length} · {STEPS[step]}
        </p>
        <button
          type="button"
          onClick={skip}
          disabled={pending}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
        >
          <SkipForward className="h-3.5 w-3.5" /> Pular
        </button>
      </div>

      <div className="mt-2 flex gap-1">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= step ? "bg-primary" : "bg-white/10"
            )}
          />
        ))}
      </div>

      <div className="mt-6 min-h-[220px]">
        {step === 0 && (
          <Fieldset title="Qual é o seu objetivo principal?">
            {GOALS.map((g) => (
              <Choice
                key={g.id}
                selected={d.goal === g.id}
                onClick={() => set("goal", g.id)}
                label={g.label}
              />
            ))}
          </Fieldset>
        )}

        {step === 1 && (
          <Fieldset title="Quando é a sua prova? (opcional)">
            <input
              type="date"
              value={d.examDate ?? ""}
              onChange={(e) => set("examDate", e.target.value || null)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
            <input
              type="text"
              value={d.targetCourse ?? ""}
              onChange={(e) => set("targetCourse", e.target.value || null)}
              placeholder="Curso / universidade dos sonhos (opcional)"
              className="mt-3 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
          </Fieldset>
        )}

        {step === 2 && (
          <Fieldset title="Em quais áreas quer focar?">
            {FOCUS_AREAS.map((a) => (
              <Choice
                key={a.id}
                selected={d.focusAreas.includes(a.id)}
                onClick={() => toggleArea(a.id)}
                label={a.label}
                multi
              />
            ))}
          </Fieldset>
        )}

        {step === 3 && (
          <Fieldset title="Como você se sente hoje nos estudos?">
            {LEVELS.map((l) => (
              <Choice
                key={l.id}
                selected={d.level === l.id}
                onClick={() => set("level", l.id)}
                label={l.label}
                hint={l.hint}
              />
            ))}
          </Fieldset>
        )}
      </div>

      {err && <p className="mt-3 text-sm text-rose-400">{err}</p>}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted hover:text-foreground disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext || pending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Continuar <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={!canNext || pending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Concluir
          </button>
        )}
      </div>
    </div>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Choice({
  selected,
  onClick,
  label,
  hint,
  multi,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition",
        selected
          ? "border-primary bg-primary-soft text-foreground"
          : "border-border text-muted hover:border-secondary/40 hover:text-foreground"
      )}
    >
      <span>
        {label}
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <span
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center border",
          multi ? "rounded" : "rounded-full",
          selected ? "border-primary bg-primary text-white" : "border-border"
        )}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}
