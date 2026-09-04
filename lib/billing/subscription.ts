import { createClient } from "@/lib/supabase/server";

export type MySubscription = {
  status: string;
  cycle: string;
  price: number;
  provider: string;
  coupon_code: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  started_at: string;
} | null;

export async function getMySubscription(
  userId: string
): Promise<MySubscription> {
  const supabase = createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select(
      "status, cycle, price, provider, coupon_code, current_period_end, cancel_at_period_end, started_at"
    )
    .eq("user_id", userId)
    .maybeSingle();
  return (data as MySubscription) ?? null;
}

export type MyPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  created_at: string;
};

export async function getMyPayments(userId: string): Promise<MyPayment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, amount, currency, status, method, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(24);
  return (data ?? []) as MyPayment[];
}
