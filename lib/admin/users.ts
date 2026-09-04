"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";
import { logAdmin } from "@/lib/admin/logs";

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  created_at: string;
  status: string;
};

async function guard() {
  const user = await requireUser();
  return (await isAppAdmin(user.id)) ? user : null;
}

export async function searchUsers(query: string): Promise<AdminUserRow[]> {
  const supabase = createClient();
  let q = supabase
    .from("users")
    .select("id, email, full_name, plan, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const term = query.trim();
  if (term.length >= 2) {
    q = q.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
  }
  const [{ data: users }, { data: mods }] = await Promise.all([
    q,
    supabase.from("user_moderation").select("user_id, status"),
  ]);
  const statusById = new Map((mods ?? []).map((m) => [m.user_id, m.status]));
  return ((users ?? []) as Omit<AdminUserRow, "status">[]).map((u) => ({
    ...u,
    status: statusById.get(u.id) ?? "ativo",
  }));
}

export async function setUserPlan(userId: string, plan: "free" | "premium") {
  if (!(await guard())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_set_plan", {
    p_user: userId,
    p_plan: plan,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}

export async function setUserStatus(
  userId: string,
  status: "ativo" | "suspenso" | "banido",
  reason?: string
) {
  if (!(await guard())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  const { error } = await supabase.from("user_moderation").upsert(
    { user_id: userId, status, reason: reason ?? null, until: null },
    { onConflict: "user_id" }
  );
  if (error) return { ok: false as const, error: error.message };
  await logAdmin("set_user_status", {
    type: "user",
    id: userId,
    detail: { status },
  });
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}

export async function deleteUser(userId: string) {
  if (!(await guard())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  // marca como banido (a exclusão física do auth.users exige service role /
  // painel Supabase; aqui removemos o acesso).
  await supabase
    .from("user_moderation")
    .upsert(
      { user_id: userId, status: "banido", reason: "Excluído pelo admin" },
      { onConflict: "user_id" }
    );
  await logAdmin("delete_user", { type: "user", id: userId });
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}
