import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthSkeleton } from "@/components/auth/AuthSkeleton";
import { WaitlistForm } from "@/components/launch/WaitlistForm";
import { getLaunchState } from "@/lib/launch";

export const metadata: Metadata = { title: "Criar conta" };
export const dynamic = "force-dynamic";

export default async function CadastroPage() {
  const { mode, signupOpen } = await getLaunchState();

  if (mode === "waitlist" || !signupOpen) {
    return <WaitlistForm source="cadastro" />;
  }

  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthForm mode="cadastro" />
    </Suspense>
  );
}
