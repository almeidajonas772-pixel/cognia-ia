import Link from "next/link";
import { POST_KIND_LABEL, type Author, type PostKind } from "@/lib/comunidade/types";
import { cn } from "@/lib/utils";

export function KindBadge({ kind }: { kind: PostKind }) {
  return (
    <span className="rounded-full border border-border bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
      {POST_KIND_LABEL[kind]}
    </span>
  );
}

export function OfficialBadge() {
  return (
    <span className="rounded-full border border-primary/40 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
      Oficial
    </span>
  );
}

export function AuthorLine({
  author,
  when,
  className,
}: {
  author: Author;
  when: string;
  className?: string;
}) {
  const initials = author.name.slice(0, 2).toUpperCase();
  return (
    <span className={cn("flex items-center gap-2 text-xs text-muted", className)}>
      <span className="grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-[9px] font-semibold text-secondary">
        {author.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={author.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </span>
      {author.name} ·{" "}
      {new Date(when).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })}
    </span>
  );
}

export function SourceRefChip({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs text-secondary hover:underline"
    >
      🔗 {label}
    </Link>
  );
}
