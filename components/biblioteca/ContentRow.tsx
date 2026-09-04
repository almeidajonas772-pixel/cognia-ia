import Link from "next/link";
import { Check, Star, Clock } from "lucide-react";
import { RecurrenceBadge } from "@/components/biblioteca/RecurrenceBadge";
import type { Content } from "@/lib/biblioteca/types";
import { cn } from "@/lib/utils";

export function ContentRow({
  content,
  subjectSlug,
  completed,
  favorite,
}: {
  content: Content;
  subjectSlug: string;
  completed: boolean;
  favorite: boolean;
}) {
  return (
    <Link
      href={`/biblioteca/${subjectSlug}/${content.slug}`}
      className={cn(
        "flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-white/[0.03]",
        completed && "opacity-70"
      )}
    >
      <span
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
          completed
            ? "border-primary bg-primary text-white"
            : "border-border text-transparent"
        )}
      >
        <Check className="h-3 w-3" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {content.title}
          </span>
          {favorite && (
            <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
          )}
        </span>
        <span className="mt-0.5 flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {content.reading_minutes} min
          </span>
        </span>
      </span>

      <RecurrenceBadge recurrence={content.recurrence} variant="compact" />
    </Link>
  );
}
