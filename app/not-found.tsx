import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-semibold text-foreground">404</p>
      <p className="text-sm text-muted">Esta página não existe.</p>
      <Button href="/" variant="outline">
        Voltar ao início
      </Button>
    </div>
  );
}
