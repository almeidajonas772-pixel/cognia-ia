import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchPreapproval } from "@/lib/billing/provider";

export const dynamic = "force-dynamic";

/**
 * Webhook do Mercado Pago (spec §3, §13). Eventos:
 *  - preapproval (assinatura autorizada/pausada/cancelada)
 *  - payment (cobrança aprovada/recusada/estornada)
 *
 * Validação: exige o segredo em `MERCADOPAGO_WEBHOOK_SECRET` (query `?secret=`
 * ou header `x-webhook-secret`). A verificação HMAC completa de `x-signature`
 * pode ser adicionada quando as credenciais reais estiverem em uso.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      url.searchParams.get("secret") || req.headers.get("x-webhook-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let event: { type?: string; action?: string; data?: { id?: string } };
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const type = event.type ?? event.action?.split(".")[0] ?? "";
  const id = event.data?.id;
  if (!id) return NextResponse.json({ ok: true });

  const db = createServiceClient();

  try {
    if (type.includes("preapproval")) {
      const pa = await fetchPreapproval(String(id));
      if (!pa?.external_reference) return NextResponse.json({ ok: true });
      const [userId, cycleRaw] = pa.external_reference.split(":");
      const cycle = cycleRaw === "anual" ? "anual" : "mensal";
      const amount = pa.auto_recurring?.transaction_amount ?? 0;

      if (pa.status === "authorized") {
        const periodEnd = new Date(
          Date.now() + (cycle === "anual" ? 365 : 30) * 86_400_000
        ).toISOString();
        await db.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: "premium",
            status: "active",
            provider: "mercadopago",
            provider_ref: String(id),
            cycle,
            price: amount,
            current_period_end: periodEnd,
            cancel_at_period_end: false,
          },
          { onConflict: "user_id" }
        );
        await db.from("payments").insert({
          user_id: userId,
          amount,
          status: "approved",
          provider: "mercadopago",
          provider_ref: String(id),
          method: "mercadopago",
        });
        await db.rpc("sync_user_plan", { p_user: userId });
        await db.from("billing_events").insert({
          user_id: userId,
          type: "subscription_activated",
          detail: { provider: "mercadopago", cycle, amount },
        });
      } else if (pa.status === "cancelled" || pa.status === "paused") {
        await db
          .from("subscriptions")
          .update({ status: pa.status === "paused" ? "paused" : "cancelled" })
          .eq("user_id", userId);
        await db.rpc("sync_user_plan", { p_user: userId });
      }
    } else if (type.includes("payment")) {
      // registro simples do pagamento (renovações recorrentes)
      await db.from("billing_events").insert({
        type: "payment_event",
        detail: { id: String(id) },
      });
    }
  } catch (err) {
    console.error("mp webhook:", err);
  }

  return NextResponse.json({ ok: true });
}
