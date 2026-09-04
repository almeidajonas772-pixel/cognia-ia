"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";
import { logAdmin } from "@/lib/admin/logs";
import type { SiteConfig } from "@/lib/admin/config";

async function guard() {
  const user = await requireUser();
  return (await isAppAdmin(user.id)) ? user : null;
}

/** Salva as configurações gerais da plataforma (spec §15). */
export async function updateSiteConfig(config: SiteConfig) {
  if (!(await guard())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  const { error } = await supabase
    .from("site_config")
    .upsert({ key: "general", value: config }, { onConflict: "key" });
  if (error) return { ok: false as const, error: error.message };
  await logAdmin("update_site_config");
  revalidatePath("/", "layout");
  return { ok: true as const };
}
