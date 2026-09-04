import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: number;
  /** Itens que serão construídos quando a fase entrar. */
  checklist?: string[];
};

/**
 * Placeholder padrão das páginas da Fase 1.
 * A navegação já funciona; a lógica real entra na fase indicada.
 */
export function PagePlaceholder({
  icon: Icon,
  title,
  description,
  phase,
  checklist = [],
}: Props) {
  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-secondary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <Badge tone="primary">Fase {phase}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
      </div>

      <Card className="mt-6">
        <CardBody>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Ainda não implementado
          </p>
          <p className="mt-2 text-sm text-muted">
            Esta é a estrutura visual da Fase 1. As funcionalidades reais desta
            página serão construídas na <strong className="text-foreground">Fase {phase}</strong>,
            consumindo a autenticação e o banco de dados sem alterar o que já existe.
          </p>

          {checklist.length > 0 && (
            <ul className="mt-4 space-y-2">
              {checklist.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
