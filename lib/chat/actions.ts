"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ChatDepth, ChatMode } from "@/lib/chat/types";

export async function createConversation(input?: {
  mode?: ChatMode;
  depth?: ChatDepth;
  title?: string;
}) {
  const user = await requireUser();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_conversations")
    .insert({
      user_id: user.id,
      mode: input?.mode ?? "professor",
      depth: input?.depth ?? "intermediario",
      title: input?.title ?? "Nova conversa",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false as const, error: error?.message };
  revalidatePath("/chat");
  return { ok: true as const, id: data.id };
}

export async function renameConversation(id: string, title: string) {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("chat_conversations")
    .update({ title: title.slice(0, 120) })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/chat");
  revalidatePath(`/chat/${id}`);
}

export async function togglePinConversation(id: string, pinned: boolean) {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("chat_conversations")
    .update({ pinned })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/chat");
}

export async function updateConversationSettings(
  id: string,
  patch: { mode?: ChatMode; depth?: ChatDepth }
) {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("chat_conversations")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath(`/chat/${id}`);
}

export async function deleteConversation(id: string) {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("chat_conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/chat");
  return { ok: true as const };
}

export async function toggleFavoriteMessage(
  messageId: string,
  favorited: boolean
) {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("chat_messages")
    .update({ favorited })
    .eq("id", messageId)
    .eq("user_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function clearMemory() {
  const user = await requireUser();
  const supabase = createClient();
  await supabase.from("chat_user_memory").delete().eq("user_id", user.id);
  revalidatePath("/chat");
  return { ok: true as const };
}
