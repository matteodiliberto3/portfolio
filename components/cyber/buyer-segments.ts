import { PALETTE } from "@/components/cyber/tokens";

export type BuyerSegmentKey = "pmi" | "startup" | "enterprise";

export type SegmentSchemaNode = {
  role: string;
  label: string;
  detail: string;
  highlighted?: boolean;
};

export type BuyerSegment = {
  code: string;
  badgeColor: string;
  accentInk: string;
  buttonClass: string;
  solidButtonClass: string;
  shortLabel: string;
  label: string;
  headline: string;
  intro: string[];
  statement: string;
  approach: string;
  cta: string;
  schemaTitle: string;
  schemaNodes: readonly SegmentSchemaNode[];
  deliverableTitle: string;
  deliverableHeadline: string;
  deliverableSummary: string;
};

export const BUYER_SEGMENT_KEYS: readonly BuyerSegmentKey[] = [
  "pmi",
  "startup",
  "enterprise",
] as const;

export const BUYER_SEGMENTS: Record<BuyerSegmentKey, BuyerSegment> = {
  pmi: {
    code: "01",
    badgeColor: PALETTE.red,
    accentInk: PALETTE.redText,
    buttonClass: "cyber-segment-btn-pmi",
    solidButtonClass: "cyber-segment-solid-pmi",
    shortLabel: "Imprenditori e PMI",
    label: "Imprenditori e PMI",
    headline: "Se domani il tuo gestionale si fermasse, cosa succederebbe?",
    intro: [
      "Quante attività della tua giornata dipendono da un software, da un account o da un fornitore informatico?",
      "Spesso ci rendiamo conto di quanto siano importanti soltanto quando qualcosa smette di funzionare.",
    ],
    statement:
      "Non devi diventare un esperto di cybersecurity. Devi poter capire quali rischi riguardano la tua attività e quali decisioni è importante prendere.",
    approach:
      "Attraverso verifiche mirate possiamo individuare le criticità di sistemi e accessi, distinguere ciò che è urgente da ciò che può aspettare e costruire una base concreta per gli interventi successivi.",
    cta: "Parliamo della tua attività",
    schemaTitle: "PUNTO CRITICO",
    schemaNodes: [
      {
        role: "OPERATIVITÀ",
        label: "Gestionale e ordini quotidiani",
        detail: "Fatture, consegne e flussi interni dipendono dalla continuità del sistema.",
      },
      {
        role: "DIPENDENZA",
        label: "Account condivisi o accessi esterni",
        detail: "Credenziali deboli o permessi lasciati attivi a fornitori terzi.",
        highlighted: true,
      },
      {
        role: "CONSEGUENZA",
        label: "Fermo attività e rapporti con i clienti",
        detail: "Il problema tecnico diventa subito un blocco commerciale.",
      },
    ],
    deliverableTitle: "COSA TI PORTI A CASA",
    deliverableHeadline: "Una direzione chiara, non gergo tecnico",
    deliverableSummary:
      "Un quadro ordinato delle criticità su applicazioni e accessi, distinguendo ciò che richiede azione immediata da ciò che può attendere.",
  },
  startup: {
    code: "02",
    badgeColor: PALETTE.blue,
    accentInk: PALETTE.blueText,
    buttonClass: "cyber-segment-btn-startup",
    solidButtonClass: "cyber-segment-solid-startup",
    shortLabel: "Startup e software house",
    label: "Startup e software house",
    headline:
      "Il tuo prodotto funziona. Ma hai verificato cosa succede quando qualcuno prova ad abusarne?",
    intro: [
      "Hai investito tempo per svilupparlo, lanciarlo e portarlo sul mercato.",
      "Ogni nuova funzionalità, integrazione o sistema di accesso introduce però comportamenti che devono essere verificati.",
      "Una vulnerabilità può mettere a rischio i dati degli utenti, creare interruzioni o compromettere la fiducia di clienti e partner.",
    ],
    statement:
      "Non significa rallentare l'innovazione. Significa evitare che un problema trascurato comprometta il lavoro già fatto.",
    approach:
      "Con test mirati possiamo verificare le parti più sensibili del prodotto e fornire evidenze e indicazioni tecniche utilizzabili dal team di sviluppo.",
    cta: "Parliamo del tuo software",
    schemaTitle: "PUNTO CRITICO",
    schemaNodes: [
      {
        role: "FLUSSO ATTESO",
        label: "Utente autenticato sulla propria area",
        detail: "Le funzionalità rispondono regolarmente ai casi d'uso previsti.",
      },
      {
        role: "DEVIAZIONE",
        label: "Controlli di accesso e logica API",
        detail: "Richieste alterate o passaggi tra ruoli non previsti nel rilascio.",
        highlighted: true,
      },
      {
        role: "ESPOSIZIONE",
        label: "Dati degli utenti e fiducia sul mercato",
        detail: "Un errore di autorizzazione può esporre risorse di altri clienti.",
      },
    ],
    deliverableTitle: "COSA TI PORTI A CASA",
    deliverableHeadline: "Evidenze riproducibili per i dev",
    deliverableSummary:
      "Passi chiari su come un comportamento anomalo è stato verificato e indicazioni pratiche su cui il team di sviluppo può intervenire subito.",
  },
  enterprise: {
    code: "03",
    badgeColor: PALETTE.ink,
    accentInk: PALETTE.enterpriseAccent,
    buttonClass: "cyber-segment-btn-enterprise",
    solidButtonClass: "cyber-segment-solid-enterprise",
    shortLabel: "Multinazionali e grandi organizzazioni",
    label: "Multinazionali e grandi organizzazioni",
    headline: "Avere molti controlli non significa aver verificato ogni punto critico.",
    intro: [
      "Applicazioni, sedi, fornitori e team condividono dati e sistemi.",
      "In un'organizzazione complessa, alcune debolezze possono emergere proprio nelle interazioni tra componenti che, considerate singolarmente, sembrano funzionare correttamente.",
    ],
    statement:
      "Il valore di una verifica mirata non è sostituire ciò che già esiste. È approfondire ciò che potrebbe non essere ancora stato osservato.",
    approach:
      "L'obiettivo è fornire evidenze tecniche su sistemi e percorsi specifici, aiutando i team responsabili a comprendere meglio i rischi individuati.",
    cta: "Confrontiamoci",
    schemaTitle: "PUNTO CRITICO",
    schemaNodes: [
      {
        role: "COMPONENTI ISOLATI",
        label: "Singoli moduli già presidiati",
        detail: "Ogni area applica i propri controlli interni previsti dalle policy.",
      },
      {
        role: "PUNTI DI CONTATTO",
        label: "Scambi tra sedi, team e fornitori",
        detail: "Passaggi trasversali dove le responsabilità e le assunzioni cambiano.",
        highlighted: true,
      },
      {
        role: "VISIBILITÀ",
        label: "Percorsi critici su perimetro concordato",
        detail: "Verifica mirata di ciò che sfugge all'osservazione del singolo modulo.",
      },
    ],
    deliverableTitle: "COSA TI PORTI A CASA",
    deliverableHeadline: "Riscontri mirati sul perimetro concordato",
    deliverableSummary:
      "Evidenze tecniche circostanziate su percorsi e interazioni specifiche, a supporto dei team responsabili e delle priorità di intervento.",
  },
};
