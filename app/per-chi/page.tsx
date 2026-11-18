import type { Metadata } from "next";
import { SiteHeader } from "@/components/cyber/site-header";
import { TargetContextsView } from "@/components/cyber/target-contexts-view";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const page = getDictionary(locale).metadata.pages.perChi;

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: "/per-chi" },
    openGraph: {
      title: `${page.title} — Matteo Di Liberto`,
      description: page.ogDescription,
      url: "/per-chi",
    },
  };
}

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
