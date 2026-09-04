import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthSkeleton } from "@/components/auth/AuthSkeleton";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function EsqueciSenhaPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthForm mode="recuperar" />
    </Suspense>
  );
}
