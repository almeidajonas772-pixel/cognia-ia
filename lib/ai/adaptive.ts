import { createServiceClient } from "@/lib/supabase/service";
import { cached } from "@/lib/cache";

/**
 * Fase 15 — IA adaptativa: sintetiza um "plano de hoje" curto e priorizado a
 * partir da memória evoluída, do banco de erros de redação, da leitura em
 * andamento e da atividade recente. Fail-open (lista vazia).
 */

export type PlanStep = {
  id: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
};

export async function getAdaptivePlan(userId: string): Promise<PlanStep[]> {
  return cached(`adaptive:${userId}`, 120, async () => {
    try {
      const db = createServiceClient();
      const [mem, errs, reading, acts] = await Promise.all([
        db
          .from("chat_user_memory")
          .select("weaknesses, evolved_summary")
          .eq("user_id", userId)
          .maybeSingle(),
        db
          .from("essay_error_bank")
          .select("label, occurrences")
          .eq("user_id", userId)
          .order("occurrences", { ascending: false })
          .limit(3),
        db
          .from("library_reading_history")
          .select("content_id, last_viewed_at")
          .eq("user_id", userId)
          .order("last_viewed_at", { ascending: false })
          .limit(5),
        db
          .from("activity_log")
          .select("subject_slug, kind, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const steps: PlanStep[] = [];
      const weaknesses = (mem.data?.weaknesses ?? []).filter(Boolean);
      const lastSubject =
        (acts.data ?? []).find((a) => a.subject_slug)?.subject_slug ?? null;

      // 1) Reforçar o ponto mais fraco
      if (weaknesses.length) {
        steps.push({
          id: "weak",
          title: `Reforçar: ${weaknesses[0]}`,
          detail:
            "A memória da plataforma identificou isto como o seu maior ponto de atenção agora.",
          href: lastSubject ? `/biblioteca/${lastSubject}` : "/biblioteca",
          cta: "Revisar na biblioteca",
        });
      }

      // 2) Continuar uma leitura em andamento
      if ((reading.data ?? []).length) {
        const ids = (reading.data ?? []).map((r) => r.content_id);
        const { data: contents } = await db
          .from("library_contents")
          .select("slug, title, subject_id")
          .in("id", ids)
          .limit(1);
        const c = contents?.[0];
        if (c) {
          const { data: subj } = await db
            .from("library_subjects")
            .select("slug")
            .eq("id", c.subject_id)
            .maybeSingle();
          steps.push({
            id: "continue",
            title: `Continuar "${c.title}"`,
            detail: "Você começou este conteúdo recentemente — feche o ciclo.",
            href: subj?.slug ? `/biblioteca/${subj.slug}/${c.slug}` : "/biblioteca",
            cta: "Retomar",
          });
        }
      }

      // 3) Praticar — redação se o banco de erros pesa, senão questões
      const totalErrs = (errs.data ?? []).reduce((a, e) => a + (e.occurrences ?? 0), 0);
      if (totalErrs >= 3) {
        steps.push({
          id: "redacao",
          title: "Treinar redação mirando os erros recorrentes",
          detail:
            "Seus apontamentos repetem alguns padrões. Uma redação nova consolida a correção.",
          href: "/redacao/nova",
          cta: "Nova redação",
        });
      } else {
        steps.push({
          id: "questoes",
          title: lastSubject
            ? `Fazer questões de ${lastSubject}`
            : "Fazer algumas questões no estilo ENEM",
          detail: "Prática espaçada fixa o que você acabou de estudar.",
          href: "/chat",
          cta: "Gerar questões",
        });
      }

      return steps.slice(0, 3);
    } catch {
      return [];
    }
  });
}
