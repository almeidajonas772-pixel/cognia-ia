import { createClient } from "@/lib/supabase/server";
import { PRICES, type BillingCycle } from "@/lib/billing/config";

export type CouponPreview = {
  valid: boolean;
  code?: string;
  description?: string | null;
  discountPct?: number;
  discountFixed?: number;
  basePrice: number;
  finalPrice: number;
  reason?: string;
};

/** Valida um cupom para um ciclo/usuário e devolve o preço final (spec §8.1). */
export async function previewCoupon(
  code: string,
  cycle: BillingCycle,
  userId: string
): Promise<CouponPreview> {
  const base = PRICES[cycle].price;
  const c = code.trim();
  if (!c) return { valid: false, basePrice: base, finalPrice: base };

  const supabase = createClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .ilike("code", c)
    .eq("active", true)
    .maybeSingle();

  if (!coupon)
    return {
      valid: false,
      basePrice: base,
      finalPrice: base,
      reason: "Cupom inválido.",
    };

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now)
    return { valid: false, basePrice: base, finalPrice: base, reason: "Cupom ainda não vigente." };
  if (coupon.valid_until && new Date(coupon.valid_until) < now)
    return { valid: false, basePrice: base, finalPrice: base, reason: "Cupom expirado." };
  if (coupon.max_redemptions != null && coupon.redemptions >= coupon.max_redemptions)
    return { valid: false, basePrice: base, finalPrice: base, reason: "Cupom esgotado." };
  if (coupon.applies_to !== "ambos" && coupon.applies_to !== cycle)
    return {
      valid: false,
      basePrice: base,
      finalPrice: base,
      reason: `Cupom válido só para o plano ${coupon.applies_to}.`,
    };

  const { count } = await supabase
    .from("coupon_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("coupon_id", coupon.id)
    .eq("user_id", userId);
  if ((count ?? 0) >= coupon.per_user_limit)
    return {
      valid: false,
      basePrice: base,
      finalPrice: base,
      reason: "Você já usou este cupom.",
    };

  let final = Math.max(0, base - Number(coupon.discount_fixed));
  final = Math.round(final * (1 - coupon.discount_pct / 100) * 100) / 100;

  return {
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discountPct: coupon.discount_pct,
    discountFixed: Number(coupon.discount_fixed),
    basePrice: base,
    finalPrice: final,
  };
}

export type AdminCoupon = {
  id: string;
  code: string;
  description: string | null;
  discount_pct: number;
  discount_fixed: number;
  applies_to: string;
  max_redemptions: number | null;
  per_user_limit: number;
  valid_until: string | null;
  active: boolean;
  redemptions: number;
};

export async function listCoupons(): Promise<AdminCoupon[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("coupons")
    .select(
      "id, code, description, discount_pct, discount_fixed, applies_to, max_redemptions, per_user_limit, valid_until, active, redemptions"
    )
    .order("created_at", { ascending: false });
  return (data ?? []) as AdminCoupon[];
}
