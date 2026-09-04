import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { previewCoupon } from "@/lib/billing/coupons";
import { createCheckout } from "@/lib/billing/provider";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { cycle?: string; coupon?: string };
  try {
    body = (await req.json()) as { cycle?: string; coupon?: string };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const cycle = body.cycle === "anual" ? "anual" : "mensal";
  const preview = await previewCoupon(body.coupon ?? "", cycle, user.id);

  try {
    const { url } = await createCheckout({
      userId: user.id,
      email: user.email ?? "",
      cycle,
      finalPrice: preview.valid ? preview.finalPrice : preview.basePrice,
      couponCode: preview.valid ? preview.code : undefined,
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("checkout:", err);
    return NextResponse.json({ error: "checkout_failed" }, { status: 502 });
  }
}
