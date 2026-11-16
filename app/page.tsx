import type { Metadata } from "next";
import { SiteHeader } from "@/components/cyber/site-header";
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
      <SiteHeader active="home" hideOnScrollMiddle />

      {/* Vista Principale: Sito Cybersec */}
      <LaraconCybersecSite />
    </main>
  );
}
