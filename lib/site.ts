import { projects } from "@/lib/projects";

/** Canonical origin. www redirects here. */
export const siteUrl = "https://matteodiliberto.it";

export const siteName = "Matteo Di Liberto";

export const siteDescription =
  "Matteo Di Liberto, a Palermo, disegna siti e web app e scrive il codice a mano. Cinque lavori online: The Teaching Hub, Krypt Trader Engine, Voltra, B&B Massimo Centro, Studio Picco Bellazzi.";

export const githubUrl = "https://github.com/matteodiliberto3";

export const jobTitle = "Web designer e sviluppatore";

export const faqs = [
  {
    question: "Chi è Matteo Di Liberto?",
    answer:
      "Matteo Di Liberto progetta siti e web app a Palermo. Disegna la pagina e scrive il codice, dalla bozza alla pubblicazione, con un solo interlocutore.",
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
      "A Palermo. Tra i lavori per attività: un B&B in Via Mariano Stabile e uno studio legale a Busto Arsizio, dal 1976.",
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
      addressLocality: "Palermo",
      addressCountry: "IT",
    },
    sameAs: [githubUrl],
    knowsAbout: ["Next.js", "TypeScript", "Siti web", "Web app", "Web design"],
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
      "Siti web e web app disegnati e sviluppati a mano, dalla bozza alla pubblicazione.",
    areaServed: { "@type": "Country", name: "Italia" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Palermo",
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
