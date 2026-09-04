import { Card, CardBody } from "@/components/ui/Card";

/** Fallback do <Suspense> das páginas de autenticação. */
export function AuthSkeleton() {
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="h-5 w-24 animate-pulse rounded bg-white/5" />
        <div className="h-4 w-48 animate-pulse rounded bg-white/5" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-white/5" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-white/5" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-white/5" />
      </CardBody>
    </Card>
  );
}
