import type { Metadata } from "next";
import { SiteHeader } from "@/components/cyber/site-header";
import { LaraconCybersecSite } from "@/components/laboratorio/laracon-cybersec-site";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const page = getDictionary(locale).metadata.pages.home;

  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: "/" },
    openGraph: {
      title: page.title,
      description: page.description,
      url: "/",
    },
  };
}

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
