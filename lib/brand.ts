/**
 * Identidade de marca da COGNI IA — fonte única.
 *
 * Cores e voz vêm da base de conhecimento oficial ("COGNI IA — Base de
 * Conhecimento Ampliada", §7 Sistema de Cores; "Manual de Identidade e
 * Produção", §1–2). Estilo visual: **Neo-Minimalismo Educativo** — formas
 * limpas, geométricas, foco absoluto na legibilidade.
 *
 * O símbolo é um anel aberto (o "C" de Cogni / a órbita da exploração) com um
 * nó guia — o "Explorador Cogni" — e uma faísca central (o insight).
 */

export const BRAND = {
  name: "COGNI IA",
  /** posicionamento curto (Manual de Identidade §1) */
  tagline: "Do conhecimento complexo à clareza.",
  /** descrição para SEO/OG */
  description:
    "Estude para o ENEM e vestibulares com uma IA que aprende com você: biblioteca curada, tutor que explica passo a passo, correção de redação e um plano que se adapta ao seu ritmo.",
  /** tom de voz (Manual de Identidade §1) */
  voice: "curioso, acessível, autoritário — mas amigável",
  colors: {
    background: "#0B1220",
    card: "#111A2E",
    primary: "#3B82F6",
    secondary: "#60A5FA",
    text: "#E5E7EB",
    muted: "#94A3B8",
  },
} as const;

type MarkOpts = {
  /** cor do anel + faísca (default: primária) */
  primary?: string;
  /** cor do nó guia (default: secundária) */
  secondary?: string;
  /** dimensão do lado (px). O viewBox é sempre 32. */
  size?: number;
};

/** SVG do símbolo (sem wordmark). Serve para inline, favicon e OG. */
export function markSvg(opts: MarkOpts = {}): string {
  const p = opts.primary ?? BRAND.colors.primary;
  const s = opts.secondary ?? BRAND.colors.secondary;
  const dim = opts.size ? ` width="${opts.size}" height="${opts.size}"` : "";
  return (
    `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"${dim}>` +
    // anel aberto (órbita / "C")
    `<path d="M25.4 19.42 A10 10 0 1 0 23.07 8.93" stroke="${p}" stroke-width="4.4" stroke-linecap="round"/>` +
    // faísca central (o insight)
    `<circle cx="16" cy="16" r="2.5" fill="${p}"/>` +
    // nó guia (o "Explorador Cogni")
    `<circle cx="23.07" cy="8.93" r="3.5" fill="${s}"/>` +
    `</svg>`
  );
}

/** Data URI do símbolo (para <img> em next/og — runtime-agnóstico). */
export function markDataUri(opts: MarkOpts = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markSvg(opts))}`;
}
