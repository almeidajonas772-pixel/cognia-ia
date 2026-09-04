import Link from "next/link";
import { decideAd } from "@/lib/ads/server";
import { NATIVE_ITEMS } from "@/lib/ads/config";

/**
 * Espaço de anúncio (spec §6, §7). Renderiza nada para Premium ou placements
 * proibidos. Para o plano gratuito, mostra um anúncio nativo ou um código
 * externo (AdSense / Ad Manager) configurado pelo admin.
 */
export async function AdSlot({
  placement,
  isPremium,
  seed = 0,
}: {
  placement: string;
  isPremium: boolean;
  seed?: number;
}) {
  const decision = await decideAd(placement, isPremium);
  if (!decision.show) return null;

  if (decision.mode === "code" && decision.code) {
    return (
      <div
        className="my-4 overflow-hidden rounded-xl border border-border"
        data-ad-placement={placement}
        // código de anúncio do admin (AdSense / Ad Manager)
        dangerouslySetInnerHTML={{ __html: decision.code }}
      />
    );
  }

  const item = NATIVE_ITEMS[seed % NATIVE_ITEMS.length];
  return (
    <Link
      href={item.affiliateUrl ?? item.href}
      target={item.affiliateUrl ? "_blank" : undefined}
      rel={item.affiliateUrl ? "sponsored noopener" : undefined}
      className="my-4 block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
      data-ad-placement={placement}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-secondary">{item.eyebrow}</span>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
          {item.sponsored ? "Patrocinado" : "Recomendado"}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{item.title}</p>
      <p className="mt-0.5 text-xs text-muted">{item.desc}</p>
      <span className="mt-2 inline-block text-xs font-medium text-secondary">
        {item.cta} →
      </span>
    </Link>
  );
}
