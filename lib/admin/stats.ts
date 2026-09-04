import { createClient } from "@/lib/supabase/server";

export type AdminStats = {
  users: number;
  premium: number;
  free: number;
  newUsers7d: number;
  activeUsers7d: number;
  contents: number;
  essaysCorrected: number;
  chatMessages: number;
  questionsGenerated: number;
  communityPosts: number;
  dailyUse: { day: string; count: number }[];
  openReports: number;
  pendingSubmissions: number;
};

const DAY = 86_400_000;
const HEAD = { count: "exact" as const, head: true as const };

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createClient();
  const since7 = new Date(Date.now() - 7 * DAY).toISOString();
  const since30day = new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10);

  const [
    usersRes,
    premiumRes,
    newUsersRes,
    contentsRes,
    essaysRes,
    postsRes,
    reportsRes,
    subsRes,
    { data: usage },
    { data: activeRows },
  ] = await Promise.all([
    supabase.from("users").select("id", HEAD),
    supabase.from("users").select("id", HEAD).eq("plan", "premium"),
    supabase.from("users").select("id", HEAD).gte("created_at", since7),
    supabase.from("library_contents").select("id", HEAD),
    supabase
      .from("essay_submissions")
      .select("id", HEAD)
      .eq("status", "corrigida"),
    supabase.from("community_group_posts").select("id", HEAD),
    supabase
      .from("community_reports")
      .select("id", HEAD)
      .eq("resolved", false),
    supabase
      .from("community_library_submissions")
      .select("id", HEAD)
      .eq("status", "pendente"),
    supabase
      .from("chat_usage")
      .select("messages, questions")
      .gte("day", since30day),
    supabase
      .from("activity_log")
      .select("user_id, created_at")
      .gte("created_at", since7),
  ]);

  const users = usersRes.count ?? 0;
  const premium = premiumRes.count ?? 0;
  const chatMessages = (usage ?? []).reduce((a, u) => a + (u.messages ?? 0), 0);
  const questionsGenerated = (usage ?? []).reduce(
    (a, u) => a + (u.questions ?? 0),
    0
  );
  const activeUsers7d = new Set((activeRows ?? []).map((r) => r.user_id)).size;

  const byDay = new Map<string, number>();
  for (const r of activeRows ?? []) {
    const d = String(r.created_at).slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const dailyUse: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    dailyUse.push({
      day: new Date(d).toLocaleDateString("pt-BR", { weekday: "short" }),
      count: byDay.get(d) ?? 0,
    });
  }

  return {
    users,
    premium,
    free: users - premium,
    newUsers7d: newUsersRes.count ?? 0,
    activeUsers7d,
    contents: contentsRes.count ?? 0,
    essaysCorrected: essaysRes.count ?? 0,
    chatMessages,
    questionsGenerated,
    communityPosts: postsRes.count ?? 0,
    dailyUse,
    openReports: reportsRes.count ?? 0,
    pendingSubmissions: subsRes.count ?? 0,
  };
}
