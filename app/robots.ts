import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://cogniai.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/bem-vindo",
        "/chat",
        "/redacao",
        "/comunidade",
        "/conquistas",
        "/convidar",
        "/favoritos",
        "/historico",
        "/perfil",
        "/admin",
        "/api",
        "/manutencao",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
