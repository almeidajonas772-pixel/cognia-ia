import type { AiProvider, VisionProvider, ChatStreamInput } from "@/lib/ai/types";
import { mockProvider, mockVision } from "@/lib/ai/providers/mock";
import { logError, logEvent } from "@/lib/observability/log";
import { recordAiCall, approxTokens } from "@/lib/observability/ai-usage";

/**
 * Fase 10 — Wrapper resiliente para provedores de IA (spec §5, §6, §16).
 *
 * • Retenta chamadas não-stream com backoff exponencial + jitter.
 * • Se todas falharem, cai para o mock com um aviso ("serviço temporariamente
 *   indisponível") em vez de estourar erro para o usuário.
 * • Toda chamada (sucesso, retry ou fallback) é registrada em `ai_calls`.
 *
 * O streaming não é retentado (a resposta já começou a sair); em falha antes do
 * primeiro token, também cai para o mock.
 */

const MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const backoff = (attempt: number) => Math.min(8000, 2 ** attempt * 500) + Math.random() * 250;

const UNAVAILABLE_NOTE =
  "\n\n> ⚠️ O serviço de IA está temporariamente indisponível. Este é um resultado reduzido — tente novamente em alguns minutos.";

type WrapOpts = { kind: string; userId?: string | null };

export function resilientChat(base: AiProvider, opts: WrapOpts): AiProvider {
  return {
    id: base.id,
    live: base.live,

    async generateText(input: ChatStreamInput): Promise<string> {
      const t0 = Date.now();
      let lastErr: unknown;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const out = await base.generateText(input);
          await recordAiCall({
            provider: base.id,
            model: base.id,
            kind: opts.kind,
            userId: opts.userId ?? null,
            tokensIn: approxTokens(input.system + input.messages.map((m) => m.content).join(" ")),
            tokensOut: approxTokens(out),
            durationMs: Date.now() - t0,
            ok: true,
          });
          return out;
        } catch (err) {
          lastErr = err;
          if (attempt < MAX_RETRIES) {
            await logEvent({
              level: "warn",
              source: "ai.resilient",
              message: `retry ${attempt + 1}/${MAX_RETRIES} (${opts.kind})`,
            });
            await sleep(backoff(attempt));
          }
        }
      }
      await logError("ai.resilient", lastErr, { kind: opts.kind, fellBackToMock: true }, opts.userId ?? null);
      await recordAiCall({
        provider: base.id,
        model: base.id,
        kind: opts.kind,
        userId: opts.userId ?? null,
        durationMs: Date.now() - t0,
        ok: false,
      });
      const fallback = await mockProvider.generateText(input);
      return fallback + UNAVAILABLE_NOTE;
    },

    async *streamChat(input: ChatStreamInput): AsyncGenerator<string> {
      try {
        const gen = base.streamChat(input);
        const first = await gen.next();
        if (!first.done) yield first.value as string;
        for await (const chunk of gen) yield chunk;
        await recordAiCall({
          provider: base.id,
          model: base.id,
          kind: opts.kind,
          userId: opts.userId ?? null,
          tokensIn: approxTokens(input.system + input.messages.map((m) => m.content).join(" ")),
          ok: true,
        });
      } catch (err) {
        await logError("ai.resilient", err, { kind: opts.kind, stream: true }, opts.userId ?? null);
        await recordAiCall({
          provider: base.id,
          model: base.id,
          kind: opts.kind,
          userId: opts.userId ?? null,
          ok: false,
        });
        yield* mockProvider.streamChat(input);
        yield UNAVAILABLE_NOTE;
      }
    },
  };
}

export function resilientVision(base: VisionProvider, opts: WrapOpts): VisionProvider {
  return {
    id: base.id,
    live: base.live,
    async analyzeImage(input) {
      const t0 = Date.now();
      let lastErr: unknown;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const out = await base.analyzeImage(input);
          await recordAiCall({
            provider: base.id,
            model: base.id,
            kind: opts.kind,
            userId: opts.userId ?? null,
            tokensOut: approxTokens(out),
            durationMs: Date.now() - t0,
            ok: true,
          });
          return out;
        } catch (err) {
          lastErr = err;
          if (attempt < MAX_RETRIES) await sleep(backoff(attempt));
        }
      }
      await logError("ai.resilient", lastErr, { kind: opts.kind, vision: true }, opts.userId ?? null);
      await recordAiCall({
        provider: base.id,
        model: base.id,
        kind: opts.kind,
        userId: opts.userId ?? null,
        durationMs: Date.now() - t0,
        ok: false,
      });
      const fallback = await mockVision.analyzeImage(input);
      return fallback + UNAVAILABLE_NOTE;
    },
  };
}
