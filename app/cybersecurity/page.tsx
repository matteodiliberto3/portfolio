import type { Metadata } from "next";
import Link from "next/link";
import { LaraconCybersecSite } from "@/components/laboratorio/laracon-cybersec-site";

export const metadata: Metadata = {
  title: "Cybersecurity — Matteo Di Liberto",
  description:
    "Il mondo digitale è cambiato. Verifiche di sicurezza su sistemi, accessi e applicazioni per aiutare imprese, startup e organizzazioni a individuare i rischi prima che diventino un problema.",
  alternates: { canonical: "/cybersecurity" },
  openGraph: {
    title: "Cybersecurity — Matteo Di Liberto",
    description:
      "Il mondo digitale è cambiato. Verifiche di sicurezza su sistemi, accessi e applicazioni per aiutare imprese, startup e organizzazioni a individuare i rischi prima che diventino un problema.",
    url: "/cybersecurity",
  },
};

export default function CybersecurityPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#010101",
        color: "#C8C7C9",
        fontFamily: "var(--font-geist-mono), monospace",
      }}
    >
      {/* Top Bar Tattica Compatta */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#010101",
          borderBottom: "1px solid #262428",
          padding: "10px clamp(14px, 3vw, 32px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              background: "#0d0d10",
              color: "#C8C7C9",
              fontSize: "11px",
              letterSpacing: "0.06em",
              textDecoration: "none",
              border: "1px solid #2e2c30",
              borderRadius: 0,
            }}
          >
            ← TORNA AL SITO
          </Link>
          <span style={{ fontSize: "11px", color: "#7C797A", letterSpacing: "0.08em" }}>
            CYBERSECURITY // CONSAPEVOLEZZA E VERIFICA
          </span>
        </div>

        <Link
          href="/prenota"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 14px",
            background: "#C50B3F",
            color: "#ffffff",
            fontSize: "11px",
            letterSpacing: "0.06em",
            textDecoration: "none",
            borderRadius: 0,
            fontFamily: "var(--font-geist-mono), monospace",
            textTransform: "uppercase",
          }}
        >
          PRENOTA UN PRIMO CONFRONTO →
        </Link>
      </header>

      {/* Vista Principale: Sito Cybersec Dither 26 */}
      <LaraconCybersecSite />
    </main>
  );
}
