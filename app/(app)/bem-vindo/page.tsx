import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOnboarding } from "@/lib/onboarding/queries";
import { redeemReferralOnSignup } from "@/lib/referral/apply";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = { title: "Bem-vindo", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const user = await requireUser();
  await redeemReferralOnSignup(); // vincula a indicação (se houver cookie)
  const state = await getOnboarding(user.id);
  if (state.completed) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-lg py-6">
      <OnboardingWizard
        initial={{
          goal: state.goal,
          examDate: state.examDate,
          targetCourse: state.targetCourse,
          focusAreas: state.focusAreas,
          level: state.level,
        }}
      />
    </div>
  );
}
