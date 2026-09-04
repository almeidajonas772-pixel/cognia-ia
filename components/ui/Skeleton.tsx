import { cn } from "@/lib/utils";

/** Bloco de carregamento animado. Base para os `loading.tsx` (Fase 10). */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-lg bg-white/5", className)} {...props} />;
}

/** Layout genérico de página em carregamento: título + linhas + cards. */
export function PageSkeleton({
  cards = 4,
  maxWidth = "max-w-4xl",
}: {
  cards?: number;
  maxWidth?: string;
}) {
  return (
    <div className={cn("mx-auto space-y-6", maxWidth)}>
      <Skeleton className="h-7 w-52" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}
