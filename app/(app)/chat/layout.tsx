import { requireUser } from "@/lib/auth";
import { listConversations } from "@/lib/chat/queries";
import { ChatSidebar } from "@/components/chat/ChatSidebar";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const conversations = await listConversations(user.id);

  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] overflow-hidden lg:-m-8">
      <ChatSidebar conversations={conversations} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
