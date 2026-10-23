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
    slug: "picco-bellazzi",
    index: "01",
    title: "Studio Picco Bellazzi",
    kind: "Sito web",
    status: "live",
    year: "2026",
    role: "Sito e testi",
    stack: ["Sito", "Recensioni"],
    claim: "Cinquant’anni di studio, detti con calma e autorevolezza.",
    summary:
      "Portare online cinquant'anni di storia forense con un'interfaccia sobria, autorevole e immediata per i clienti dello studio.",
    detail:
      "Il nome in un serif grande sopra una sala di lettura sbiadita. Filosofia, aree dello studio, recensioni dei clienti e un percorso chiaro per richiedere un contatto.",
    problem:
      "Uno studio con cinquant’anni di storia rischiava, online, di sembrare uno studio qualsiasi senza trasmettere il proprio prestigio.",
    answer:
      "Un’identità digitale sobria e senza fronzoli, dove l'esperienza dello studio e le parole dei clienti prendono il posto delle promesse generiche.",
    href: "https://picobellazzisite.onrender.com/",
    still: "/stills/picobellazzi.png",
  },
  {
    slug: "bb-massimo-centro",
    index: "02",
    title: "B&B Massimo Centro",
    kind: "Sito web",
    status: "live",
    year: "2026",
    role: "Sito e richiesta disponibilità",
    stack: ["Sito", "Modulo prenotazioni"],
    claim: "Palermo, e un’accoglienza che parte dall’interfaccia.",
    summary:
      "Presenza digitale elegante per una boutique stay nel centro di Palermo: camere in evidenza e richiesta disponibilità diretta.",
    detail:
      "Hero sul Teatro Politeama con la riga “Sentirsi a casa, nel cuore di Palermo.” Tre tipologie: Suite Massimo, Camera Verdi, Loft Teatro. L’indirizzo esatto arriva in conferma.",
    problem:
      "Il titolare riceveva richieste sparse e doveva ripetere a mano le stesse informazioni a ogni ospite.",
    answer:
      "Spazi illustrati con trasparenza e un modulo guidato per date e preferenze: la prima risposta all'ospite è già una conferma precisa.",
    href: "https://bb-massimo-centro.onrender.com/",
    still: "/stills/bb-massimo.png",
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
      "Concept store di elettronica di alta gamma: design essenziale, tipografia decisa e zero distrazioni dall'oggetto.",
    detail:
      "Sfondo chiaro, un prodotto in primo piano e una navigazione essenziale: VOLTRA, Home e Shop. Nessun rumore visivo, solo valore percepito.",
    problem:
      "Un prodotto di fascia alta si svaluta se la pagina lo mette in mezzo al rumore visivo.",
    answer:
      "Una schermata sola, un prodotto, due voci di menu. Il resto è respiro e tipografia.",
    href: "https://voltra.onrender.com/",
    still: "/stills/voltra.png",
  },
  {
    slug: "the-teaching-hub",
    index: "04",
    title: "The Teaching Hub",
    kind: "Web app",
    status: "live",
    year: "2026",
    role: "Idea, interfaccia, codice",
    stack: ["Next.js", "Sandpack", "TypeScript"],
    claim: "Insegnare architetture software senza slide.",
    summary:
      "Piattaforma interattiva per l'ingegneria del software: architetture distribuite, sicurezza avanzata e laboratori nel browser.",
    detail:
      "Quattro moduli: Event-Driven Architecture, architetture frontend oltre la SPA, design pattern con il flusso animato, e cybersecurity dentro il flusso (JWT in cookie sicuri, sanitizzazione, rate limit, CORS e CSP).",
    problem:
      "Chi studia architetture legge definizioni teoriche e non sperimenta mai i trade-off pratici.",
    answer:
      "Ogni modulo mostra il contratto JSON, il codice reale e un playground interattivo che gira nella pagina.",
    href: "https://the-teaching-hub.vercel.app/",
    still: "/stills/teaching-hub.png",
  },
  {
    slug: "krypt-trader-engine",
    index: "05",
    title: "Krypt Trader Engine",
    kind: "Web app",
    status: "boot",
    year: "2026",
    role: "Motore e interfaccia",
    stack: ["Next.js", "Dati di mercato"],
    claim: "Rigore computazionale per mercati complessi.",
    summary:
      "Motore quantitativo proprietario: analisi ed esecuzione di strategie per mercati finanziari.",
    detail:
      "Aprendo l’indirizzo si legge una riga sola, al centro del nero: Initializing Quant Engine. Il progetto è online, l’interfaccia operativa non è ancora la home pubblica.",
    problem:
      "Leggere il mercato a mano è lento, impreciso e influenzato da bias cognitivi.",
    answer:
      "Il motore analizza i flussi in tempo reale. La pagina pubblica mostra l’avvio del sistema, preservando l'infrastruttura sottostante.",
    href: "https://krypt-trader-engine.vercel.app/",
    still: "/stills/krypt.png",
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
