"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { syncMfaState } from "@/lib/security/mfa-actions";

/**
 * Fase 11 — Enrolamento TOTP (2FA) via Supabase Auth. O segredo/QR são gerados
 * no cliente; ao confirmar, `syncMfaState` (server) espelha em user_security.
 */
type Factor = { id: string; status: string; friendly_name?: string | null };

export function MfaSetup({ initialEnabled }: { initialEnabled: boolean }) {
  const supabase = createClient();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState<{
    factorId: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  async function refresh() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const all = [...(data?.totp ?? []), ...(data?.all ?? [])];
      const uniq = Array.from(new Map(all.map((f) => [f.id, f])).values()) as Factor[];
      setFactors(uniq);
      setEnabled(uniq.some((f) => f.status === "verified"));
    } catch {
      setUnavailable(true);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnroll() {
    setErr(null);
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      setEnrolling({
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não foi possível iniciar o 2FA.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll() {
    if (!enrolling) return;
    setErr(null);
    setBusy(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: enrolling.factorId,
      });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enrolling.factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (vErr) throw vErr;
      setEnrolling(null);
      setCode("");
      await syncMfaState();
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Código inválido.");
    } finally {
      setBusy(false);
    }
  }

  async function disableAll() {
    setBusy(true);
    setErr(null);
    try {
      for (const f of factors) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      await syncMfaState();
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não foi possível desativar.");
    } finally {
      setBusy(false);
    }
  }

  if (unavailable) {
    return (
      <p className="text-sm text-muted">
        A verificação em duas etapas fica disponível quando o Supabase Auth está
        conectado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        {enabled ? (
          <>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-foreground">2FA ativo (aplicativo autenticador)</span>
          </>
        ) : (
          <>
            <ShieldOff className="h-4 w-4 text-muted" />
            <span className="text-muted">2FA não configurado</span>
          </>
        )}
      </div>

      {err && <p className="text-sm text-rose-400">{err}</p>}

      {enrolling ? (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-sm text-foreground">
            Escaneie o QR no seu app autenticador (Google Authenticator, Authy…)
            ou use a chave manual.
          </p>
          {/* data:image/svg+xml do Supabase */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrolling.qr} alt="QR code 2FA" className="h-40 w-40 rounded bg-white p-2" />
          <p className="break-all text-xs text-muted">Chave: {enrolling.secret}</p>
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de 6 dígitos"
            className="h-10 w-40 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || code.trim().length < 6}
              onClick={confirmEnroll}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setEnrolling(null)}
              className="h-9 rounded-lg border border-border px-3 text-sm text-muted hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : enabled ? (
        <button
          type="button"
          disabled={busy}
          onClick={disableAll}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-white/5 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Desativar 2FA
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={startEnroll}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Ativar 2FA
        </button>
      )}
    </div>
  );
}
