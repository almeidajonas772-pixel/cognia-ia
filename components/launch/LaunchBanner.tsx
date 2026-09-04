import { Megaphone } from "lucide-react";
import { getLaunchState } from "@/lib/launch";

/**
 * Fase 13 — Faixa de aviso no topo (definida pelo admin em `site_config.launch`).
 * Renderiza nada quando não há aviso. Server component.
 */
export async function LaunchBanner() {
  const { banner, mode } = await getLaunchState();
  const text =
    banner ||
    (mode === "waitlist"
      ? "Estamos em acesso antecipado — entre na lista e avisamos quando sua vaga abrir."
      : null);
  if (!text) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-primary/15 px-4 py-2 text-center text-xs text-secondary">
      <Megaphone className="h-3.5 w-3.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
