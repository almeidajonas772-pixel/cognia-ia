import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthSkeleton } from "@/components/auth/AuthSkeleton";

export const metadata: Metadata = { title: "Nova senha" };

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthForm mode="redefinir" />
    </Suspense>
  );
}
