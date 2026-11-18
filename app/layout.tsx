import { CustomScrollbar } from "@/components/cyber/custom-scrollbar";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { JsonLd } from "@/components/json-ld";
import { ViewTransitionBridge } from "@/components/page-link";
import { getDictionary, OG_LOCALE } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";
import {
  graphJsonLd,
  personJsonLd,
  serviceJsonLd,
  siteName,
  siteUrl,
  websiteJsonLd,
} from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Antonio, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

const antonio = Antonio({
  variable: "--font-antonio",
  subsets: ["latin"],
  weight: ["700"],
});

const indexable = process.env.VERCEL_ENV !== "preview";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = getDictionary(locale);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t.metadata.siteTitleDefault,
      template: t.metadata.siteTitleTemplate,
    },
    description: t.metadata.siteDescription,
    applicationName: siteName,
    authors: [{ name: siteName, url: siteUrl }],
    creator: siteName,
    category: "portfolio",
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      url: siteUrl,
      siteName,
      title: t.metadata.siteTitleDefault,
      description: t.metadata.siteDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: t.metadata.siteTitleDefault,
      description: t.metadata.siteDescription,
    },
  };
}

export const viewport = {
  themeColor: "#e6e1d8",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${antonio.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <JsonLd
          data={graphJsonLd([
            personJsonLd(locale),
            websiteJsonLd(locale),
            serviceJsonLd(locale),
          ])}
        />
        <LocaleProvider initialLocale={locale}>
          <ViewTransitionBridge />
          <CustomScrollbar />
          {children}
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  );
}
