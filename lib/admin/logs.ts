import { createClient } from "@/lib/supabase/server";

/** Registra uma ação administrativa (spec §14). Silencioso. */
export async function logAdmin(
  action: string,
  target?: { type?: string; id?: string; detail?: Record<string, unknown> }
) {
  try {
    const supabase = createClient();
    await supabase.rpc("log_admin_action", {
      p_action: action,
      p_target_type: target?.type ?? null,
      p_target_id: target?.id ?? null,
      p_detail: target?.detail ?? {},
    });
  } catch (err) {
    console.error("logAdmin:", err);
  }
}

export type AdminLog = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
};

export async function listAdminLogs(limit = 100): Promise<AdminLog[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("admin_logs")
    .select("id, admin_id, action, target_type, target_id, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AdminLog[];
}
