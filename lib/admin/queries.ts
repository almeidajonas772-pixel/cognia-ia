import { createClient } from "@/lib/supabase/server";

export type AdminSubject = {
  id: string;
  slug: string;
  name: string;
  area: string;
};
export type AdminTopic = { id: string; subject_id: string; name: string };
export type AdminContent = {
  id: string;
  subject_id: string;
  topic_id: string;
  slug: string;
  title: string;
  recurrence: string;
  is_published: boolean;
};

export async function listAdminLibrary(): Promise<{
  subjects: AdminSubject[];
  topics: AdminTopic[];
  contents: AdminContent[];
}> {
  const supabase = createClient();
  const [{ data: subjects }, { data: topics }, { data: contents }] =
    await Promise.all([
      supabase
        .from("library_subjects")
        .select("id, slug, name, area")
        .order("position"),
      supabase
        .from("library_topics")
        .select("id, subject_id, name")
        .order("position"),
      supabase
        .from("library_contents")
        .select("id, subject_id, topic_id, slug, title, recurrence, is_published")
        .order("position"),
    ]);
  return {
    subjects: (subjects ?? []) as AdminSubject[],
    topics: (topics ?? []) as AdminTopic[],
    contents: (contents ?? []) as AdminContent[],
  };
}

export async function getAdminContent(id: string) {
  const supabase = createClient();
  const { data: content } = await supabase
    .from("library_contents")
    .select(
      "id, subject_id, topic_id, slug, title, summary_short, recurrence, reading_minutes, is_published"
    )
    .eq("id", id)
    .maybeSingle();
  if (!content) return null;
  const { data: premium } = await supabase
    .from("library_content_premium")
    .select("body")
    .eq("content_id", id)
    .maybeSingle();
  return { ...content, body: premium?.body ?? "" };
}

export type AdminSubmission = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  suggested_subject: string | null;
  suggested_topic: string | null;
  status: string;
  created_at: string;
};

export async function listSubmissions(
  status = "pendente"
): Promise<AdminSubmission[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_library_submissions")
    .select(
      "id, user_id, title, content, suggested_subject, suggested_topic, status, created_at"
    )
    .eq("status", status)
    .order("created_at", { ascending: true });
  return (data ?? []) as AdminSubmission[];
}

export async function getAdminNotifications() {
  const supabase = createClient();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const HEAD = { count: "exact" as const, head: true as const };
  const [reports, submissions, rejected, newPremium] = await Promise.all([
    supabase.from("community_reports").select("id", HEAD).eq("resolved", false),
    supabase
      .from("community_library_submissions")
      .select("id", HEAD)
      .eq("status", "pendente"),
    supabase.from("payments").select("id", HEAD).eq("status", "rejected"),
    supabase
      .from("billing_events")
      .select("id", HEAD)
      .eq("type", "subscription_activated")
      .gte("created_at", since),
  ]);
  return {
    openReports: reports.count ?? 0,
    pendingSubmissions: submissions.count ?? 0,
    rejectedPayments: rejected.count ?? 0,
    newPremium24h: newPremium.count ?? 0,
  };
}
