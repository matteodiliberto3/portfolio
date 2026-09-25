import { projects } from "@/lib/projects";

/** Canonical origin. www redirects here. */
export const siteUrl = "https://matteodiliberto.it";

export const siteName = "Matteo Di Liberto";

export const siteDescription =
  "Matteo Di Liberto è un design engineer a Varese: disegna l’interfaccia e scrive il codice, dalla bozza alla pubblicazione. Cinque lavori online: The Teaching Hub, Krypt Trader Engine, Voltra, B&B Massimo Centro, Studio Picco Bellazzi.";

export const githubUrl = "https://github.com/matteodiliberto3";

export const jobTitle = "Design engineer e fullstack engineer";

export const faqs = [
  {
    question: "Chi è Matteo Di Liberto?",
    answer:
      "Un informatico che lavora come design engineer: si occupa dell’interfaccia, dell’esperienza d’uso e del codice che le regge, dalla bozza alla pubblicazione, con un solo interlocutore.",
  },
  {
    question: "Che lavori ha online?",
    answer:
      "Cinque: The Teaching Hub, un hub per architetture e sicurezza con playground nel browser; Krypt Trader Engine, un motore quantitativo in avvio; Voltra, una vetrina di elettronica; il sito del B&B Massimo Centro a Palermo; il sito dello Studio Picco Bellazzi a Busto Arsizio.",
  },
  {
    question: "Come si inizia un progetto?",
    answer:
      "Con una chiamata di trenta minuti su Google Meet. Si sceglie giorno e orario sulla pagina Prenota: gli slot liberi arrivano dal calendario.",
  },
  {
    question: "Cosa resta al cliente a fine lavoro?",
    answer: "Dominio, hosting e il sito. Le chiavi restano al cliente.",
  },
  {
    question: "Dove lavora Matteo Di Liberto?",
    answer:
      "A Varese, per clienti in tutta Italia. Tra i lavori per attività: un B&B in Via Mariano Stabile a Palermo e uno studio legale a Busto Arsizio, dal 1976.",
  },
] as const;

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function personJsonLd() {
  return {
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: siteName,
    url: siteUrl,
    image: absoluteUrl("/portrait.jpg"),
    jobTitle,
    description: siteDescription,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Varese",
      addressCountry: "IT",
    },
    sameAs: [githubUrl],
    knowsAbout: [
      "UI design",
      "UX design",
      "Design engineering",
      "Sviluppo fullstack",
      "Next.js",
      "TypeScript",
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: siteName,
    description: siteDescription,
    inLanguage: "it-IT",
    publisher: { "@id": `${siteUrl}/#person` },
  };
}

export function serviceJsonLd() {
  return {
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#service`,
    name: siteName,
    url: siteUrl,
    image: absoluteUrl("/portrait.jpg"),
    description:
      "Interfacce disegnate e sviluppate a mano, dalla bozza alla pubblicazione: un solo interlocutore tra design e codice.",
    areaServed: { "@type": "Country", name: "Italia" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Varese",
      addressCountry: "IT",
    },
    founder: { "@id": `${siteUrl}/#person` },
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Sito web su misura",
          description: "Pagina, testi e codice, con dominio e hosting intestati al cliente.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Web app",
          description: "Applicazione web in Next.js e TypeScript, dall’interfaccia al deploy.",
        },
      },
    ],
  };
}

export function faqJsonLd() {
  return {
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function worksJsonLd() {
  return {
    "@type": "ItemList",
    "@id": `${siteUrl}/#lavori`,
    name: "Lavori di Matteo Di Liberto",
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/lavori/${project.slug}`),
      name: project.title,
    })),
  };
}

export function graphJsonLd(nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
