import { ImageResponse } from "next/og";
import { markDataUri } from "@/lib/brand";

/** Fase 13/final — favicon / ícone do app com a marca COGNI IA. */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0B1220 0%, #111A2E 100%)",
          borderRadius: 96,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markDataUri()} alt="" width={320} height={320} />
      </div>
    ),
    size
  );
}
