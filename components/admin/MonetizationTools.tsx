"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Power } from "lucide-react";
import {
  upsertCoupon,
  toggleCoupon,
  updateBillingConfig,
} from "@/lib/billing/actions";
import type { AdminCoupon } from "@/lib/billing/coupons";
import type { AdsConfig } from "@/lib/ads/config";
import type { FreeLimits } from "@/lib/billing/config";

export function MonetizationTools({
  coupons,
  limits,
  ads,
}: {
  coupons: AdminCoupon[];
  limits: FreeLimits;
  ads: AdsConfig;
}) {
  return (
    <div className="space-y-8">
      <CouponManager coupons={coupons} />
      <LimitsEditor limits={limits} />
      <AdsPanel ads={ads} />
    </div>
  );
}

function CouponManager({ coupons }: { coupons: AdminCoupon[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [code, setCode] = useState("");
  const [pct, setPct] = useState(20);
  const [applies, setApplies] = useState("ambos");
  const [max, setMax] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (code.trim().length < 3) return;
    setBusy(true);
    await upsertCoupon({
      code,
      discountPct: pct,
      appliesTo: applies,
      maxRedemptions: max ? Number(max) : null,
    });
    setBusy(false);
    setCode("");
    router.refresh();
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-foreground">
        Cupons de desconto
      </h2>
      <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-border p-3">
        <Field label="Código">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="h-8 w-28 rounded border border-border bg-surface px-2 text-xs text-foreground"
          />
        </Field>
        <Field label="% desconto">
          <input
            type="number"
            min={0}
            max={100}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="h-8 w-16 rounded border border-border bg-surface px-2 text-xs text-foreground"
          />
        </Field>
        <Field label="Plano">
          <select
            value={applies}
            onChange={(e) => setApplies(e.target.value)}
            className="h-8 rounded border border-border bg-surface px-2 text-xs text-foreground"
          >
            <option value="ambos">Ambos</option>
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
          </select>
        </Field>
        <Field label="Máx. usos">
          <input
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="∞"
            className="h-8 w-16 rounded border border-border bg-surface px-2 text-xs text-foreground"
          />
        </Field>
        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Criar
        </button>
      </div>

      <div className="space-y-1">
        {coupons.length === 0 && (
          <p className="text-sm text-muted">Nenhum cupom.</p>
        )}
        {coupons.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
          >
            <div>
              <span className="font-mono font-semibold text-foreground">
                {c.code}
              </span>
              <span className="ml-2 text-xs text-muted">
                {c.discount_pct > 0 && `${c.discount_pct}% `}
                {c.discount_fixed > 0 &&
                  `R$ ${c.discount_fixed.toFixed(2)} `}
                · {c.applies_to} · {c.redemptions}
                {c.max_redemptions ? `/${c.max_redemptions}` : ""} usos
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                start(async () => {
                  await toggleCoupon(c.id, !c.active);
                  router.refresh();
                })
              }
              className={`inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-xs ${
                c.active
                  ? "border-emerald-500/40 text-emerald-400"
                  : "border-border text-muted"
              }`}
            >
              <Power className="h-3 w-3" />
              {c.active ? "Ativo" : "Inativo"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function LimitsEditor({ limits }: { limits: FreeLimits }) {
  const router = useRouter();
  const [state, setState] = useState(limits);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const keys = Object.keys(state) as (keyof FreeLimits)[];

  async function save() {
    setBusy(true);
    await updateBillingConfig("plan_limits", { free: state });
    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-foreground">
        Limites do Plano Gratuito
      </h2>
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-3">
        {keys.map((k) => (
          <label key={k} className="text-xs text-muted">
            {k}
            <input
              type="number"
              value={state[k]}
              onChange={(e) =>
                setState({ ...state, [k]: Number(e.target.value) })
              }
              className="mt-0.5 h-8 w-full rounded border border-border bg-surface px-2 text-sm text-foreground"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="mt-2 inline-flex h-8 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-white disabled:opacity-60"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Salvar limites
      </button>
      {saved && <span className="ml-2 text-xs text-emerald-400">Salvo.</span>}
    </section>
  );
}

function AdsPanel({ ads }: { ads: AdsConfig }) {
  const router = useRouter();
  const [state, setState] = useState(ads);
  const [busy, setBusy] = useState(false);

  async function save(next: AdsConfig) {
    setState(next);
    setBusy(true);
    await updateBillingConfig("ads", next);
    setBusy(false);
    router.refresh();
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-foreground">
        Anúncios
      </h2>
      <div className="space-y-2 rounded-lg border border-border p-3">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={state.enabled}
            onChange={(e) => save({ ...state, enabled: e.target.checked })}
          />
          Anúncios ativados (apenas plano gratuito)
        </label>
        {Object.entries(state.placements).map(([slug, p]) => (
          <div
            key={slug}
            className="flex items-center justify-between text-xs text-muted"
          >
            <span>{slug}</span>
            <label className="flex items-center gap-1 text-foreground">
              <input
                type="checkbox"
                checked={p.enabled}
                onChange={(e) =>
                  save({
                    ...state,
                    placements: {
                      ...state.placements,
                      [slug]: { ...p, enabled: e.target.checked },
                    },
                  })
                }
              />
              exibir
            </label>
          </div>
        ))}
        {busy && (
          <p className="text-xs text-muted">
            <Loader2 className="inline h-3 w-3 animate-spin" /> salvando…
          </p>
        )}
      </div>
    </section>
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
    <label className="text-[10px] uppercase tracking-wide text-muted">
      <span className="block">{label}</span>
      {children}
    </label>
  );
}
