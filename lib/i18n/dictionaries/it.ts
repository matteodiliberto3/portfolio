import type { Dictionary } from "./types";

export const it: Dictionary = {
  lang: {
    switcherLabel: "Selezione lingua",
    names: {
      it: "Italiano",
      en: "English",
      de: "Deutsch",
    },
  },
  metadata: {
    siteTitleDefault: "Matteo Di Liberto — Cybersecurity Engineer & Penetration Testing",
    siteTitleTemplate: "%s — Matteo Di Liberto",
    siteDescription:
      "Matteo Di Liberto — Ingegnere informatico e consulente di Cybersecurity: Penetration Testing, Audit del codice, DevSecOps e messa in sicurezza di infrastrutture cloud e sistemi AI.",
    jobTitle: "Cybersecurity Engineer · Penetration Testing & Security Advisory",
    countryName: "Italia",
    pages: {
      home: {
        title: "Cybersecurity — Matteo Di Liberto",
        description:
          "Il mondo digitale è cambiato. Verifiche di sicurezza su sistemi, accessi e applicazioni per aiutare imprese, startup e organizzazioni a individuare i rischi prima che diventino un problema.",
      },
      perChi: {
        title: "Per chi",
        description:
          "Il rischio non guarda le dimensioni della tua azienda: verifiche di sicurezza per imprenditori e PMI, startup e software house, multinazionali e grandi organizzazioni.",
        ogDescription:
          "Imprenditori e PMI, startup e software house, multinazionali e grandi organizzazioni: come individuare e gestire i rischi informatici nel tuo contesto.",
      },
      metodologia: {
        title: "Metodo",
        description:
          "Non puoi proteggere ciò che non conosci: Deconstruct, Exploit, Remediate. Il metodo in tre fasi per individuare e risolvere i rischi di sicurezza.",
      },
      prenota: {
        title: "Prenota un primo confronto",
        description:
          "Trenta minuti su Google Meet con Matteo Di Liberto per valutare la situazione della tua azienda, i rischi concreti e i primi passi di verifica.",
      },
    },
  },
  jsonLd: {
    websiteDescription:
      "Matteo Di Liberto — Ingegnere informatico e consulente di Cybersecurity: Penetration Testing, Audit del codice, DevSecOps e messa in sicurezza di infrastrutture cloud e sistemi AI.",
    serviceDescription:
      "Servizi di Cybersecurity ad alta intensità tecnica: Penetration Testing, Audit del codice sorgente, DevSecOps e messa in sicurezza di infrastrutture cloud.",
    offers: [
      {
        name: "Penetration Testing Web & API",
        description:
          "Test d'intrusione manuale mirato a fallacie di logica di business, bypass di autenticazione e vulnerabilità OWASP.",
      },
      {
        name: "Audit del Codice & DevSecOps",
        description:
          "Revisione del sorgente, hardening delle dipendenze e integrazione di pipeline CI/CD con scansione e proof automatici.",
      },
      {
        name: "Hardening Cloud & MLOps Security",
        description:
          "Isolamento ambienti containerizzati, policy zero-trust IAM e protezione da prompt injection su pipeline AI.",
      },
    ],
    faqs: [
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
    ],
  },
  header: {
    brand: "MATTEO DI LIBERTO",
    navAriaLabel: "Navigazione principale",
    nav: {
      home: "Home",
      perChi: "Per chi",
      metodologia: "Metodo",
    },
    cta: "PRENOTA UN PRIMO CONFRONTO",
  },
  hero: {
    ariaLabel: "Il cambiamento digitale",
    portraitAlt: "Ritratto di Matteo Di Liberto in stile ASCII art",
    subtitle: "La tua azienda è rimasta al passo?",
    ctaPrimary: "Parliamo della tua azienda",
    ctaSecondary: "Scopri cosa è cambiato ↓",
  },
  goDeeper: {
    ariaLabel: "La consapevolezza: funzionare non significa essere al sicuro",
    titleLine1: "Funzionare",
    titleLine2: "non significa essere al sicuro",
    p1: "La tua azienda può operare ogni giorno senza mostrare segnali di problemi, ma avere vulnerabilità che nessuno sta controllando.",
    p2: "Con l'evoluzione delle minacce e delle responsabilità normative, conoscere i propri rischi digitali è il primo passo per proteggersi.",
  },
  risposte: {
    ariaLabel: "Le tre risposte al cambiamento: Retool, Adapt, Evolve",
    headingLine1: "IL MONDO CAMBIA.",
    headingLine2: "RESTARE FERMI È UNA SCELTA.",
    bands: {
      RETOOL: {
        title: "Rimetti in discussione i tuoi strumenti.",
        body: [
          "Un sistema datato, un software non supportato o una tecnologia mai aggiornata possono diventare un punto debole.",
        ],
        statement:
          "Aggiornare non significa necessariamente sostituire tutto. Significa capire cosa mantenere, cosa migliorare e cosa non puoi più trascurare.",
      },
      ADAPT: {
        title: "Cambia il modo in cui affronti i rischi.",
        body: [
          "Non basta installare una nuova tecnologia se continui a utilizzarla con le stesse abitudini.",
        ],
        statement:
          "La sicurezza dipende dalle tecnologie, ma anche dalle decisioni e dai comportamenti di chi le utilizza.",
      },
      EVOLVE: {
        title: "Non aspettare che sia un problema a farti cambiare.",
        body: [
          "Le minacce evolvono, le tecnologie cambiano e gli obblighi normativi con esse.",
        ],
        statement:
          "Evolvere significa imparare a riconoscere quando è il momento di verificare, aggiornare e migliorare ciò su cui si basa la tua attività.",
      },
    },
  },
  targetsHome: {
    ariaLabel: "A chi mi rivolgo: Imprenditori e PMI, Startup e software house, Multinazionali",
    tablistAriaLabel: "Seleziona il tipo di realtà aziendale",
    titleLine1: "OGNI AZIENDA HA QUALCOSA",
    titleLine2Prefix: "CHE NON PUÒ PERMETTERSI ",
    titleEmphasis: "DI PERDERE.",
    deepLinkPrefix: "Approfondisci:",
  },
  conclusion: {
    ariaLabel: "Dalla consapevolezza all'azione",
    line1: "IL PROSSIMO ATTACCO",
    line2: "NON TI AVVISERÀ.",
    p1: "Ma questo non significa che tu debba aspettarlo per iniziare a porti le domande giuste.",
    p2: "Non devi conoscere tutte le risposte oggi. Devi sapere da dove iniziare a cercarle.",
    ctaPrimary: "Prenota un primo confronto",
    ctaDirect: "Contatto diretto",
  },
  perChi: {
    headingLine1: "IL RISCHIO NON GUARDA",
    headingLine2: "LE DIMENSIONI DELLA TUA AZIENDA.",
    intro:
      "Tre scenari operativi diversi, stessi rischi reali ma priorità differenti. Scegli il tuo contesto per vedere dove si nascondono le criticità e cosa ottieni dalla verifica.",
    tabsAriaLabel: "Seleziona il contesto aziendale",
    stageAriaLabel: "Dettaglio dello scenario selezionato",
    asideAriaLabelPrefix: "Sintesi visiva e risultato per",
    homeLink: "Torna alla home",
    topLink: "Torna su ↑",
    methodLink: "Scopri il metodo",
  },
  segments: {
    pmi: {
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
      schemaTitle: "DOVE SI FERMA IL LAVORO",
      schemaNodes: [
        {
          role: "OPERATIVITÀ",
          label: "Gestionale e ordini quotidiani",
          detail: "Fatture, consegne e flussi interni dipendono dalla continuità del sistema.",
        },
        {
          role: "PUNTO CRITICO",
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
      deliverableTitle: "COSA OTTIENI",
      deliverableHeadline: "Una direzione chiara, non gergo tecnico",
      deliverableSummary:
        "Un quadro ordinato delle criticità su applicazioni e accessi, distinguendo ciò che richiede azione immediata da ciò che può attendere.",
    },
    startup: {
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
      schemaTitle: "DOVE IL PRODOTTO VIENE MESSO ALLA PROVA",
      schemaNodes: [
        {
          role: "FLUSSO ATTESO",
          label: "Utente autenticato sulla propria area",
          detail: "Le funzionalità rispondono regolarmente ai casi d'uso previsti.",
        },
        {
          role: "PUNTO CRITICO",
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
      deliverableTitle: "COSA OTTIENI",
      deliverableHeadline: "Evidenze riproducibili per i dev",
      deliverableSummary:
        "Passi chiari su come un comportamento anomalo è stato verificato e indicazioni pratiche su cui il team di sviluppo può intervenire subito.",
    },
    enterprise: {
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
      schemaTitle: "DOVE NASCONO LE ZONE D'OMBRA",
      schemaNodes: [
        {
          role: "COMPONENTI ISOLATI",
          label: "Singoli moduli già presidiati",
          detail: "Ogni area applica i propri controlli interni previsti dalle policy.",
        },
        {
          role: "PUNTO CRITICO",
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
      deliverableTitle: "COSA OTTIENI",
      deliverableHeadline: "Riscontri mirati sul perimetro concordato",
      deliverableSummary:
        "Evidenze tecniche circostanziate su percorsi e interazioni specifiche, a supporto dei team responsabili e delle priorità di intervento.",
    },
  },
  methodology: {
    ariaLabel: "Metodo operativo in tre fasi",
    headingLine1: "NON PUOI PROTEGGERE",
    headingLine2: "CIÒ CHE NON CONOSCI.",
    phasePrefix: "FASE",
    pillars: {
      deconstruct: {
        title: "Prima capiamo come funziona.",
        body: [
          "Ogni azienda utilizza tecnologie diverse. Partiamo dai sistemi, dagli accessi e dalle applicazioni che sostengono il suo lavoro, per capire dove concentrare le verifiche.",
        ],
      },
      exploit: {
        title: "Poi mettiamo alla prova la sicurezza.",
        body: [
          "Con test autorizzati e mirati, verifichiamo se determinate debolezze possano essere realmente sfruttate.",
          "Perché conoscere una vulnerabilità è diverso dal capire quali conseguenze potrebbe avere.",
        ],
      },
      remediate: {
        title: "Infine, capiamo cosa correggere.",
        body: [
          "Le verifiche devono produrre risposte, non soltanto elenchi di problemi.",
          "Le criticità individuate vengono spiegate, documentate e tradotte in indicazioni operative, così da poter decidere dove intervenire e con quale priorità.",
        ],
      },
    },
    closingQuote: "La consapevolezza, da sola, non basta. Deve portare a una decisione.",
    ctaPrimary: "Prenota un primo confronto",
    ctaSecondary: "Torna alla home",
  },
  booking: {
    backToSite: "TORNA AL SITO",
    topMeta: "GOOGLE MEET · 30 MIN · SOLO SU APPUNTAMENTO",
    pageTitle: "Prenota un primo confronto",
    phoneDisplay: "+39 371 150 0055",
    calAriaLabel: "Scegli un giorno",
    prevMonth: "Mese precedente",
    nextMonth: "Mese successivo",
    weekDays: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
    dayFullSuffix: "nessun orario disponibile",
    fetchError: "Non riesco a leggere il calendario.",
    retry: "RIPROVA",
    stepsAriaLabel: "Avanzamento prenotazione",
    steps: [
      { num: "01", label: "GIORNO" },
      { num: "02", label: "ORARIO" },
      { num: "03", label: "DETTAGLI" },
    ],
    guideTitle: "COME FUNZIONA IL CONFRONTO",
    guideFoot:
      "← SCEGLI UN GIORNO DISPONIBILE SUL CALENDARIO PER VEDERE GLI ORARI SU GOOGLE MEET.",
    howItWorks: [
      {
        code: "01",
        title: "Inquadriamo il contesto",
        body: "Mi racconti quali software, accessi o applicazioni sostengono la tua attività e che cosa vuoi proteggere.",
      },
      {
        code: "02",
        title: "Distinguiamo le priorità",
        body: "Capiamo insieme se ci sono rischi concreti da verificare subito o aspetti che possono aspettare.",
      },
      {
        code: "03",
        title: "Nessun impegno commerciale",
        body: "Esci dalla chiamata con indicazioni chiare sui possibili primi passi, senza paroloni tecnici né pressioni.",
      },
    ],
    resetToGuide: "GUIDA",
    loadingSlots: "Aggiornamento orari disponibili…",
    emptyDay:
      "Nessun orario libero per questa data. Seleziona un altro giorno sul calendario.",
    slotsAriaLabel: "Orari disponibili",
    selectedPrefix: "SCELTO:",
    selectedGlue: "·",
    changeSlot: "CAMBIA ORARIO",
    fieldName: "NOME *",
    namePlaceholder: "Es. Marco Rossi",
    nameError: "Inserisci almeno 2 caratteri per il nome.",
    fieldEmail: "EMAIL *",
    emailPlaceholder: "nome@azienda.it",
    emailError: "Inserisci un indirizzo email valido (es. nome@azienda.it).",
    fieldTopic: "DI COSA PARLIAMO (OPZIONALE)",
    topicPlaceholder: "Es. gestionale aziendale, accessi, applicazione web o primo controllo.",
    submitIdlePrefix: "CONFERMA CONFRONTO",
    submitBusy: "PRENOTAZIONE IN CORSO…",
    connectionError: "Connessione persa. Riprova.",
    genericError: "Qualcosa è andato storto.",
    confirmedBadge: "PRENOTAZIONE CONFERMATA",
    confirmedTimePrefix: "alle",
    confirmedDemoNote:
      "Modalità di prova: il calendario non è collegato, nessun evento è stato creato.",
    confirmedLivePrefix: "Ti ho mandato l’invito a ",
    confirmedLiveSuffix: ". Dentro trovi già il link per Google Meet.",
    openMeet: "APRI LINK GOOGLE MEET",
    backToSiteDone: "TORNA AL SITO",
    directAriaLabel: "Contatto telefonico diretto",
    directEyebrow: "CONTATTO DIRETTO",
    directText: "Non trovi un orario comodo o preferisci parlarne subito al telefono?",
    directButtonPrefix: "CHIAMA ORA",
    apiErrors: {
      rateLimitDisp: "Troppe richieste.",
      invalidMonth: "Mese non valido.",
      calUnreachable: "Calendario non raggiungibile.",
      rateLimitBook: "Troppe prenotazioni da questo indirizzo.",
      badBody: "Richiesta non leggibile.",
      invalidSlot: "Orario non valido.",
      missingName: "Manca il nome.",
      invalidEmail: "Email non valida.",
      slotTaken: "Questo orario è appena stato preso. Scegline un altro.",
      calWriteFailed: "Non sono riuscito a scrivere sul calendario.",
    },
    calendarInvite: {
      summaryPrefix: "Chiamata con",
      topicPrefix: "Di cosa parliamo:",
    },
  },
};
