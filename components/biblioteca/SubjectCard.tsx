import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { ProgressBar } from "@/components/biblioteca/ProgressBar";
import { SubjectIcon } from "@/components/biblioteca/SubjectIcon";
import type { SubjectWithCount } from "@/lib/biblioteca/queries";

export function SubjectCard({
  subject,
  done,
}: {
  subject: SubjectWithCount;
  done: number;
}) {
  return (
    <Link href={`/biblioteca/${subject.slug}`} className="group">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardBody className="flex h-full flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-secondary">
              <SubjectIcon name={subject.icon} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {subject.name}
              </p>
              <p className="text-xs text-muted">
                {subject.totalContents}{" "}
                {subject.totalContents === 1 ? "conteúdo" : "conteúdos"}
              </p>
            </div>
          </div>

          {subject.description && (
            <p className="line-clamp-2 text-xs text-muted">
              {subject.description}
            </p>
          )}

          <div className="mt-auto pt-1">
            <ProgressBar
              done={done}
              total={subject.totalContents}
              showLabel={false}
            />
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
