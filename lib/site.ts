import { projects } from "@/lib/projects";

/** Canonical origin. www redirects here. */
export const siteUrl = "https://matteodiliberto.it";

export const siteName = "Matteo Di Liberto";

export const siteDescription =
  "Matteo Di Liberto progetta e sviluppa siti web su misura a Varese e in tutta Italia: design curato, codice pulito e nessun intermediario tra la prima bozza e la messa online.";

export const githubUrl = "https://github.com/matteodiliberto3";

export const jobTitle = "Siti web su misura · Design & Sviluppo";

export const faqs = [
  {
    question: "Chi è Matteo Di Liberto?",
    answer:
      "Un designer e sviluppatore web su misura a Varese: progetta l'interfaccia e scrive il codice in prima persona, dalla prima bozza alla messa online, garantendo un unico interlocutore senza filtri né intermediari.",
  },
  {
    question: "Che lavori ha online?",
    answer:
      "Tra i progetti online: la nuova presenza digitale per lo storico Studio Legale Picco Bellazzi a Busto Arsizio, il sito di presentazione e richiesta disponibilità per il B&B Massimo Centro a Palermo, il concept store Voltra, e progetti proprietari ad alta intensità tecnica come The Teaching Hub e Krypt Trader Engine.",
  },
  {
    question: "Come si inizia un progetto?",
    answer:
      "Con una chiamata di trenta minuti su Google Meet. Si sceglie giorno e orario sulla pagina Prenota: gli slot disponibili arrivano in tempo reale dal calendario.",
  },
  {
    question: "Cosa resta al cliente a fine lavoro?",
    answer:
      "La piena ed esclusiva titolarità di tutto: dominio, hosting, grafica, testi e codice sorgente, senza vincoli contrattuali né canoni nascosti.",
  },
  {
    question: "Dove lavora Matteo Di Liberto?",
    answer:
      "A Varese, collaborando da remoto e di persona con professionisti, studi e attività in tutta Italia.",
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
      "Siti web su misura",
      "UI design",
      "UX design",
      "Sviluppo web frontend",
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
      "Siti web e interfacce digitali su misura, dalla prima bozza alla pubblicazione: un solo interlocutore tra design e codice.",
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
          description:
            "Design dell'interfaccia, testi e codice su misura, con dominio e hosting intestati al cliente.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Web app su misura",
          description:
            "Applicazione web in Next.js e TypeScript, progettata e sviluppata per elevate prestazioni e sicurezza.",
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
