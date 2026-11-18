import { getDictionary, INTL_LOCALE, type Locale } from "@/lib/i18n";

/** Canonical origin. www redirects here. */
export const siteUrl = "https://matteodiliberto.it";

export const siteName = "Matteo Di Liberto";

export const siteDescription =
  "Matteo Di Liberto — Ingegnere informatico e consulente di Cybersecurity: Penetration Testing, Audit del codice, DevSecOps e messa in sicurezza di infrastrutture cloud e sistemi AI.";

export const githubUrl = "https://github.com/matteodiliberto3";

export const jobTitle = "Cybersecurity Engineer · Penetration Testing & Security Advisory";

export const faqs = getDictionary("it").jsonLd.faqs;

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function personJsonLd(locale: Locale = "it") {
  const t = getDictionary(locale);
  return {
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: siteName,
    url: siteUrl,
    image: absoluteUrl("/portrait.jpg"),
    jobTitle: t.metadata.jobTitle,
    description: t.metadata.siteDescription,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Varese",
      addressCountry: "IT",
    },
    sameAs: [githubUrl],
    knowsAbout: [
      "Cybersecurity",
      "Penetration Testing",
      "Offensive Security",
      "DevSecOps",
      "Cloud Security Hardening",
      "Secure Code Review",
      "AI & MLOps Security",
      "Next.js & TypeScript Security",
    ],
  };
}

export function websiteJsonLd(locale: Locale = "it") {
  const t = getDictionary(locale);
  return {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: siteName,
    description: t.jsonLd.websiteDescription,
    inLanguage: INTL_LOCALE[locale],
    publisher: { "@id": `${siteUrl}/#person` },
  };
}

export function serviceJsonLd(locale: Locale = "it") {
  const t = getDictionary(locale);
  return {
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#service`,
    name: siteName,
    url: siteUrl,
    image: absoluteUrl("/portrait.jpg"),
    description: t.jsonLd.serviceDescription,
    areaServed: { "@type": "Country", name: t.metadata.countryName },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Varese",
      addressCountry: "IT",
    },
    founder: { "@id": `${siteUrl}/#person` },
    makesOffer: t.jsonLd.offers.map((offer) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: offer.name,
        description: offer.description,
      },
    })),
  };
}

export function faqJsonLd(locale: Locale = "it") {
  const t = getDictionary(locale);
  return {
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    mainEntity: t.jsonLd.faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function graphJsonLd(nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
