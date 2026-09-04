import type { MetadataRoute } from "next";
import { createAnonClient } from "@/lib/supabase/service";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://cogniai.com.br";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/precos",
    "/blog",
    "/login",
    "/cadastro",
    "/privacidade",
    "/termos",
  ].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  try {
    const supabase = createAnonClient();
    const [{ data: posts }, { data: subjects }, { data: contents }] =
      await Promise.all([
        supabase
          .from("blog_posts")
          .select("slug, updated_at")
          .eq("status", "publicado"),
        supabase.from("library_subjects").select("id, slug"),
        supabase
          .from("library_contents")
          .select("slug, subject_id, updated_at")
          .eq("is_published", true),
      ]);

    const slugById = new Map((subjects ?? []).map((s) => [s.id, s.slug]));

    const blogRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    const subjectRoutes: MetadataRoute.Sitemap = (subjects ?? []).map((s) => ({
      url: `${BASE}/biblioteca/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    const contentRoutes: MetadataRoute.Sitemap = (contents ?? [])
      .map((c) => {
        const slug = slugById.get(c.subject_id);
        if (!slug) return null;
        return {
          url: `${BASE}/biblioteca/${slug}/${c.slug}`,
          lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.5,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return [...staticRoutes, ...blogRoutes, ...subjectRoutes, ...contentRoutes];
  } catch {
    return staticRoutes;
  }
}
