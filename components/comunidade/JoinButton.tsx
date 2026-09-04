"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, LogOut } from "lucide-react";
import { joinGroup, leaveGroup } from "@/lib/comunidade/actions";
import { cn } from "@/lib/utils";

export function JoinButton({
  groupId,
  initialMember,
  size = "md",
}: {
  groupId: string;
  initialMember: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [member, setMember] = useState(initialMember);
  const [hover, setHover] = useState(false);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !member;
    setMember(next);
    start(async () => {
      const res = next
        ? await joinGroup(groupId)
        : await leaveGroup(groupId);
      if (!res?.ok) setMember(!next);
      else router.refresh();
    });
  }

  const h = size === "sm" ? "h-7 px-2 text-xs" : "h-9 px-3 text-sm";

  return (
    <button
      type="button"
      onClick={toggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-60",
        h,
        member
          ? "border border-border text-muted hover:border-rose-500/40 hover:text-rose-400"
          : "bg-primary text-white hover:bg-primary-hover"
      )}
    >
      {member ? (
        hover ? (
          <>
            <LogOut className="h-3.5 w-3.5" /> Sair
          </>
        ) : (
          <>
            <Check className="h-3.5 w-3.5" /> Membro
          </>
        )
      ) : (
        <>
          <Plus className="h-3.5 w-3.5" /> Entrar
        </>
      )}
    </button>
  );
}
