"use client";

import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { UPGRADE_COPY } from "@/lib/billing/config";

/**
 * Tela de limite padrão (spec §1). Reutilizável por qualquer funcionalidade
 * do Plano Gratuito ao atingir o limite.
 */
export function UpgradeDialog({
  title,
  body,
  onClose,
}: {
  title?: string;
  body?: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-card animate-fade-in">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-secondary">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-foreground">
          {title ?? UPGRADE_COPY.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{body ?? UPGRADE_COPY.body}</p>
        <Link
          href="/precos"
          className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {UPGRADE_COPY.cta}
        </Link>
      </div>
    </div>
  );
}
