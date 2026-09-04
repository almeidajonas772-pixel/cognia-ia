import { SITE } from "@/lib/nav";

/**
 * Fase 13 — dados estruturados (schema.org). Injeta um <script type=application/ld+json>.
 * Server components — sem estado, seguros para páginas estáticas.
 */

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://cogniai.com.br";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // conteúdo controlado por nós (sem entrada de usuário)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization + WebSite — vai no layout de marketing. */
export function OrgJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${BASE}/#organization`,
            name: SITE.name,
            url: BASE,
            description: SITE.description,
            slogan: SITE.tagline,
            areaServed: "BR",
            knowsLanguage: "pt-BR",
          },
          {
            "@type": "WebSite",
            "@id": `${BASE}/#website`,
            url: BASE,
            name: SITE.name,
            inLanguage: "pt-BR",
            publisher: { "@id": `${BASE}/#organization` },
          },
        ],
      }}
    />
  );
}

/** FAQPage — usado na página de planos. */
export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((it) => ({
          "@type": "Question",
          name: it.q,
          acceptedAnswer: { "@type": "Answer", text: it.a },
        })),
      }}
    />
  );
}
