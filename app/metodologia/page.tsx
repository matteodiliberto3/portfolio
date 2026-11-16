import type { Metadata } from "next";
import { MethodologyView } from "@/components/cyber/methodology-view";
import { SiteHeader } from "@/components/cyber/site-header";

export const metadata: Metadata = {
  title: "Metodo",
  description:
    "Non puoi proteggere ciò che non conosci: Deconstruct, Exploit, Remediate. Il metodo in tre fasi per individuare e risolvere i rischi di sicurezza.",
  alternates: { canonical: "/metodologia" },
  openGraph: {
    title: "Metodo — Matteo Di Liberto",
    description:
      "Non puoi proteggere ciò che non conosci: Deconstruct, Exploit, Remediate. Il metodo in tre fasi per individuare e risolvere i rischi di sicurezza.",
    url: "/metodologia",
  },
};

export default function MethodologyPage() {
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
      <SiteHeader active="metodologia" />
      <MethodologyView />
    </main>
  );
}
