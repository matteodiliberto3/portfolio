export type Project = {
  slug: string;
  index: string;
  title: string;
  kind: "Web app" | "Sito web";
  status: "live" | "boot";
  year: string;
  role: string;
  stack: string[];
  claim: string;
  summary: string;
  detail: string;
  problem: string;
  answer: string;
  href: string;
  still: string;
};

export const projects: Project[] = [
  {
    slug: "the-teaching-hub",
    index: "01",
    title: "The Teaching Hub",
    kind: "Web app",
    status: "live",
    year: "2026",
    role: "Idea, interfaccia, codice",
    stack: ["Next.js", "Sandpack", "TypeScript"],
    claim: "Insegnare architetture senza slide.",
    summary:
      "Hub per architetture, pattern e sicurezza con playground nel browser.",
    detail:
      "Quattro moduli: Event-Driven Architecture, architetture frontend oltre la SPA, design pattern con il flusso animato, e cybersecurity dentro il flusso, con JWT in cookie httpOnly, sanitizzazione, rate limit, CORS e CSP.",
    problem:
      "Chi studia architetture legge definizioni e non vede mai il trade-off.",
    answer:
      "Ogni modulo mostra il contratto JSON, il codice server e client, e un playground che gira nella pagina.",
    href: "https://the-teaching-hub.vercel.app/",
    still: "/stills/teaching-hub.png",
  },
  {
    slug: "krypt-trader-engine",
    index: "02",
    title: "Krypt Trader Engine",
    kind: "Web app",
    status: "boot",
    year: "2026",
    role: "Motore e interfaccia",
    stack: ["Next.js", "Dati di mercato"],
    claim: "Un motore quantitativo, ancora in avvio.",
    summary: "Motore quant: analisi e deploy di strategie di alto profilo per i mercati.",
    detail:
      "Aprendo l’indirizzo si legge una riga sola, al centro del nero: Initializing Quant Engine. Il progetto è online, l’interfaccia di lavoro non è ancora la home pubblica.",
    problem: "Leggere il mercato a mano è lento e pieno di bias.",
    answer:
      "Il motore è online e sta girando. La pagina pubblica mostra l’avvio, non la sala macchine.",
    href: "https://krypt-trader-engine.vercel.app/",
    still: "/stills/krypt.png",
  },
  {
    slug: "voltra",
    index: "03",
    title: "Voltra",
    kind: "Web app",
    status: "live",
    year: "2026",
    role: "Marchio e vetrina",
    stack: ["Vetrina", "Carrello"],
    claim: "Una cuffia, tanto vuoto intorno.",
    summary:
      "E-commerce di elettronica: Premium consumer electronics, Technology, Refined.",
    detail:
      "Sfondo chiaro, una cuffia grande dietro al titolo, e in testata solo VOLTRA, Home e Shop. La prima schermata tiene poco testo e molto spazio.",
    problem:
      "Un prodotto di fascia alta si svaluta se la pagina lo mette in mezzo al rumore.",
    answer:
      "Una schermata sola, un prodotto, due voci di menu. Il resto è spazio.",
    href: "https://voltra.onrender.com/",
    still: "/stills/voltra.png",
  },
  {
    slug: "bb-massimo-centro",
    index: "04",
    title: "B&B Massimo Centro",
    kind: "Sito web",
    status: "live",
    year: "2026",
    role: "Sito e richiesta disponibilità",
    stack: ["Sito", "Modulo prenotazioni"],
    claim: "Palermo, e un modulo che porta ospiti.",
    summary:
      "Boutique stay in Via Mariano Stabile: camere e richiesta disponibilità.",
    detail:
      "Hero sul Teatro Politeama con la riga “Sentirsi a casa, nel cuore di Palermo.” Tre tipologie: Suite Massimo, Camera Verdi, Loft Teatro. L’indirizzo esatto arriva in conferma.",
    problem:
      "Il titolare riceveva richieste sparse e doveva ripetere ogni volta le stesse informazioni.",
    answer:
      "Camere illustrate una per una e un modulo con date e preferenze, così la prima risposta è già una conferma.",
    href: "https://bb-massimo-centro.onrender.com/",
    still: "/stills/bb-massimo.png",
  },
  {
    slug: "picco-bellazzi",
    index: "05",
    title: "Studio Picco Bellazzi",
    kind: "Sito web",
    status: "live",
    year: "2026",
    role: "Sito e testi",
    stack: ["Sito", "Recensioni"],
    claim: "Cinquant’anni di studio, detti con calma.",
    summary:
      "Studio legale a Busto Arsizio, dal 1976.",
    detail:
      "Il nome in un serif grande sopra una sala di lettura sbiadita. Filosofia, aree, recensioni dei clienti e un pulsante per essere chiamati.",
    problem:
      "Uno studio con cinquant’anni di storia sembrava, online, uno studio qualsiasi.",
    answer:
      "Il numero 50 diventa un elemento visivo, e le parole dei clienti stanno in pagina al posto delle promesse.",
    href: "https://picobellazzisite.onrender.com/",
    still: "/stills/picobellazzi.png",
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
