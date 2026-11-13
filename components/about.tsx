import { Heading } from "./heading";
import { Reveal } from "./reveal";

const facts = [
  {
    k: "01",
    title: "Penetration Testing senza falsi positivi.",
    body: "Gli scanner automatici segnalano centinaia di avvisi inutili e mancano le falle critiche. Conduco test d'intrusione manuali per violare la logica applicativa, l'autenticazione e i permessi, dimostrando l'impatto reale di ogni vulnerabilità.",
  },
  {
    k: "02",
    title: "Code Review & DevSecOps automatizzato.",
    body: "Revisiono i sorgenti prima del deploy e introduco gate di sicurezza nelle pipeline di Continuous Integration. Non mi limito a segnalare il bug: fornisco il codice corretto per sanificare gli endpoint ed eliminare i rischi alla radice.",
  },
  {
    k: "03",
    title: "Cloud Hardening & Sicurezza per Modelli AI.",
    body: "Proteggo le superfici d'attacco moderne: configurazioni cloud AWS/GCP, isolamento di container Kubernetes e difese contro attacchi specifici per pipeline MLOps e LLM (prompt injection, manipolazione dei dati di training ed exfiltration).",
  },
];

export function About() {
  return (
    <section className="act about" id="chi-sono" aria-labelledby="about-title">
      <Heading id="about-title" number="01" label="Competenze & Servizi" inkAt={2} hideEyebrow>
        Dall’analisi del perimetro / alla chiusura delle falle.
      </Heading>
      <ol className="facts-grid">
        {facts.map((f, i) => (
          <Reveal as="li" key={f.k} className="fact" delay={80 + i * 90}>
            <span className="fact-k">{f.k}</span>
            <h3 className="fact-title">{f.title}</h3>
            <p className="fact-body">{f.body}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
