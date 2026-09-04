import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * Marca da COGNI IA. `mark` = só o símbolo; `full` = símbolo + wordmark.
 * O símbolo é inline (herda as cores do tema via as classes) e cabe num
 * "tile" arredondado no mesmo padrão usado no app.
 */
export function Logo({
  variant = "full",
  className,
  tile = true,
}: {
  variant?: "mark" | "full";
  className?: string;
  tile?: boolean;
}) {
  const mark = (
    <span
      className={cn(
        "grid shrink-0 place-items-center",
        tile ? "h-8 w-8 rounded-lg bg-primary-soft" : "h-8 w-8"
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="h-[70%] w-[70%]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M25.4 19.42 A10 10 0 1 0 23.07 8.93"
          stroke="currentColor"
          strokeWidth="4.4"
          strokeLinecap="round"
          className="text-primary"
        />
        <circle cx="16" cy="16" r="2.5" fill="currentColor" className="text-primary" />
        <circle
          cx="23.07"
          cy="8.93"
          r="3.5"
          fill="currentColor"
          className="text-secondary"
        />
      </svg>
    </span>
  );

  if (variant === "mark") {
    return <span className={cn("inline-flex", className)}>{mark}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {mark}
      <span className="text-sm font-semibold tracking-tight text-foreground">
        {BRAND.name}
      </span>
    </span>
  );
}
