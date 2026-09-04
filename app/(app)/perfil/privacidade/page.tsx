import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConsentForm } from "@/components/privacy/ConsentForm";
import { DataExportPanel } from "@/components/privacy/DataExportPanel";
import { DeleteAccountPanel } from "@/components/privacy/DeleteAccountPanel";
import { CancelDeletionButton } from "@/components/security/CancelDeletionButton";
import { getStoredConsent } from "@/lib/privacy/consent";
import { listExports } from "@/lib/privacy/export";
import { getDeletionState, DELETION_GRACE_DAYS } from "@/lib/privacy/deletion";

export const metadata: Metadata = { title: "Privacidade e dados" };
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const user = await requireUser();
  const [consent, exports, deletion] = await Promise.all([
    getStoredConsent(user.id),
    listExports(user.id),
    getDeletionState(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-secondary" />
        <h1 className="text-xl font-semibold text-foreground">Privacidade e dados</h1>
      </div>
      <p className="text-sm text-muted">
        Controle o uso dos seus dados conforme a{" "}
        <Link href="/privacidade" className="text-secondary underline">
          Política de Privacidade
        </Link>{" "}
        (LGPD).
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Consentimento</CardTitle>
        </CardHeader>
        <CardBody>
          <ConsentForm
            initial={{ analytics: consent.analytics, marketing: consent.marketing }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportar meus dados</CardTitle>
        </CardHeader>
        <CardBody>
          <DataExportPanel
            exports={exports.map((e) => ({
              id: e.id,
              status: e.status,
              requested_at: e.requested_at,
              expires_at: e.expires_at,
            }))}
          />
        </CardBody>
      </Card>

      <Card className="border-rose-500/30">
        <CardHeader>
          <CardTitle>Excluir conta</CardTitle>
        </CardHeader>
        <CardBody>
          {deletion.requested ? (
            <div className="space-y-3 text-sm">
              <p className="text-foreground">
                Exclusão agendada para{" "}
                <strong>
                  {deletion.scheduledFor
                    ? new Date(deletion.scheduledFor).toLocaleDateString("pt-BR")
                    : "—"}
                </strong>
                .
              </p>
              <CancelDeletionButton />
            </div>
          ) : (
            <DeleteAccountPanel graceDays={DELETION_GRACE_DAYS} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
