"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "COGNI IA", url: value });
        return;
      }
    } catch {
      /* usuário cancelou o share — cai para copiar */
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" /> Copiado
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" /> Compartilhar
        </>
      )}
    </button>
  );
}
