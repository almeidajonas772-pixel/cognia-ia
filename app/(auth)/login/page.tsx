import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthSkeleton } from "@/components/auth/AuthSkeleton";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
