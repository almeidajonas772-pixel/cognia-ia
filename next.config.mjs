/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  // O build não é bloqueado por avisos de lint (rode `npm run lint` à parte
  // para limpá-los). A checagem de tipos do TypeScript continua ativa.
  eslint: { ignoreDuringBuilds: true },

  experimental: {
    // Fase 10 — performance de bundle: tree-shake libs de ícones/markdown.
    optimizePackageImports: ["lucide-react", "react-markdown", "remark-gfm"],
    // Fase 12 — habilita instrumentation.ts (relatório de env no boot).
    instrumentationHook: true,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Supabase Storage (avatars, capas de blog) e imagens da própria origem.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },

  async headers() {
    // Fase 11 — CSP em modo report-only (não quebra nada; dá visibilidade).
    // Para reforçar depois, trocar por "Content-Security-Policy" com nonce.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.upstash.io https://www.google-analytics.com https://region1.google-analytics.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
      {
        // assets versionados do Next — cache agressivo e imutável.
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/img/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
