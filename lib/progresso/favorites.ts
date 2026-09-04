import { createClient } from "@/lib/supabase/server";
import { listFavoriteMessages } from "@/lib/chat/queries";
import { FAVORITE_TYPE } from "@/lib/biblioteca/types";

export type FavoriteEntry = {
  id: string;
  category: "Biblioteca" | "Respostas da IA";
  title: string;
  subtitle: string;
  href: string;
  recurrence?: string;
  addedAt: string;
};

/** Agrega tudo o que o usuário favoritou (spec §2). */
export async function getFavoritesData(userId: string): Promise<{
  entries: FavoriteEntry[];
  countsByCategory: Record<string, number>;
}> {
  const supabase = createClient();

  const [{ data: favRows }, chatFavs] = await Promise.all([
    supabase
      .from("favorites")
      .select("item_id, created_at")
      .eq("user_id", userId)
      .eq("item_type", FAVORITE_TYPE)
      .order("created_at", { ascending: false }),
    listFavoriteMessages(userId),
  ]);

  const entries: FavoriteEntry[] = [];

  const ids = (favRows ?? []).map((f) => f.item_id);
  if (ids.length) {
    const [{ data: contents }, { data: subjects }] = await Promise.all([
      supabase
        .from("library_contents")
        .select("id, slug, title, subject_id, recurrence")
        .in("id", ids),
      supabase.from("library_subjects").select("id, slug, name"),
    ]);
    const subjById = new Map((subjects ?? []).map((s) => [s.id, s]));
    const addedById = new Map(
      (favRows ?? []).map((f) => [f.item_id, f.created_at])
    );
    for (const c of contents ?? []) {
      const s = subjById.get(c.subject_id);
      if (!s) continue;
      entries.push({
        id: c.id,
        category: "Biblioteca",
        title: c.title,
        subtitle: s.name,
        href: `/biblioteca/${s.slug}/${c.slug}`,
        recurrence: c.recurrence,
        addedAt: addedById.get(c.id) ?? c.id,
      });
    }
  }

  for (const m of chatFavs) {
    entries.push({
      id: m.id,
      category: "Respostas da IA",
      title:
        m.content.replace(/[#*_>`]/g, "").slice(0, 120).trim() +
        (m.content.length > 120 ? "…" : ""),
      subtitle: m.conversation_title,
      href: `/chat/${m.conversation_id}`,
      addedAt: m.created_at,
    });
  }

  entries.sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));

  const countsByCategory: Record<string, number> = {};
  for (const e of entries)
    countsByCategory[e.category] = (countsByCategory[e.category] ?? 0) + 1;

  return { entries, countsByCategory };
}
