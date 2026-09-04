import type { Metadata } from "next";
import { Star } from "lucide-react";
import { requireUser, getProfile } from "@/lib/auth";
import { getFavoritesData } from "@/lib/progresso/favorites";
import { progressLimits } from "@/lib/progresso/limits";
import { FavoritesList } from "@/components/progresso/FavoritesList";
import { PremiumLockCard } from "@/components/progresso/Panels";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritosPage() {
  const user = await requireUser();
  const profile = await getProfile();
  const { entries } = await getFavoritesData(user.id);
  const cap = progressLimits(profile).favoritesCap;
  const nearCap = cap !== Infinity && entries.length >= cap - 3;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-secondary">
          <Star className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Favoritos</h1>
          <p className="mt-1 text-sm text-muted">
            {entries.length}{" "}
            {entries.length === 1 ? "item salvo" : "itens salvos"}
            {cap !== Infinity && ` · limite de ${cap} no plano gratuito`}
          </p>
        </div>
      </div>

      <FavoritesList entries={entries} />

      {nearCap && (
        <PremiumLockCard
          title="Favoritos ilimitados"
          body="No plano gratuito você guarda até 20 favoritos. O Premium remove o limite."
        />
      )}
    </div>
  );
}
