import { NextResponse } from "next/server";
import { getUser, getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { enforceRate, RATE_RULES } from "@/lib/security/rate-limit";
import { getRoutedChatProvider, getVisionProvider } from "@/lib/ai";
import { buildChatSystem, buildVisionPrompt } from "@/lib/ai/prompts";
import { listContentsBrief } from "@/lib/biblioteca/queries";
import { loadMemoryContext, updateMemoryHeuristic } from "@/lib/chat/memory";
import { checkChatLimit } from "@/lib/chat/limits";
import { logActivity } from "@/lib/progresso/activity";
import { enqueue } from "@/lib/queue";
import type { AiMessage, ChatMode, Depth, ImageAttachment } from "@/lib/ai/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HISTORY_LIMIT = 12;

type Body = {
  conversationId: string;
  message: string;
  mode?: ChatMode;
  depth?: Depth;
  images?: ImageAttachment[];
};

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limited = await enforceRate(req, "chat", RATE_RULES.ai, user.id);
  if (limited) return limited;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  const images = (body.images ?? []).slice(0, 4);
  if (!message && images.length === 0) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: conversation } = await supabase
    .from("chat_conversations")
    .select("id, mode, depth")
    .eq("id", body.conversationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!conversation) {
    return NextResponse.json({ error: "conversation_not_found" }, { status: 404 });
  }

  const mode = (body.mode ?? conversation.mode) as ChatMode;
  const depth = (body.depth ?? conversation.depth) as Depth;
  const profile = await getProfile();

  // Limites do plano (spec §10)
  const gate = await checkChatLimit(user.id, profile, "message", { depth });
  if (!gate.allowed) {
    return NextResponse.json(
      { error: "limit", title: gate.title, body: gate.body },
      { status: 402 }
    );
  }
  if (images.length > 0) {
    const imgGate = await checkChatLimit(user.id, profile, "image");
    if (!imgGate.allowed) {
      return NextResponse.json(
        { error: "limit", title: imgGate.title, body: imgGate.body },
        { status: 402 }
      );
    }
  }

  // Histórico + integração com a biblioteca + memória
  const [{ data: history }, { count: priorCount }, library, memory] =
    await Promise.all([
      supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT),
      supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversation.id),
      listContentsBrief(),
      loadMemoryContext(user.id),
    ]);

  // Persiste a mensagem do usuário
  await supabase.from("chat_messages").insert({
    conversation_id: conversation.id,
    user_id: user.id,
    role: "user",
    content: message,
    attachments: images.map((i) => ({ type: "image", name: i.name ?? "imagem" })),
  });

  // Título automático na primeira mensagem
  if ((priorCount ?? 0) === 0) {
    const title = message.replace(/\s+/g, " ").slice(0, 60) || "Nova conversa";
    await supabase
      .from("chat_conversations")
      .update({ title, mode, depth })
      .eq("id", conversation.id);
  }

  const priorMessages: AiMessage[] = ((history ?? []) as AiMessage[])
    .slice()
    .reverse();

  const usingVision = images.length > 0;
  const vision = getVisionProvider();

  // Fase 15 — roteamento de modelo por complexidade estimada.
  const { provider } = await getRoutedChatProvider({
    task: "chat",
    tier: profile?.plan === "premium" ? "premium" : "free",
    userId: user.id,
    complexityInput: {
      text: message,
      depth,
      mode,
      hasImages: usingVision,
      historyLen: priorMessages.length,
    },
  });

  const system = buildChatSystem({ mode, depth, memory, library });

  const encoder = new TextEncoder();
  let full = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (usingVision) {
          const text = await vision.analyzeImage({
            prompt: buildVisionPrompt(message),
            images,
          });
          full = text;
          controller.enqueue(encoder.encode(text));
        } else {
          for await (const chunk of provider.streamChat({
            system,
            messages: [...priorMessages, { role: "user", content: message }],
            images,
          })) {
            full += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
        }
      } catch (err) {
        const msg =
          "\n\n_Não consegui gerar a resposta agora. Tente novamente em instantes._";
        full += msg;
        controller.enqueue(encoder.encode(msg));
        console.error("chat stream error:", err);
      }

      try {
        await supabase.from("chat_messages").insert({
          conversation_id: conversation.id,
          user_id: user.id,
          role: "assistant",
          content: full,
          model: usingVision ? vision.id : provider.id,
        });
        await supabase.rpc("bump_chat_usage", {
          p_user: user.id,
          p_messages: 1,
          p_images: images.length,
        });
        await logActivity({
          userId: user.id,
          kind: "chat",
          refId: conversation.id,
          refLabel: message.replace(/\s+/g, " ").slice(0, 60) || "conversa",
        });
        await updateMemoryHeuristic(user.id, { userText: message, library });

        // Fase 15 — memória evolutiva: a cada ~15 interações, agenda a evolução.
        const { data: since } = await supabase.rpc("bump_memory_interactions", {
          p_user: user.id,
        });
        if ((since ?? 0) >= 15) {
          await enqueue(
            "memory_evolution",
            { userId: user.id },
            { userId: user.id, dedupeKey: `mem:${user.id}` }
          );
        }
      } catch (err) {
        console.error("chat persist error:", err);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "x-provider": usingVision ? vision.id : provider.id,
    },
  });
}
