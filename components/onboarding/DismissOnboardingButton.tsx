"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { skipOnboarding } from "@/lib/onboarding/actions";

export function DismissOnboardingButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      aria-label="Dispensar"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await skipOnboarding();
          router.refresh();
        })
      }
      className="rounded-md p-1 text-muted hover:bg-white/5 hover:text-foreground disabled:opacity-50"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
