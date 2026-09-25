import { Heading } from "./heading";
import { Reveal } from "./reveal";

const steps = [
  {
    n: "1",
    title: "Una chiamata, trenta minuti.",
    body: "Mi racconti di cosa hai bisogno e io ti consiglio come realizzarlo.",
  },
  {
    n: "2",
    title: "Il primo prodotto in poco tempo.",
    body: "Potrai vedere un’anteprima del tuo prodotto, per capire se la direzione presa è quella giusta.",
  },
  {
    n: "3",
    title: "Online, con le chiavi in mano.",
    body: "Dominio, hosting ed è tutto tuo.",
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
