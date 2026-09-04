import type { Metadata } from "next";
import { listSubmissions } from "@/lib/admin/queries";
import { SubmissionReview } from "@/components/admin/SubmissionReview";

export const metadata: Metadata = { title: "Resumos enviados" };

export default async function AdminResumosPage() {
  const items = await listSubmissions("pendente");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold text-foreground">
        Aprovação de resumos
      </h1>
      <p className="text-sm text-muted">
        Resumos enviados pela comunidade. Ao aprovar, o texto é publicado na
        Biblioteca com layout padronizado e sem dados pessoais.
      </p>
      <SubmissionReview items={items} />
    </div>
  );
}
