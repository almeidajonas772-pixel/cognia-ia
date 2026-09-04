import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/supabase/types";

/** O usuário logado é administrador da plataforma? (spec §11) */
export async function isAppAdmin(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

/**
 * Limites da comunidade por plano (spec §19/§20).
 * Gratuito: participa de tudo, com limites anti-spam.
 * Premium: sem limites de frequência, grupos privados, uploads maiores.
 */
export const COMMUNITY_LIMITS_FREE = {
  postsPerDay: 8,
  commentsPerHour: 30,
  maxAttachmentMB: 8,
  canCreatePrivateGroup: false,
};
export const COMMUNITY_LIMITS_PREMIUM = {
  postsPerDay: 60,
  commentsPerHour: 200,
  maxAttachmentMB: 25,
  canCreatePrivateGroup: true,
};

export function communityLimits(profile: UserProfile | null) {
  return profile?.plan === "premium"
    ? COMMUNITY_LIMITS_PREMIUM
    : COMMUNITY_LIMITS_FREE;
}
