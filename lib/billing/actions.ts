"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isAppAdmin } from "@/lib/comunidade/access";
import { previewCoupon } from "@/lib/billing/coupons";
import { createCheckout } from "@/lib/billing/provider";
import type { BillingCycle } from "@/lib/billing/config";

const cycleOf = (v: unknown): BillingCycle => (v === "anual" ? "anual" : "mensal");

/** Inicia o checkout (spec §3, §12). */
export async function startCheckout(input: {
  cycle: string;
  coupon?: string;
}) {
  const user = await requireUser();
  const cycle = cycleOf(input.cycle);
  const preview = await previewCoupon(input.coupon ?? "", cycle, user.id);

  try {
    const { url } = await createCheckout({
      userId: user.id,
      email: user.email ?? "",
      cycle,
      finalPrice: preview.valid ? preview.finalPrice : preview.basePrice,
      couponCode: preview.valid ? preview.code : undefined,
    });
    return { ok: true as const, url };
  } catch (err) {
    console.error("startCheckout:", err);
    return { ok: false as const, error: "checkout_failed" };
  }
}

/** Confirma um pagamento simulado (sem Mercado Pago configurado). */
export async function confirmSimulatedPayment(input: {
  cycle: string;
  coupon?: string;
}) {
  const user = await requireUser();
  const cycle = cycleOf(input.cycle);
  const supabase = createClient();
  const { error } = await supabase.rpc("activate_subscription", {
    p_cycle: cycle,
    p_provider: "simulado",
    p_coupon: input.coupon?.trim() || null,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/perfil");
  revalidatePath("/perfil/assinatura");
  return { ok: true as const };
}

export async function changePlan(cycle: string) {
  return confirmSimulatedPayment({ cycle });
}

export async function cancelMySubscription() {
  const user = await requireUser();
  void user;
  const supabase = createClient();
  const { error } = await supabase.rpc("cancel_subscription", {});
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/perfil/assinatura");
  revalidatePath("/perfil");
  return { ok: true as const };
}

// ── Admin — cupons (spec §8.1) ────────────────────────────────────────────
async function adminOnly() {
  const user = await requireUser();
  return (await isAppAdmin(user.id)) ? user : null;
}

export async function upsertCoupon(input: {
  id?: string;
  code: string;
  description?: string;
  discountPct?: number;
  discountFixed?: number;
  appliesTo?: string;
  maxRedemptions?: number | null;
  perUserLimit?: number;
  validUntil?: string | null;
  active?: boolean;
}) {
  if (!(await adminOnly())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  const payload = {
    code: input.code.trim().toUpperCase(),
    description: input.description?.trim() ?? null,
    discount_pct: Math.max(0, Math.min(100, input.discountPct ?? 0)),
    discount_fixed: Math.max(0, input.discountFixed ?? 0),
    applies_to: ["mensal", "anual", "ambos"].includes(input.appliesTo ?? "")
      ? input.appliesTo!
      : "ambos",
    max_redemptions: input.maxRedemptions ?? null,
    per_user_limit: input.perUserLimit ?? 1,
    valid_until: input.validUntil ?? null,
    active: input.active ?? true,
  };
  let error: { message: string } | null;
  if (input.id) {
    // no update, o código não muda
    const { code: _omit, ...rest } = payload;
    void _omit;
    ({ error } = await supabase.from("coupons").update(rest).eq("id", input.id));
  } else {
    ({ error } = await supabase.from("coupons").insert(payload));
  }
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/monetizacao");
  return { ok: true as const };
}

export async function toggleCoupon(id: string, active: boolean) {
  if (!(await adminOnly())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  await supabase.from("coupons").update({ active }).eq("id", id);
  revalidatePath("/admin/monetizacao");
  return { ok: true as const };
}

// ── Admin — limites e anúncios (spec §5, §6, §11) ────────────────────────
export async function updateBillingConfig(key: string, value: unknown) {
  if (!(await adminOnly())) return { ok: false as const, error: "forbidden" };
  const supabase = createClient();
  const { error } = await supabase
    .from("billing_config")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin/monetizacao");
  return { ok: true as const };
}
