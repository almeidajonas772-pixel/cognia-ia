import { cache } from "react";
import { createAnonClient } from "@/lib/supabase/service";

export type SiteConfig = {
  name: string;
  description: string;
  contact_email: string;
  social: { instagram?: string; youtube?: string; tiktok?: string };
  terms_url: string;
  privacy_url: string;
  ga_id: string;
};

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  name: "COGNI IA",
  description: "Plataforma de estudos com IA para ENEM e vestibulares.",
  contact_email: "contato@cogniai.com.br",
  social: {},
  terms_url: "/termos",
  privacy_url: "/privacidade",
  ga_id: "",
};

/** Configurações gerais da plataforma (spec §15). Deduplicado por request. */
export const getSiteConfig = cache(async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const supabase = createAnonClient();
    const { data } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", "general")
      .maybeSingle();
    const v = (data?.value as Partial<SiteConfig> | null) ?? {};
    return { ...DEFAULT_SITE_CONFIG, ...v, social: { ...(v.social ?? {}) } };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
});
