import type { UserProfile } from "@/lib/supabase/types";
import {
  computeSubjectMastery,
  computeWeakSpots,
  getProgressCore,
  type ProgressCore,
} from "@/lib/progresso/queries";
import { progressLimits } from "@/lib/progresso/limits";
import type { Recommendation } from "@/lib/progresso/types";

const RECURRENCE_WEIGHT: Record<string, number> = {
  muito_recorrente: 3,
  recorrente: 2,
  ocasional: 1,
  raro: 0,
};

function nextContentToStudy(core: ProgressCore, subjectSlug?: string) {
  const pool = core.contents
    .filter((c) => !core.completedKeys.has(`${c.subjectSlug}/${c.slug}`))
    .filter((c) => (subjectSlug ? c.subjectSlug === subjectSlug : true))
    .sort(
      (a, b) =>
        (RECURRENCE_WEIGHT[b.recurrence] ?? 0) -
        (RECURRENCE_WEIGHT[a.recurrence] ?? 0)
    );
  return pool[0] ?? null;
}

/** Recomendações de estudo (spec §4.3 e §7 "recomendação do dia"). */
export async function getRecommendations(
  userId: string,
  profile: UserProfile | null
): Promise<Recommendation[]> {
  const core = await getProgressCore(userId);
  const smart = progressLimits(profile).smartRecommendations;

  const recs: Recommendation[] = [];

  const next = nextContentToStudy(core);
  if (next) {
    recs.push({
      id: "study-" + next.id,
      kind: "estudar",
      title: next.title,
      reason:
        next.recurrence === "muito_recorrente"
          ? "Tema muito recorrente no ENEM e ainda não concluído"
          : "Próximo conteúdo pendente com maior peso de prova",
      href: `/biblioteca/${next.subjectSlug}/${next.slug}`,
    });
  }

  if (!smart) {
    return recs.slice(0, 2);
  }

  const weak = computeWeakSpots(core);

  if (weak.staleContents[0]) {
    recs.push({
      id: "review-stale",
      kind: "revisar",
      title: weak.staleContents[0].title,
      reason: "Você concluiu, mas não revisita há mais de 3 semanas",
      href: weak.staleContents[0].href,
    });
  }

  const weakSubject = weak.weakSubjects[0];
  if (weakSubject) {
    recs.push({
      id: "practice-" + weakSubject.slug,
      kind: "praticar",
      title: `Praticar ${weakSubject.name}`,
      reason: `Domínio estimado de ${weakSubject.mastery}% — o mais baixo entre as matérias que você estuda`,
      href: "/chat",
    });
  } else if (weak.untouchedSubjects[0]) {
    const u = weak.untouchedSubjects[0];
    recs.push({
      id: "start-" + u.slug,
      kind: "estudar",
      title: `Começar ${u.name}`,
      reason: `${u.total} conteúdos e você ainda não estudou nenhum`,
      href: `/biblioteca/${u.slug}`,
    });
  }

  const totalDone = computeSubjectMastery(core).reduce((a, s) => a + s.done, 0);
  if (totalDone >= 8) {
    recs.push({
      id: "simulado",
      kind: "simulado",
      title: "Fazer um simulado",
      reason: "Você já concluiu conteúdo suficiente para testar o conjunto",
      href: "/chat",
    });
  }

  return recs.slice(0, 4);
}
