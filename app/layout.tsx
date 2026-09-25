import { JsonLd } from "@/components/json-ld";
import {
  graphJsonLd,
  personJsonLd,
  serviceJsonLd,
  siteDescription,
  siteName,
  siteUrl,
  websiteJsonLd,
} from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
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

const indexable = process.env.VERCEL_ENV !== "preview";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — design engineer, interfacce e codice a mano`,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  category: "portfolio",
  robots: indexable
    ? { index: true, follow: true }
    : { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: siteUrl,
    siteName,
    title: `${siteName} — design engineer, interfacce e codice a mano`,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — design engineer, interfacce e codice a mano`,
    description: siteDescription,
  },
};

export const viewport = {
  themeColor: "#e6e1d8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <JsonLd
          data={graphJsonLd([personJsonLd(), websiteJsonLd(), serviceJsonLd()])}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
