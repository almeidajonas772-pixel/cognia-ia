import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/admin/config";
import { SiteConfigForm } from "@/components/admin/SiteConfigForm";

export const metadata: Metadata = { title: "Configurações" };

export default async function AdminConfigPage() {
  const config = await getSiteConfig();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold text-foreground">
        Configurações gerais
      </h1>
      <SiteConfigForm config={config} />
    </div>
  );
}
