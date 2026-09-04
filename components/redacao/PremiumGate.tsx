import Link from "next/link";
import { PenLine, Check, Lock } from "lucide-react";

export function PremiumGate() {
  const perks = [
    "Correção por banca: ENEM, FUVEST, UNICAMP, FGV e mais",
    "Envio por texto, foto ou PDF (com OCR)",
    "Nota por competência, análise de erros e reescrita",
    "Feedback priorizado e comparação com a nota máxima",
    "Histórico de evolução e banco de erros recorrentes",
  ];
  return (
    <div className="mx-auto max-w-xl animate-fade-in text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-secondary">
        <PenLine className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        A correção de redação é um recurso Premium
      </h1>
      <p className="mt-1 text-sm text-muted">
        Correção detalhada no rigor da banca que você vai prestar.
      </p>

      <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-muted">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
            {p}
          </li>
        ))}
      </ul>

      <Link
        href="/precos"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white hover:bg-primary-hover"
      >
        <Lock className="h-4 w-4" />
        Assinar Premium
      </Link>
    </div>
  );
}
