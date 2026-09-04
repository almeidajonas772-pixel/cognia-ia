import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

/** Fase 14 — estado do programa de indicação do usuário. */

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://cogniai.com.br";

type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];

export type ReferralState = {
  code: string | null;
  link: string | null;
  total: number;
  qualified: number;
  pending: number;
  earnedXp: number;
  list: {
    status: ReferralRow["status"];
    createdAt: string;
    rewardXp: number;
  }[];
};

const EMPTY: ReferralState = {
  code: null,
  link: null,
  total: 0,
  qualified: 0,
  pending: 0,
  earnedXp: 0,
  list: [],
};

export async function getReferralState(userId: string): Promise<ReferralState> {
  try {
    const db = createClient();

    const [{ data: code }, { data: rows }] = await Promise.all([
      db.rpc("get_or_create_referral_code", {}),
      db
        .from("referrals")
        .select("status, created_at, referrer_reward_xp")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const list = (rows ?? []).map((r) => ({
      status: r.status,
      createdAt: r.created_at,
      rewardXp: r.referrer_reward_xp,
    }));

    const qualified = list.filter(
      (r) => r.status === "qualified" || r.status === "rewarded"
    ).length;

    return {
      code: code ?? null,
      link: code ? `${BASE}/cadastro?ref=${code}` : null,
      total: list.length,
      qualified,
      pending: list.filter((r) => r.status === "pending").length,
      earnedXp: list.reduce((a, r) => a + (r.rewardXp ?? 0), 0),
      list,
    };
  } catch {
    return EMPTY;
  }
}
