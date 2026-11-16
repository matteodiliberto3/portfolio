import type { Metadata } from "next";
import { SiteHeader } from "@/components/cyber/site-header";
import { TargetContextsView } from "@/components/cyber/target-contexts-view";

export const metadata: Metadata = {
  title: "Per chi",
  description:
    "Il rischio non guarda le dimensioni della tua azienda: verifiche di sicurezza per imprenditori e PMI, startup e software house, multinazionali e grandi organizzazioni.",
  alternates: { canonical: "/per-chi" },
  openGraph: {
    title: "Per chi — Matteo Di Liberto",
    description:
      "Imprenditori e PMI, startup e software house, multinazionali e grandi organizzazioni: come individuare e gestire i rischi informatici nel tuo contesto.",
    url: "/per-chi",
  },
};

export default function TargetContextsPage() {
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
      <SiteHeader active="per-chi" />
      <TargetContextsView />
    </main>
  );
}
