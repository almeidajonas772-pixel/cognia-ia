import type { Config } from "tailwindcss";

/**
 * Identidade visual COGNI IA (Fase 1)
 * Fundo:      #0B1220
 * Cards:      #111A2E
 * Primária:   #3B82F6
 * Secundária: #60A5FA
 * Texto:      #E5E7EB
 * Suporte:    #94A3B8
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B1220",
        surface: "#0F1728",
        card: "#111A2E",
        border: "rgba(148, 163, 184, 0.12)",
        primary: {
          DEFAULT: "#3B82F6",
          hover: "#2F6FE0",
          soft: "rgba(59, 130, 246, 0.12)",
        },
        secondary: "#60A5FA",
        foreground: "#E5E7EB",
        muted: "#94A3B8",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "14px",
        xl: "18px",
        "2xl": "22px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.24), 0 8px 24px rgba(0,0,0,0.18)",
        glow: "0 0 0 1px rgba(59,130,246,0.4), 0 8px 30px rgba(59,130,246,0.18)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
      },
      typography: {
        cogni: {
          css: {
            "--tw-prose-body": "#c9d2e0",
            "--tw-prose-headings": "#E5E7EB",
            "--tw-prose-lead": "#94A3B8",
            "--tw-prose-links": "#60A5FA",
            "--tw-prose-bold": "#E5E7EB",
            "--tw-prose-counters": "#94A3B8",
            "--tw-prose-bullets": "#3B82F6",
            "--tw-prose-hr": "rgba(148,163,184,0.14)",
            "--tw-prose-quotes": "#E5E7EB",
            "--tw-prose-quote-borders": "#3B82F6",
            "--tw-prose-captions": "#94A3B8",
            "--tw-prose-code": "#E5E7EB",
            "--tw-prose-pre-code": "#E5E7EB",
            "--tw-prose-pre-bg": "#0B1220",
            "--tw-prose-th-borders": "rgba(148,163,184,0.24)",
            "--tw-prose-td-borders": "rgba(148,163,184,0.14)",
            maxWidth: "68ch",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
