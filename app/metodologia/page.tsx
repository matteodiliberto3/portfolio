import type { Metadata } from "next";
import { MethodologyView } from "@/components/cyber/methodology-view";
import { SiteHeader } from "@/components/cyber/site-header";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const page = getDictionary(locale).metadata.pages.metodologia;

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: "/metodologia" },
    openGraph: {
      title: `${page.title} — Matteo Di Liberto`,
      description: page.description,
      url: "/metodologia",
    },
  };
}

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
