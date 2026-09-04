import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getReferralState } from "@/lib/referral/queries";
import { ReferralPanel } from "@/components/referral/ReferralPanel";

export const metadata: Metadata = {
  title: "Convidar amigos",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function ConvidarPage() {
  const user = await requireUser();
  const state = await getReferralState(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Convidar amigos</h1>
        <p className="mt-1 text-sm text-muted">
          Estudar acompanhado rende mais. Compartilhe seu link e cresçam juntos.
        </p>
      </div>
      <ReferralPanel state={state} />
    </div>
  );
}
