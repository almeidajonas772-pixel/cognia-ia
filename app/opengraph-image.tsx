import { ImageResponse } from "next/og";
import { SITE } from "@/lib/nav";
import { BRAND, markDataUri } from "@/lib/brand";

/** Imagem OG/Twitter padrão (compartilhamento em redes/WhatsApp). */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE.name;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background:
            "linear-gradient(135deg, #0B1220 0%, #111A2E 60%, #0B1220 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              background: "#111A2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={markDataUri()} alt="" width={56} height={56} />
          </div>
          <div style={{ color: "#E5E7EB", fontSize: 44, fontWeight: 700 }}>
            {BRAND.name}
          </div>
        </div>
        <div
          style={{
            marginTop: 44,
            color: "#E5E7EB",
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: 940,
          }}
        >
          {BRAND.tagline}
        </div>
        <div style={{ marginTop: 26, color: "#94A3B8", fontSize: 30 }}>
          Biblioteca · Tutor IA · Correção de redação · Plano adaptativo
        </div>
      </div>
    ),
    size
  );
}
