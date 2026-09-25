import { Heading } from "./heading";
import { Reveal } from "./reveal";

const facts = [
  {
    k: "01",
    title: "Faccio la pagina e il codice.",
    body: "Un solo interlocutore dalla bozza al sito. Niente passaggi tra chi disegna e chi sviluppa.",
  },
  {
    k: "02",
    title: "Per attività vere e per prodotti miei.",
    body: "Un B&B a Palermo, uno studio legale a Busto Arsizio. E dall’altra parte un hub tecnico e un motore quantitativo.",
  },
  {
    k: "03",
    title: "Con un occhio alla sicurezza.",
    body: "Cookie httpOnly, rate limit, CSP: nel Teaching Hub li spiego. Nei siti dei clienti li metto.",
  },
];

export function About() {
  return (
    <section className="act about" id="chi-sono" aria-labelledby="about-title">
      <Heading id="about-title" number="01" label="Chi sono" inkAt={1} hideEyebrow>
        Dallo schizzo / all’opera d’arte.
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
