import { projects } from "@/lib/projects";

/** Canonical origin. www redirects here. */
export const siteUrl = "https://matteodiliberto.it";

export const siteName = "Matteo Di Liberto";

export const siteDescription =
  "Matteo Di Liberto — Ingegnere informatico e consulente di Cybersecurity: Penetration Testing, Audit del codice, DevSecOps e messa in sicurezza di infrastrutture cloud e sistemi AI.";

export const githubUrl = "https://github.com/matteodiliberto3";

export const jobTitle = "Cybersecurity Engineer · Penetration Testing & Security Advisory";

export const faqs = [
  {
    question: "Chi è Matteo Di Liberto?",
    answer:
      "Ingegnere informatico specializzato in Cybersecurity, MLOps e architetture resilienti. Conduco penetration test manuali, revisioni del codice sorgente e audit di sicurezza per aziende e team di sviluppo che trattano dati e flussi critici.",
  },
  {
    question: "Quali servizi di Cybersecurity offri?",
    answer:
      "Penetration testing per applicazioni web e API (OWASP Top 10 e fallacie di logica applicativa), audit del codice sorgente e pipeline DevSecOps, hardening di infrastrutture cloud/container, e security assessment per sistemi e modelli AI/ML.",
  },
  {
    question: "In cosa si differenzia la tua analisi da uno scanner automatico?",
    answer:
      "Gli scanner automatici producono rumore, falsi positivi e non comprendono la logica di business. Io conduco test manuali per simulare un attaccante reale, fornendo per ogni falla un proof-of-concept riproducibile e il codice corretto per risolverla.",
  },
  {
    question: "Cosa viene rilasciato al termine di un security assessment?",
    answer:
      "Un report esecutivo con matrice di rischio per il management e un report tecnico dettagliato per gli sviluppatori, completo di step di riproduzione, patch consigliate e una sessione di ri-test inclusa per validare le correzioni.",
  },
  {
    question: "Come si avvia una collaborazione?",
    answer:
      "Con una chiamata di 30 minuti protetta da NDA per definire perimetro d'ingaggio, asset critici e vincoli operativi. Si prenota direttamente online scegliendo uno slot disponibile.",
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
      "Servizi di Cybersecurity ad alta intensità tecnica: Penetration Testing, Audit del codice sorgente, DevSecOps e messa in sicurezza di infrastrutture cloud.",
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
          name: "Penetration Testing Web & API",
          description:
            "Test d'intrusione manuale mirato a fallacie di logica di business, bypass di autenticazione e vulnerabilità OWASP.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Audit del Codice & DevSecOps",
          description:
            "Revisione del sorgente, hardening delle dipendenze e integrazione di pipeline CI/CD con scansione e proof automatici.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Hardening Cloud & MLOps Security",
          description:
            "Isolamento ambienti containerizzati, policy zero-trust IAM e protezione da prompt injection su pipeline AI.",
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
