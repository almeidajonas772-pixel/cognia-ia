import type { MetadataRoute } from "next";
import { SITE } from "@/lib/nav";

/** Fase 13 — Web App Manifest (instalável / PWA básico). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — estudos para ENEM e vestibulares`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B1220",
    theme_color: "#0B1220",
    lang: "pt-BR",
    categories: ["education"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
