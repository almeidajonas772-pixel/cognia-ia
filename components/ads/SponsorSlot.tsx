/**
 * Espaço para patrocinadores (spec §9): cursinhos, universidades, editoras,
 * escolas, empresas educacionais. Fica oculto até ser ativado pelo admin
 * (via billing_config → placements). Não é exibido para Premium.
 */
export function SponsorSlot({
  isPremium,
  sponsor,
}: {
  isPremium: boolean;
  sponsor?: { name: string; message: string; href: string } | null;
}) {
  if (isPremium || !sponsor) return null;
  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="sponsored noopener"
      className="block rounded-xl border border-border bg-surface p-4 text-center"
    >
      <span className="text-[10px] uppercase tracking-wide text-muted">
        Patrocínio
      </span>
      <p className="mt-1 text-sm font-medium text-foreground">{sponsor.name}</p>
      <p className="text-xs text-muted">{sponsor.message}</p>
    </a>
  );
}
