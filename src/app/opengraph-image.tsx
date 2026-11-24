import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { catalogShareAlt, catalogShareSize } from "@/lib/share-metadata";
import { company, formattedWhatsAppNumber } from "@/lib/site";

export const alt = catalogShareAlt;
export const size = catalogShareSize;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [photo, icon] = await Promise.all([
    readFile(join(process.cwd(), "public/share-catalog-cover.png"), "base64"),
    readFile(join(process.cwd(), "src/app/apple-icon.png"), "base64"),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", color: "#111111", background: "#f5f5f3" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 760,
            height: 630,
            padding: "54px 62px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders directly to PNG. */}
            <img src={`data:image/png;base64,${icon}`} width={64} height={64} alt="" style={{ borderRadius: 12 }} />
            <div style={{ fontSize: 32, fontWeight: 700 }}>{company.name}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 81, fontWeight: 700, lineHeight: 1.04 }}>
              <span>Wholesale</span>
              <span>ladies wear</span>
            </div>
            <div style={{ fontSize: 30, color: "#4d4d4d" }}>Order from 6 pieces per style</div>
          </div>

          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#105c38" }}>
            WhatsApp {formattedWhatsAppNumber}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders directly to PNG. */}
        <img src={`data:image/png;base64,${photo}`} width={440} height={630} alt="Peach City Fashion top" />
      </div>
    ),
    size,
  );
}
