import type { AiProvider, VisionProvider } from "@/lib/ai/types";
import { mockProvider, mockVision } from "@/lib/ai/providers/mock";
import { openaiProvider, makeOpenAiProvider } from "@/lib/ai/providers/openai";
import { geminiVision } from "@/lib/ai/providers/gemini";
import { resilientChat, resilientVision } from "@/lib/ai/resilient";
import {
  routeModel,
  estimateComplexity,
  type AiTask,
  type Tier,
  type ComplexityInput,
} from "@/lib/ai/routing";

/**
 * Chat / raciocínio / resumos / questões — OpenAI quando há chave, senão mock.
 * (O "long-form" da spec, atribuído à Manus IA, roda pelo mesmo provedor — ver
 * docs/fase-4-setup.md sobre por que não usamos a Manus como API de produção.)
 */
export function getChatProvider(): AiProvider {
  return process.env.OPENAI_API_KEY ? openaiProvider : mockProvider;
}

/** Análise multimodal de imagem — Gemini quando há chave, senão mock. */
export function getVisionProvider(): VisionProvider {
  return process.env.GEMINI_API_KEY ? geminiVision : mockVision;
}

export function aiStatus() {
  return {
    chat: process.env.OPENAI_API_KEY ? "openai" : "mock",
    vision: process.env.GEMINI_API_KEY ? "gemini" : "mock",
  };
}

/**
 * Fase 10 — variantes com retry + fallback + telemetria (`ai_calls`).
 * Prefira estas em rotas/jobs; `kind` classifica o consumo no painel de custo.
 */
export function getResilientChatProvider(
  kind: string,
  userId?: string | null
): AiProvider {
  return resilientChat(getChatProvider(), { kind, userId });
}

export function getResilientVisionProvider(
  kind: string,
  userId?: string | null
): VisionProvider {
  return resilientVision(getVisionProvider(), { kind, userId });
}

/**
 * Fase 15 — provedor de chat com **roteamento de modelo** + resiliência.
 * Estima a complexidade, escolhe o modelo (barato no comum, forte quando
 * precisa) e devolve o provedor pronto, já com retry/fallback/telemetria.
 */
export async function getRoutedChatProvider(opts: {
  task: AiTask;
  tier: Tier;
  userId?: string | null;
  complexity?: number;
  complexityInput?: ComplexityInput;
}): Promise<{ provider: AiProvider; model: string; complexity: number }> {
  const live = !!process.env.OPENAI_API_KEY;
  const complexity =
    opts.complexity ??
    (opts.complexityInput ? estimateComplexity(opts.complexityInput) : 40);

  const routed = await routeModel({
    task: opts.task,
    tier: opts.tier,
    complexity,
    live,
  });

  const base: AiProvider =
    routed.provider === "openai" ? makeOpenAiProvider(routed.model) : mockProvider;

  return {
    provider: resilientChat(base, { kind: opts.task, userId: opts.userId }),
    model: routed.model,
    complexity,
  };
}
