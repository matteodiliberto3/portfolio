export type Project = {
  slug: string;
  index: string;
  title: string;
  kind: "Security Audit" | "DevSecOps" | "Web app" | "Research & Lab";
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
    slug: "api-security-audit",
    index: "01",
    title: "FinTech & SaaS API Penetration Test",
    kind: "Security Audit",
    status: "live",
    year: "2026",
    role: "Offensive Security & Remediation",
    stack: ["Penetration Testing", "API Security", "OWASP Top 10", "Burp Suite Pro"],
    claim: "Trovare le falle nella logica applicativa prima che vengano sfruttate.",
    summary:
      "Security assessment manuale su API REST e microservizi per una piattaforma ad alta intensità di transazioni e dati sensibili.",
    detail:
      "Verifica sistematica contro Broken Object Level Authorization (BOLA/IDOR), bypass di rate limiting e privilege escalation orizzontale. Proof-of-concept completi forniti per ogni vettore.",
    problem:
      "Gli scanner automatici restituivano report privi di contesto e non rilevavano le falle nei controlli di autorizzazione a più livelli.",
    answer:
      "Un penetration test manuale guidato dalla logica di business: identificate 3 vulnerabilità ad alto impatto e fornite le patch pronte per il merge nel codice.",
    href: "/prenota",
    still: "/stills/teaching-hub.png",
  },
  {
    slug: "ci-devsecops-pipeline",
    index: "02",
    title: "DevSecOps & Automated Diff Security",
    kind: "DevSecOps",
    status: "live",
    year: "2026",
    role: "Architettura di Sicurezza CI/CD",
    stack: ["DevSecOps", "GitHub Actions", "SAST / DAST", "Automated Pentest"],
    claim: "Sicurezza continua: ogni pull request viene verificata prima del merge.",
    summary:
      "Integrazione di controlli di sicurezza automatizzati nelle pipeline di continuous integration senza rallentare il ciclo di sviluppo.",
    detail:
      "Implementazione di security gates per verificare differenziali di codice su PR: test di iniezioni (SQLi, XSS), controllo delle dipendenze vulnerabili e generazione di SARIF report conformi.",
    problem:
      "I team di sviluppo rilasciavano funzionalità rapidamente ma le vulnerabilità venivano scoperte solo mesi dopo in produzione.",
    answer:
      "Una pipeline DevSecOps calibrata: feedback immediato nel diff dello sviluppatore con test di exploit verificati e zero falsi allarmi bloccanti.",
    href: "/prenota",
    still: "/stills/voltra.png",
  },
  {
    slug: "the-teaching-hub",
    index: "03",
    title: "The Teaching Hub — Security Sandbox",
    kind: "Research & Lab",
    status: "live",
    year: "2026",
    role: "Ingegneria del Software & Sicurezza",
    stack: ["Next.js", "TypeScript", "Cryptography", "CORS / CSP"],
    claim: "Sperimentare la sicurezza del web direttamente nel browser.",
    summary:
      "Piattaforma interattiva di sicurezza applicativa: dimostrazioni in vivo di crittografia, CORS/CSP, rate limiting distribuito e token JWT protetti.",
    detail:
      "Ambiente di laboratorio nel browser con contratti JSON reali, sandbox isolate e scenari di exploit e difesa passo-passo per ingegneri del software.",
    problem:
      "La teoria sulla sicurezza web è spesso astratta: gli sviluppatori faticano a visualizzare come un header mal configurato apra varchi critici.",
    answer:
      "Laboratori interattivi che simulano le difese in tempo reale: manipolazione di cookie HttpOnly, implementazione di Content Security Policy rigide e sanitizzazione.",
    href: "https://the-teaching-hub.vercel.app/",
    still: "/stills/teaching-hub.png",
  },
  {
    slug: "krypt-trader-engine",
    index: "04",
    title: "Krypt — Resilient Financial Infrastructure",
    kind: "Web app",
    status: "boot",
    year: "2026",
    role: "Infrastruttura Sicura & Motore Quant",
    stack: ["Zero-Trust", "Crittografia", "Next.js", "Audit Log"],
    claim: "Integrità computazionale e protezione crittografica dei dati.",
    summary:
      "Infrastruttura di analisi finanziaria ad alte prestazioni progettata con architettura zero-trust, canale crittografato e logging immutabile.",
    detail:
      "Protezione dei flussi di mercato e delle chiavi API di esecuzione: isolamento dei processi critici, gestione dei segreti con rotazione automatica e monitoraggio delle anomalie.",
    problem:
      "Le comunicazioni con feed esterni e l'esecuzione di ordini algoritmici sono esposte a spoofing, replay attack e data tampering.",
    answer:
      "Architettura blindata a livello di socket e memoria: autenticazione reciproca mTLS, payload firmati e barriere contro accessi non autorizzati.",
    href: "https://krypt-trader-engine.vercel.app/",
    still: "/stills/krypt.png",
  },
  {
    slug: "ai-llm-security",
    index: "05",
    title: "AI & MLOps Threat Assessment",
    kind: "Security Audit",
    status: "live",
    year: "2026",
    role: "Ricerca & Hardening Modelli AI",
    stack: ["Prompt Injection Defense", "RAG Security", "MLOps", "Model Hardening"],
    claim: "Difendere gli agenti autonomi e i modelli linguistici da exploit emergenti.",
    summary:
      "Valutazione della sicurezza per applicazioni basate su LLM: mitigazione di indirect prompt injection, data exfiltration e violazioni della sandbox.",
    detail:
      "Audit mirato delle pipeline di Retrieval-Augmented Generation (RAG) e dei tool agentici: inserimento di guardrail semantici, sanitizzazione del contesto esterno e validazione rigida delle chiamate API.",
    problem:
      "L'adozione di assistenti AI espone le aziende a nuovi vettori: prompt malevoli nascosti nei documenti possono dirottare le decisioni del modello.",
    answer:
      "Implementazione di difese a più strati: validazione a monte, sandbox con privilegi minimi per gli agenti e filtri di output per evitare fughe di segreti.",
    href: "/prenota",
    still: "/stills/bb-massimo.png",
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
