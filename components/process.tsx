import { Heading } from "./heading";
import { Reveal } from "./reveal";

const steps = [
  {
    n: "1",
    title: "Una chiamata, trenta minuti.",
    body: "Mi racconti della tua attività e dei tuoi obiettivi: individuiamo insieme la soluzione ideale, con chiarezza e senza gergo tecnico.",
  },
  {
    n: "2",
    title: "Un’anteprima concreta, subito navigabile.",
    body: "In pochi giorni vedi nascere il sito su uno spazio di prova riservato. Testiamo insieme l’esperienza d’uso e affiniamo ogni dettaglio prima del lancio.",
  },
  {
    n: "3",
    title: "Online, con le chiavi in mano.",
    body: "Mi occupo io di dominio, hosting e configurazioni tecniche. A lavoro concluso hai la piena ed esclusiva proprietà di tutto, senza vincoli né costi nascosti.",
  },
];

export function Process() {
  return (
    <section className="act process" id="metodo" aria-labelledby="process-title">
      <Heading id="process-title" number="03" label="Come lavoro" hideEyebrow>
        Tre passi. / Nessun salto nel vuoto.
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
