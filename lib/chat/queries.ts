import { createClient } from "@/lib/supabase/server";
import type {
  Attachment,
  Conversation,
  Message,
  UsageToday,
} from "@/lib/chat/types";

const CONV_COLS = "id, title, mode, depth, pinned, last_message_at";
const MSG_COLS =
  "id, conversation_id, role, content, attachments, model, favorited, created_at";

type Raw = Record<string, unknown>;

function asMessage(row: Raw): Message {
  return {
    id: String(row.id),
    conversation_id: String(row.conversation_id),
    role: row.role as Message["role"],
    content: String(row.content ?? ""),
    attachments: (row.attachments as Attachment[]) ?? [],
    model: (row.model as string | null) ?? null,
    favorited: Boolean(row.favorited),
    created_at: String(row.created_at),
  };
}

function rows(data: unknown): Raw[] {
  return (data ?? []) as unknown as Raw[];
}

export async function listConversations(
  userId: string
): Promise<Conversation[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("chat_conversations")
    .select(CONV_COLS)
    .eq("user_id", userId)
    .order("pinned", { ascending: false })
    .order("last_message_at", { ascending: false });
  return (data ?? []) as Conversation[];
}

export async function getConversation(
  userId: string,
  id: string
): Promise<{ conversation: Conversation; messages: Message[] } | null> {
  const supabase = createClient();
  const { data: conversation } = await supabase
    .from("chat_conversations")
    .select(CONV_COLS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (!conversation) return null;

  const { data: messages } = await supabase
    .from("chat_messages")
    .select(MSG_COLS)
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return {
    conversation: conversation as Conversation,
    messages: rows(messages).map(asMessage),
  };
}

export type MessageHit = Message & { conversation_title: string };

async function withTitles(
  userId: string,
  messageRows: Raw[]
): Promise<MessageHit[]> {
  const supabase = createClient();
  const { data: convs } = await supabase
    .from("chat_conversations")
    .select("id, title")
    .eq("user_id", userId);
  const titles = new Map((convs ?? []).map((c) => [c.id, c.title]));
  return messageRows.map((row) => ({
    ...asMessage(row),
    conversation_title:
      titles.get(String(row.conversation_id)) ?? "Conversa",
  }));
}

export async function searchMessages(
  userId: string,
  query: string
): Promise<MessageHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("chat_messages")
    .select(MSG_COLS)
    .eq("user_id", userId)
    .ilike("content", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(40);
  return withTitles(userId, rows(data));
}

export async function listFavoriteMessages(
  userId: string
): Promise<MessageHit[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("chat_messages")
    .select(MSG_COLS)
    .eq("user_id", userId)
    .eq("favorited", true)
    .order("created_at", { ascending: false });
  return withTitles(userId, rows(data));
}

export async function getUsageToday(userId: string): Promise<UsageToday> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("chat_usage")
    .select("messages, images, summaries, questions")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();
  return {
    messages: data?.messages ?? 0,
    images: data?.images ?? 0,
    summaries: data?.summaries ?? 0,
    questions: data?.questions ?? 0,
  };
}
