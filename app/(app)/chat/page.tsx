import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadMemoryContext } from "@/lib/chat/memory";
import { NewChat } from "@/components/chat/NewChat";
import { MemoryCard } from "@/components/chat/MemoryCard";
import { aiStatus } from "@/lib/ai";

export const metadata: Metadata = { title: "Chat IA" };

export default async function ChatPage() {
  const user = await requireUser();
  const memory = await loadMemoryContext(user.id);
  const status = aiStatus();

  return (
    <div className="h-full overflow-y-auto">
      <NewChat />
      <div className="mx-auto max-w-2xl px-4 pb-12">
        <MemoryCard memory={memory} />
        {(status.chat === "mock" || status.vision === "mock") && (
          <p className="mt-3 text-center text-[11px] text-muted">
            Modo demonstração: chat={status.chat}, imagens={status.vision}.
            Configure as chaves em <code>.env.local</code> para respostas reais.
          </p>
        )}
      </div>
    </div>
  );
}
