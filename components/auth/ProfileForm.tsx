"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function ProfileForm({
  userId,
  initialName,
}: {
  userId: string;
  initialName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ full_name: name.trim() || null })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setMsg({ ok: false, text: "Não foi possível salvar. Tente novamente." });
      return;
    }
    setMsg({ ok: true, text: "Perfil atualizado." });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Nome</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          className="h-10 w-full max-w-sm rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
        />
      </label>

      {msg && (
        <p
          className={`text-xs ${
            msg.ok ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {msg.text}
        </p>
      )}

      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
