import { ImageResponse } from "next/og";

export const alt = "Matteo Di Liberto — design engineer, interfacce e codice a mano";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#e6e1d8",
          color: "#14171c",
          padding: "72px 80px",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          Design engineer · Varese
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 92, lineHeight: 0.92, letterSpacing: "-0.04em" }}>
            Matteo Di Liberto
          </div>
          <div style={{ fontSize: 34, color: "#3c3934", maxWidth: 860 }}>
            Disegna l’interfaccia e scrive il codice, a mano.
          </div>
        </div>
        <div style={{ fontSize: 26, color: "#5e5a54" }}>matteodiliberto.it</div>
      </div>
    ),
    { ...size },
  );
}
