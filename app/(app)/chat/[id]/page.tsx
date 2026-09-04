import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getConversation } from "@/lib/chat/queries";
import { ChatThread } from "@/components/chat/ChatThread";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await requireUser();
  const data = await getConversation(user.id, params.id);
  return { title: data ? data.conversation.title : "Conversa" };
}

export default async function ConversationPage({ params }: Props) {
  const user = await requireUser();
  const data = await getConversation(user.id, params.id);
  if (!data) notFound();

  return (
    <ChatThread
      conversation={data.conversation}
      initialMessages={data.messages}
    />
  );
}
