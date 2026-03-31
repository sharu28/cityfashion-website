import { ImageResponse } from "next/og";

import { company, formattedWhatsAppNumber } from "@/lib/site";

export const alt = "City Fashion wholesale catalog";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "linear-gradient(135deg, #1f1714 0%, #2c1d15 55%, #b97837 100%)",
          color: "white",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "36px",
            padding: "42px",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", fontSize: 22, letterSpacing: 7, textTransform: "uppercase", opacity: 0.7 }}>
                Wholesale Catalog
              </div>
              <div style={{ display: "flex", fontSize: 78, fontWeight: 700, lineHeight: 0.95, maxWidth: 720 }}>
                Easy ladies wear for shop orders.
              </div>
              <div style={{ display: "flex", fontSize: 30, opacity: 0.82, maxWidth: 760 }}>
                {company.retailerLine}. Browse styles, view colors, and order on WhatsApp.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>{company.name}</div>
                <div style={{ display: "flex", fontSize: 24, opacity: 0.78 }}>{company.address}</div>
              </div>
              <div
                style={{
                  display: "flex",
                  borderRadius: 999,
                  background: "#20925d",
                  padding: "16px 28px",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                WhatsApp {formattedWhatsAppNumber}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
