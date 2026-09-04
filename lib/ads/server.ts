import { createAnonClient } from "@/lib/supabase/service";
import {
  ALLOWED_PLACEMENTS,
  DEFAULT_ADS_CONFIG,
  type AdsConfig,
  type Placement,
} from "@/lib/ads/config";

export async function getAdsConfig(): Promise<AdsConfig> {
  try {
    const supabase = createAnonClient();
    const { data } = await supabase
      .from("billing_config")
      .select("value")
      .eq("key", "ads")
      .maybeSingle();
    const v = data?.value as AdsConfig | null;
    if (!v) return DEFAULT_ADS_CONFIG;
    return {
      enabled: v.enabled ?? true,
      placements: { ...DEFAULT_ADS_CONFIG.placements, ...(v.placements ?? {}) },
    };
  } catch {
    return DEFAULT_ADS_CONFIG;
  }
}

export type AdDecision =
  | { show: false }
  | { show: true; mode: "native" | "code"; code?: string };

/** Decide se um placement exibe anúncio (spec §6). */
export async function decideAd(
  placement: string,
  isPremium: boolean
): Promise<AdDecision> {
  if (isPremium) return { show: false }; // Premium nunca vê anúncio
  if (!ALLOWED_PLACEMENTS.includes(placement as Placement))
    return { show: false }; // local proibido

  const cfg = await getAdsConfig();
  if (!cfg.enabled) return { show: false };
  const p = cfg.placements[placement];
  if (!p || !p.enabled || p.mode === "off") return { show: false };
  if (p.mode === "code" && p.code) return { show: true, mode: "code", code: p.code };
  return { show: true, mode: "native" };
}
