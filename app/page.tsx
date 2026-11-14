import type { Metadata } from "next";
import Link from "next/link";
import { LaraconCybersecSite } from "@/components/laboratorio/laracon-cybersec-site";

export const metadata: Metadata = {
  title: "Cybersecurity — Matteo Di Liberto",
  description:
    "Il mondo digitale è cambiato. Verifiche di sicurezza su sistemi, accessi e applicazioni per aiutare imprese, startup e organizzazioni a individuare i rischi prima che diventino un problema.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Cybersecurity — Matteo Di Liberto",
    description:
      "Il mondo digitale è cambiato. Verifiche di sicurezza su sistemi, accessi e applicazioni per aiutare imprese, startup e organizzazioni a individuare i rischi prima che diventino un problema.",
    url: "/",
  },
};

export default function HomePage() {
  return (
    <main
      id="top"
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
          <span style={{ fontSize: "11px", color: "#C8C7C9", letterSpacing: "0.08em" }}>
            MATTEO DI LIBERTO // CYBERSECURITY
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

      {/* Vista Principale: Sito Cybersec */}
      <LaraconCybersecSite />
    </main>
  );
}
