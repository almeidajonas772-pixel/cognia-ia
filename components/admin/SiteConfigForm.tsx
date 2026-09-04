"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { updateSiteConfig } from "@/lib/admin/actions";
import type { SiteConfig } from "@/lib/admin/config";

export function SiteConfigForm({ config }: { config: SiteConfig }) {
  const [c, setC] = useState(config);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    await updateSiteConfig(c);
    setBusy(false);
    setSaved(true);
  }

  return (
    <div className="max-w-lg space-y-3">
      <F label="Nome da plataforma">
        <input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} className={inp} />
      </F>
      <F label="Descrição">
        <textarea value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} rows={2} className={inp} />
      </F>
      <F label="E-mail de contato">
        <input value={c.contact_email} onChange={(e) => setC({ ...c, contact_email: e.target.value })} className={inp} />
      </F>
      <div className="grid grid-cols-3 gap-2">
        <F label="Instagram">
          <input value={c.social.instagram ?? ""} onChange={(e) => setC({ ...c, social: { ...c.social, instagram: e.target.value } })} className={inp} />
        </F>
        <F label="YouTube">
          <input value={c.social.youtube ?? ""} onChange={(e) => setC({ ...c, social: { ...c.social, youtube: e.target.value } })} className={inp} />
        </F>
        <F label="TikTok">
          <input value={c.social.tiktok ?? ""} onChange={(e) => setC({ ...c, social: { ...c.social, tiktok: e.target.value } })} className={inp} />
        </F>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <F label="URL dos Termos">
          <input value={c.terms_url} onChange={(e) => setC({ ...c, terms_url: e.target.value })} className={inp} />
        </F>
        <F label="URL da Privacidade">
          <input value={c.privacy_url} onChange={(e) => setC({ ...c, privacy_url: e.target.value })} className={inp} />
        </F>
      </div>
      <F label="Google Analytics ID (também defina NEXT_PUBLIC_GA_ID)">
        <input value={c.ga_id} onChange={(e) => setC({ ...c, ga_id: e.target.value })} placeholder="G-XXXXXXX" className={inp} />
      </F>

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Salvar configurações
      </button>
      {saved && <span className="ml-2 text-xs text-emerald-400">Salvo.</span>}
    </div>
  );
}

const inp =
  "h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm text-foreground focus:outline-none";

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
