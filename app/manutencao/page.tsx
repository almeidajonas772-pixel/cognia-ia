import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { SITE } from "@/lib/nav";
import { getLaunchState } from "@/lib/launch";

export const metadata: Metadata = {
  title: "Em manutenção",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const { banner } = await getLaunchState();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-secondary">
          <Wrench className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-foreground">
          {SITE.name} está em manutenção
        </h1>
        <p className="mt-2 text-sm text-muted">
          {banner ||
            "Estamos fazendo uma atualização rápida. Volte em alguns minutos — seus dados estão a salvo."}
        </p>
      </div>
    </div>
  );
}
