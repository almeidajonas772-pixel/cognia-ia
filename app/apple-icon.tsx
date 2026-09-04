import { ImageResponse } from "next/og";
import { markDataUri } from "@/lib/brand";

/** Ícone para "Adicionar à tela de início" no iOS — marca COGNI IA. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B1220",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markDataUri()} alt="" width={116} height={116} />
      </div>
    ),
    size
  );
}
