import { PRICES, type BillingCycle } from "@/lib/billing/config";

export function billingProvider(): "mercadopago" | "simulado" {
  return process.env.MERCADOPAGO_ACCESS_TOKEN ? "mercadopago" : "simulado";
}

const MP_BASE = "https://api.mercadopago.com";

export type CheckoutInput = {
  userId: string;
  email: string;
  cycle: BillingCycle;
  finalPrice: number;
  couponCode?: string;
};

/**
 * Cria o checkout. Sem token → fluxo simulado (confirmação interna).
 * Com token → cria uma preapproval (assinatura recorrente) no Mercado Pago.
 */
export async function createCheckout(
  input: CheckoutInput
): Promise<{ url: string; providerRef: string | null }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (billingProvider() === "simulado") {
    const q = new URLSearchParams({ cycle: input.cycle });
    if (input.couponCode) q.set("coupon", input.couponCode);
    return {
      url: `/perfil/assinatura/confirmar?${q.toString()}`,
      providerRef: null,
    };
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN!;
  const body = {
    reason: `COGNI IA Premium (${input.cycle})`,
    external_reference: `${input.userId}:${input.cycle}`,
    payer_email: input.email,
    back_url: `${appUrl}/perfil/assinatura`,
    auto_recurring: {
      frequency: input.cycle === "anual" ? 12 : 1,
      frequency_type: "months",
      transaction_amount: Number(input.finalPrice.toFixed(2)),
      currency_id: "BRL",
    },
  };

  const res = await fetch(`${MP_BASE}/preapproval`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`MercadoPago ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  return {
    url: json.init_point || json.sandbox_init_point,
    providerRef: json.id ?? null,
  };
}

/** Consulta uma preapproval (usado pelo webhook). */
export async function fetchPreapproval(id: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return null;
  const res = await fetch(`${MP_BASE}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{
    status: string;
    external_reference?: string;
    auto_recurring?: { transaction_amount?: number; frequency?: number };
  }>;
}

export { PRICES };
