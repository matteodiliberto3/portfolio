import { Heading } from "./heading";
import { Reveal } from "./reveal";

const steps = [
  {
    n: "1",
    title: "Scoping riservato & regole d’ingaggio.",
    body: "Definiamo il perimetro esatto dei test (domini, API, ambienti di staging o produzione) e firmiamo un NDA per proteggere la riservatezza totale dei tuoi asset.",
  },
  {
    n: "2",
    title: "Offensive Testing & Proof-of-Concept.",
    body: "Simulo attacchi manuali per aggirare autenticazione, controlli di ruolo e logiche applicative. Ogni falla scoperta viene documentata con passaggi esatti di riproduzione.",
  },
  {
    n: "3",
    title: "Report di remediation & Re-Test di verifica.",
    body: "Ricevi un report manageriale sintetico e una guida tecnica per il team di sviluppo. Una volta applicate le patch, eseguo un re-test gratuito per certificare che le vulnerabilità siano chiuse.",
  },
];

export function Process() {
  return (
    <section className="act process" id="metodo" aria-labelledby="process-title">
      <Heading id="process-title" number="03" label="Metodo di lavoro" hideEyebrow>
        Tre fasi. / Zero incertezze sulla sicurezza.
      </Heading>
      <ol className="steps">
        <Reveal as="span" className="steps-rail" delay={0} />
        {steps.map((s, i) => (
          <Reveal as="li" key={s.n} className="step" delay={120 + i * 140}>
            <span className="step-n">{s.n}</span>
            <h3 className="step-title">{s.title}</h3>
            <p className="step-body">{s.body}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
