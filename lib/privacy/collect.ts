import type { createServiceClient } from "@/lib/supabase/service";

/**
 * Fase 11 — Coleta de todos os dados pessoais de um usuário (LGPD art. 18).
 *
 * Mapa declarativo tabela → coluna dona. Percorre tudo com o service client e
 * devolve um objeto serializável. Novas tabelas com dados do usuário devem ser
 * adicionadas aqui.
 */

type Db = ReturnType<typeof createServiceClient>;

const OWNED: { table: string; column: string }[] = [
  // Fase 2 (legado + base)
  { table: "progress", column: "user_id" },
  { table: "favorites", column: "user_id" },
  { table: "chat_history", column: "user_id" },
  { table: "essays", column: "user_id" },
  { table: "community_posts", column: "user_id" },
  // Fase 3
  { table: "library_reading_history", column: "user_id" },
  // Fase 4
  { table: "chat_conversations", column: "user_id" },
  { table: "chat_messages", column: "user_id" },
  { table: "chat_user_memory", column: "user_id" },
  { table: "chat_usage", column: "user_id" },
  // Fase 5
  { table: "activity_log", column: "user_id" },
  { table: "study_sessions", column: "user_id" },
  { table: "study_daily", column: "user_id" },
  { table: "content_difficulty", column: "user_id" },
  // Fase 6
  { table: "essay_rubrics", column: "user_id" },
  { table: "essay_submissions", column: "user_id" },
  { table: "essay_error_bank", column: "user_id" },
  // Fase 7
  { table: "community_group_members", column: "user_id" },
  { table: "community_group_posts", column: "user_id" },
  { table: "community_post_likes", column: "user_id" },
  { table: "community_comments", column: "user_id" },
  { table: "community_reports", column: "reporter_id" },
  { table: "community_library_submissions", column: "user_id" },
  { table: "community_notifications", column: "user_id" },
  // Fase 8
  { table: "subscriptions", column: "user_id" },
  { table: "payments", column: "user_id" },
  { table: "coupon_redemptions", column: "user_id" },
  { table: "billing_events", column: "user_id" },
  { table: "feature_usage", column: "user_id" },
  // Fase 9
  { table: "user_moderation", column: "user_id" },
  { table: "page_views", column: "user_id" },
  // Fase 10
  { table: "jobs", column: "user_id" },
  { table: "storage_objects", column: "owner_id" },
  { table: "ai_calls", column: "user_id" },
  // Fase 11
  { table: "user_security", column: "user_id" },
  { table: "user_sessions", column: "user_id" },
  { table: "user_consent", column: "user_id" },
  { table: "security_events", column: "user_id" },
  { table: "data_exports", column: "user_id" },
  // Fase 13
  { table: "user_onboarding", column: "user_id" },
  // Fase 14
  { table: "user_gamification", column: "user_id" },
  { table: "xp_events", column: "user_id" },
  { table: "user_achievements", column: "user_id" },
  { table: "referral_codes", column: "user_id" },
  { table: "referrals", column: "referrer_id" },
  // Fase 15
  { table: "memory_snapshots", column: "user_id" },
];

export type UserDataBundle = {
  generatedAt: string;
  userId: string;
  profile: Record<string, unknown> | null;
  auth: { email: string | null; createdAt: string | null };
  data: Record<string, unknown[]>;
  notes: string[];
};

export async function collectUserData(db: Db, userId: string): Promise<UserDataBundle> {
  const notes: string[] = [];

  const { data: profileRow } = await db
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  const profile = (profileRow ?? null) as unknown as Record<string, unknown> | null;

  const data: Record<string, unknown[]> = {};
  for (const { table, column } of OWNED) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows, error } = await (db.from(table as any) as any)
        .select("*")
        .eq(column, userId)
        .limit(5000);
      if (error) {
        notes.push(`${table}: ${error.message}`);
        continue;
      }
      if (rows?.length) data[table] = rows as unknown[];
    } catch (e) {
      notes.push(`${table}: ${e instanceof Error ? e.message : "falhou"}`);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    userId,
    profile,
    auth: {
      email: (profile?.email as string | undefined) ?? null,
      createdAt: (profile?.created_at as string | undefined) ?? null,
    },
    data,
    notes,
  };
}
