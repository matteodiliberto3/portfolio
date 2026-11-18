import type { Dictionary } from "./types";

export const de: Dictionary = {
  lang: {
    switcherLabel: "Sprachauswahl",
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
      "Matteo Di Liberto — Informatikingenieur und Cybersecurity-Berater: Penetration Testing, Quellcode-Audits, DevSecOps sowie Absicherung von Cloud-Infrastrukturen und KI-Systemen.",
    jobTitle: "Cybersecurity Engineer · Penetration Testing & Security Advisory",
    countryName: "Italien",
    pages: {
      home: {
        title: "Cybersecurity — Matteo Di Liberto",
        description:
          "Die digitale Welt hat sich verändert. Gezielte Sicherheitsprüfungen für Systeme, Zugriffe und Anwendungen, damit Unternehmen, Startups und Konzerne Risiken erkennen, bevor sie zum Schaden werden.",
      },
      perChi: {
        title: "Für wen",
        description:
          "Risiken achten nicht auf Unternehmensgrößen: Sicherheitsprüfungen für Unternehmer & KMU, Startups & Softwarehäuser sowie Großunternehmen.",
        ogDescription:
          "KMU, Startups & Softwarehäuser und internationale Unternehmen: So identifizieren und steuern Sie konkrete digitale Risiken in Ihrem Umfeld.",
      },
      metodologia: {
        title: "Methode",
        description:
          "Man kann nicht schützen, was man nicht kennt: Deconstruct, Exploit, Remediate. Die dreistufige Methode zur Erkennung und Behebung konkreter Sicherheitsrisiken.",
      },
      prenota: {
        title: "Erstgespräch vereinbaren",
        description:
          "Dreißig Minuten über Google Meet mit Matteo Di Liberto, um Ihre Systemlandschaft, reale Risiken und sinnvolle erste Prüfschritte einzuordnen.",
      },
    },
  },
  jsonLd: {
    websiteDescription:
      "Matteo Di Liberto — Informatikingenieur und Cybersecurity-Berater: Penetration Testing, Code-Audits, DevSecOps sowie Absicherung von Cloud-Infrastrukturen und KI-Systemen.",
    serviceDescription:
      "Technisch fundierte Cybersecurity-Leistungen: Manuelle Penetrationstests, Quellcode-Audits, DevSecOps und Cloud-Hardening.",
    offers: [
      {
        name: "Web- & API-Penetrationstests",
        description:
          "Manuelle Penetrationstests mit Fokus auf Geschäftslogik-Schwächen, Authentifizierungs-Bypässe und OWASP-Schwachstellen.",
      },
      {
        name: "Code-Audit & DevSecOps",
        description:
          "Analyse kritischer Codebases, Hardening von Abhängigkeiten sowie CI/CD-Integration automatisierter Sicherheitsprüfungen.",
      },
      {
        name: "Cloud-Hardening & MLOps Security",
        description:
          "Isolation containerisierter Umgebungen, Zero-Trust-IAM-Policies und Schutz vor Prompt Injection in KI-Pipelines.",
      },
    ],
    faqs: [
      {
        question: "Wer ist Matteo Di Liberto?",
        answer:
          "Informatikingenieur mit Fokus auf Cybersecurity, MLOps und resiliente Architekturen. Ich führe manuelle Penetrationstests, Quellcode-Reviews und Sicherheitsaudits für Unternehmen mit kritischen Daten und Prozessen durch.",
      },
      {
        question: "Welche Cybersecurity-Leistungen bieten Sie an?",
        answer:
          "Penetrationstests für Webanwendungen und APIs (OWASP Top 10 und Geschäftslogik), Quellcode- und DevSecOps-Audits, Cloud-/Container-Hardening sowie Security Assessments für KI-/ML-Systeme.",
      },
      {
        question: "Worin unterscheidet sich Ihre Prüfung von automatischen Scannern?",
        answer:
          "Automatische Scanner erzeugen Rauschen und Fehlalarme, verstehen aber keine Geschäftslogik. Ich teste manuell wie ein realer Angreifer und liefere zu jeder Lücke einen reproduzierbaren Proof of Concept sowie konkrete Korrekturhinweise.",
      },
      {
        question: "Welche Ergebnisse erhält man am Ende eines Assessments?",
        answer:
          "Einen Management-Überblick mit Risikomatrix sowie einen detaillierten technischen Bericht für Entwickler inklusive Reproduktionsschritten, Patch-Empfehlungen und anschließendem Re-Test.",
      },
      {
        question: "Wie startet eine Zusammenarbeit?",
        answer:
          "Mit einem 30-minütigen, durch NDA geschützten Gespräch zur Klärung von Scope, kritischen Systemen und Rahmenbedingungen — direkt online buchbar.",
      },
    ],
  },
  header: {
    brand: "MATTEO DI LIBERTO",
    navAriaLabel: "Hauptnavigation",
    nav: {
      home: "Home",
      perChi: "Für wen",
      metodologia: "Methode",
    },
    cta: "ERSTGESPRÄCH VEREINBAREN",
  },
  hero: {
    ariaLabel: "Der digitale Wandel",
    portraitAlt: "Porträt von Matteo Di Liberto im ASCII-Art-Stil",
    subtitle: "Hat Ihr Unternehmen Schritt gehalten?",
    ctaPrimary: "Über Ihr Unternehmen sprechen",
    ctaSecondary: "Was sich verändert hat ↓",
  },
  goDeeper: {
    ariaLabel: "Bewusstsein: Funktionieren bedeutet nicht, sicher zu sein",
    titleLine1: "Funktionieren",
    titleLine2: "bedeutet nicht, sicher zu sein",
    p1: "Ihr Betrieb kann jeden Tag ohne sichtbare Störung laufen und dennoch Schwachstellen enthalten, die niemand überprüft.",
    p2: "Während sich Bedrohungen und gesetzliche Anforderungen weiterentwickeln, ist Klarheit über die eigenen digitalen Risiken der erste Schritt zu wirksamem Schutz.",
  },
  risposte: {
    ariaLabel: "Drei Antworten auf den Wandel: Retool, Adapt, Evolve",
    headingLine1: "DIE WELT VERÄNDERT SICH.",
    headingLine2: "STILLSTAND IST EINE ENTSCHEIDUNG.",
    bands: {
      RETOOL: {
        title: "Hinterfragen Sie Ihre Werkzeuge.",
        body: [
          "Ein veraltetes System, nicht mehr gewartete Software oder lange nicht aktualisierte Technik können still zu einem Risikofaktor werden.",
        ],
        statement:
          "Modernisieren bedeutet nicht, alles auszutauschen. Es bedeutet zu verstehen, was bleiben kann, was gestärkt werden muss und was sich nicht länger aufschieben lässt.",
      },
      ADAPT: {
        title: "Ändern Sie Ihren Umgang mit Risiken.",
        body: [
          "Neue Systeme einzuführen bringt wenig, wenn im Alltag dieselben Gewohnheiten bestehen bleiben.",
        ],
        statement:
          "Sicherheit hängt von Technologie ab, ebenso aber von den Entscheidungen und Routinen der Menschen, die damit arbeiten.",
      },
      EVOLVE: {
        title: "Warten Sie nicht auf einen Vorfall, um zu handeln.",
        body: [
          "Bedrohungen entwickeln sich weiter, Systeme wachsen — und regulatorische Pflichten ebenso.",
        ],
        statement:
          "Sich weiterzuentwickeln heißt rechtzeitig zu erkennen, wann die Grundlage Ihres Geschäfts geprüft, aktualisiert und geschützt werden muss.",
      },
    },
  },
  targetsHome: {
    ariaLabel: "Für wen: KMU, Startups und Softwarehäuser, Konzerne",
    tablistAriaLabel: "Unternehmensgröße auswählen",
    titleLine1: "JEDES UNTERNEHMEN HAT ETWAS,",
    titleLine2Prefix: "DAS ES SICH NICHT LEISTEN KANN, ",
    titleEmphasis: "ZU VERLIEREN.",
    deepLinkPrefix: "Mehr erfahren:",
  },
  conclusion: {
    ariaLabel: "Vom Bewusstsein ins Handeln",
    line1: "DER NÄCHSTE ANGRIFF",
    line2: "KÜNDIGT SICH NICHT AN.",
    p1: "Das bedeutet aber nicht, dass Sie darauf warten müssen, um die richtigen Fragen zu stellen.",
    p2: "Sie müssen heute nicht alle Antworten kennen. Sie müssen wissen, wo Sie mit der Suche beginnen.",
    ctaPrimary: "Erstgespräch vereinbaren",
    ctaDirect: "Direktkontakt",
  },
  perChi: {
    headingLine1: "RISIKEN ACHTEN NICHT",
    headingLine2: "AUF DIE GRÖSSE IHRES UNTERNEHMENS.",
    intro:
      "Drei unterschiedliche Unternehmensrealitäten, reale Bedrohungen, andere Prioritäten. Wählen Sie Ihren Kontext, um zu sehen, wo Schwachstellen entstehen und was Ihnen die Prüfung bringt.",
    tabsAriaLabel: "Unternehmenskontext auswählen",
    stageAriaLabel: "Details des gewählten Szenarios",
    asideAriaLabelPrefix: "Übersicht und Ergebnis für",
    homeLink: "Zur Startseite",
    topLink: "Nach oben ↑",
    methodLink: "Methode entdecken",
  },
  segments: {
    pmi: {
      shortLabel: "Unternehmer & KMU",
      label: "Unternehmer & KMU",
      headline: "Wenn Ihre zentrale Unternehmenssoftware morgen stillsteht – was passiert dann?",
      intro: [
        "Wie viele Abläufe Ihres Tagesgeschäfts hängen von einer Software, einem Benutzerkonto oder einem IT-Dienstleister ab?",
        "Meist merkt man erst wie kritisch diese Abhängigkeiten sind, wenn plötzlich nichts mehr geht.",
      ],
      statement:
        "Sie müssen kein Cybersecurity-Experte werden. Sie müssen klar verstehen, welche Risiken Ihren Betrieb betreffen und welche Entscheidungen sinnvoll sind.",
      approach:
        "Durch gezielte Prüfungen decken wir Schwachstellen in Systemen und Zugriffsrechten auf, trennen Dringendes von Nebensächlichem und schaffen eine klare Grundlage für nächste Schritte.",
      cta: "Über Ihren Betrieb sprechen",
      schemaTitle: "WO DER BETRIEB STEHT",
      schemaNodes: [
        {
          role: "TAGESGESCHÄFT",
          label: "ERP, Rechnungen & Auftragsabwicklung",
          detail: "Fakturierung, Lieferungen und interne Prozesse hängen von ständiger Verfügbarkeit ab.",
        },
        {
          role: "KRITISCHER PUNKT",
          label: "Geteilte Konten oder externe Zugriffe",
          detail: "Schwache Zugangsdaten oder vergessene Berechtigungen für externe Dienstleister.",
          highlighted: true,
        },
        {
          role: "FOLGE",
          label: "Betriebsausfall & Vertrauensverlust bei Kunden",
          detail: "Ein technisches Problem wird sofort zum wirtschaftlichen Stillstand.",
        },
      ],
      deliverableTitle: "WAS SIE ERHALTEN",
      deliverableHeadline: "Klare Orientierung ohne Fachjargon",
      deliverableSummary:
        "Ein strukturierter Überblick über Schwachstellen bei Anwendungen und Zugriffen – klar getrennt nach sofortigem Handlungsbedarf und späteren Maßnahmen.",
    },
    startup: {
      shortLabel: "Startups & Softwarehäuser",
      label: "Startups & Softwarehäuser",
      headline:
        "Ihr Produkt funktioniert zuverlässig. Haben Sie geprüft, was passiert, wenn es jemand gezielt missbraucht?",
      intro: [
        "Sie haben viel Zeit investiert, es zu entwickeln, zu launchen und am Markt zu positionieren.",
        "Jede neue Funktion, Schnittstelle oder Zugriffslogik bringt jedoch Verhalten mit sich, das aktiv geprüft werden muss.",
        "Eine übersehene Lücke kann Nutzerdaten gefährden, Ausfälle auslösen oder das Vertrauen von Kunden und Investoren beschädigen.",
      ],
      statement:
        "Sicherheit heißt nicht, Produktentwicklung auszubremsen. Sie verhindert, dass ein einzelner blinder Fleck die geleistete Arbeit gefährdet.",
      approach:
        "Gezielte manuelle Tests untersuchen die kritischsten Produktbereiche und liefern reproduzierbare Belege, mit denen Ihr Entwicklerteam sofort arbeiten kann.",
      cta: "Über Ihre Software sprechen",
      schemaTitle: "WO DAS PRODUKT GEPRÜFT WIRD",
      schemaNodes: [
        {
          role: "REGELABLAUF",
          label: "Authentifizierter Nutzer im eigenen Bereich",
          detail: "Alle Funktionen reagieren sauber auf die vorgesehenen Standardfälle.",
        },
        {
          role: "KRITISCHER PUNKT",
          label: "Zugriffsprüfung & API-Geschäftslogik",
          detail: "Manipulierte Anfragen oder unerwartete Rollenwechsel abseits des Happy Paths.",
          highlighted: true,
        },
        {
          role: "RISIKO",
          label: "Kundendaten & Marktvertrauen",
          detail: "Eine einzige fehlende Autorisierungsprüfung kann Daten fremder Mandanten offenlegen.",
        },
      ],
      deliverableTitle: "WAS SIE ERHALTEN",
      deliverableHeadline: "Reproduzierbare Belege für Ihr Dev-Team",
      deliverableSummary:
        "Klare Nachvollziehbarkeit, wie ein Fehlverhalten ausgenutzt wurde, inklusive praxisnaher Hinweise für schnelle Fixes im Code.",
    },
    enterprise: {
      shortLabel: "Konzerne & Großunternehmen",
      label: "Konzerne & Großunternehmen",
      headline: "Viele Kontrollinstanzen bedeuten nicht, dass jeder kritische Pfad geprüft wurde.",
      intro: [
        "Anwendungen, Standorte, Lieferanten und Teams tauschen fortlaufend Daten und Berechtigungen aus.",
        "In komplexen Organisationen entstehen Lücken oft genau an den Schnittstellen zwischen Komponenten, die einzeln betrachtet sauber wirken.",
      ],
      statement:
        "Eine gezielte Prüfung ersetzt bestehende Strukturen nicht. Ihr Mehrwert liegt darin, Übergänge auszuleuchten, die bislang niemand im Zusammenhang getestet hat.",
      approach:
        "Belastbare technische Evidenzen entlang eines klar definierten Scopes helfen internen Sicherheits- und Entwicklungsteams, Prioritäten präzise einzuordnen.",
      cta: "Rahmen abstimmen",
      schemaTitle: "WO BLINDE FLECKEN ENTSTEHEN",
      schemaNodes: [
        {
          role: "EINZELMODULE",
          label: "Bereiche mit bestehenden Kontrollen",
          detail: "Jeder Bereich erfüllt isoliert die internen Vorgaben und Policies.",
        },
        {
          role: "KRITISCHER PUNKT",
          label: "Schnittstellen zwischen Teams & Partnern",
          detail: "Bereichsübergreifende Übergänge, an denen Zuständigkeiten und Annahmen wechseln.",
          highlighted: true,
        },
        {
          role: "SICHTBARKEIT",
          label: "Kritische Pfade im vereinbarten Scope",
          detail: "Gezielte Prüfung von Angriffspfaden, die auf Modulebene unsichtbar bleiben.",
        },
      ],
      deliverableTitle: "WAS SIE ERHALTEN",
      deliverableHeadline: "Präzise Befunde im vereinbarten Scope",
      deliverableSummary:
        "Umfassend dokumentierte technische Nachweise zu konkreten Schnittstellen als Entscheidungsgrundlage für verantwortliche Teams.",
    },
  },
  methodology: {
    ariaLabel: "Dreistufige Arbeitsmethode",
    headingLine1: "MAN KANN NICHT SCHÜTZEN,",
    headingLine2: "WAS MAN NICHT KENNT.",
    phasePrefix: "PHASE",
    pillars: {
      deconstruct: {
        title: "Zuerst verstehen wir, wie es funktioniert.",
        body: [
          "Jedes Unternehmen arbeitet mit eigenen Systemen. Wir starten bei den Anwendungen, Zugängen und Infrastrukturen, die den Betrieb tragen, um gezielt dort anzusetzen, wo es zählt.",
        ],
      },
      exploit: {
        title: "Dann stellen wir die Sicherheit real auf die Probe.",
        body: [
          "Mit autorisierten, gezielten Tests überprüfen wir, ob erkannte Schwachstellen tatsächlich ausnutzbar sind.",
          "Denn eine theoretische Meldung sagt wenig über ihre reale Auswirkung auf Ihr Geschäft.",
        ],
      },
      remediate: {
        title: "Schließlich klären wir, was zuerst behoben wird.",
        body: [
          "Eine Prüfung muss Antworten liefern, nicht nur lange Fehlerlisten.",
          "Identifizierte Risiken werden verständlich dokumentiert und in konkrete Handlungsempfehlungen übersetzt – klar priorisiert für Technik und Leitung.",
        ],
      },
    },
    closingQuote: "Erkenntnis allein reicht nicht. Sie muss zu einer klaren Entscheidung führen.",
    ctaPrimary: "Erstgespräch vereinbaren",
    ctaSecondary: "Zur Startseite",
  },
  booking: {
    backToSite: "ZURÜCK ZUR SEITE",
    topMeta: "GOOGLE MEET · 30 MIN · NUR NACH VEREINBARUNG",
    pageTitle: "Erstgespräch vereinbaren",
    phoneDisplay: "+39 371 150 0055",
    calAriaLabel: "Tag wählen",
    prevMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    weekDays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    dayFullSuffix: "keine Termine verfügbar",
    fetchError: "Kalender kann derzeit nicht geladen werden.",
    retry: "ERNEUT VERSUCHEN",
    stepsAriaLabel: "Buchungsschritte",
    steps: [
      { num: "01", label: "TAG" },
      { num: "02", label: "UHRZEIT" },
      { num: "03", label: "DATEN" },
    ],
    guideTitle: "SO LÄUFT DAS GESPRÄCH AB",
    guideFoot:
      "← WÄHLEN SIE EINEN VERFÜGBAREN TAG IM KALENDER, UM GOOGLE-MEET-ZEITEN ZU SEHEN.",
    howItWorks: [
      {
        code: "01",
        title: "Kontext einordnen",
        body: "Sie schildern kurz, welche Software, Zugänge oder Anwendungen Ihren Betrieb tragen und was geschützt werden soll.",
      },
      {
        code: "02",
        title: "Prioritäten klären",
        body: "Wir schätzen gemeinsam ein, ob akuter Prüfbedarf besteht oder welche Themen warten können.",
      },
      {
        code: "03",
        title: "Unverbindlich & konkret",
        body: "Sie gehen mit klaren Empfehlungen für sinnvolle erste Schritte aus dem Gespräch – ohne Verkaufsdruck.",
      },
    ],
    resetToGuide: "ÜBERSICHT",
    loadingSlots: "Verfügbare Zeiten werden geladen…",
    emptyDay:
      "Für dieses Datum sind keine Termine mehr frei. Bitte wählen Sie einen anderen Tag.",
    slotsAriaLabel: "Verfügbare Uhrzeiten",
    selectedPrefix: "GEWÄHLT:",
    selectedGlue: "·",
    changeSlot: "UHRZEIT ÄNDERN",
    fieldName: "NAME *",
    namePlaceholder: "z. B. Lukas Weber",
    nameError: "Bitte geben Sie mindestens 2 Zeichen für Ihren Namen ein.",
    fieldEmail: "E-MAIL *",
    emailPlaceholder: "name@unternehmen.de",
    emailError: "Bitte geben Sie eine gültige E-Mail-Adresse ein (z. B. name@unternehmen.de).",
    fieldTopic: "WORÜBER SPRECHEN WIR? (OPTIONAL)",
    topicPlaceholder: "z. B. ERP-System, Zugriffsrechte, Webanwendung oder eine erste Prüfung.",
    submitIdlePrefix: "TERMIN BESTÄTIGEN",
    submitBusy: "BUCHUNG LÄUFT…",
    connectionError: "Verbindung unterbrochen. Bitte erneut versuchen.",
    genericError: "Etwas ist schiefgelaufen.",
    confirmedBadge: "TERMIN BESTÄTIGT",
    confirmedTimePrefix: "um",
    confirmedDemoNote:
      "Demomodus: Der Kalender ist nicht verbunden, es wurde kein Kalendereintrag erstellt.",
    confirmedLivePrefix: "Ich habe die Einladung an ",
    confirmedLiveSuffix: " gesendet. Der Google-Meet-Link ist darin bereits enthalten.",
    openMeet: "GOOGLE-MEET-LINK ÖFFNEN",
    backToSiteDone: "ZURÜCK ZUR SEITE",
    directAriaLabel: "Direkter telefonischer Kontakt",
    directEyebrow: "DIREKTKONTAKT",
    directText: "Kein passender Termin frei oder möchten Sie direkt telefonisch sprechen?",
    directButtonPrefix: "JETZT ANRUFEN",
    apiErrors: {
      rateLimitDisp: "Zu viele Anfragen.",
      invalidMonth: "Ungültiger Monat.",
      calUnreachable: "Kalender nicht erreichbar.",
      rateLimitBook: "Zu viele Buchungen von dieser Adresse.",
      badBody: "Anfrage konnte nicht gelesen werden.",
      invalidSlot: "Ungültige Uhrzeit.",
      missingName: "Bitte geben Sie Ihren Namen an.",
      invalidEmail: "Ungültige E-Mail-Adresse.",
      slotTaken: "Dieser Termin wurde gerade vergeben. Bitte wählen Sie eine andere Zeit.",
      calWriteFailed: "Kalendereintrag konnte nicht gespeichert werden.",
    },
    calendarInvite: {
      summaryPrefix: "Gespräch mit",
      topicPrefix: "Thema:",
    },
  },
};
