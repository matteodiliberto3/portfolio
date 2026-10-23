import { Heading } from "./heading";
import { Reveal } from "./reveal";

const facts = [
  {
    k: "01",
    title: "Un unico interlocutore, zero attriti.",
    body: "Progetto il design e scrivo il codice in prima persona. Niente rimpalli tra grafico e programmatore: quello che decidiamo insieme in bozza è esattamente ciò che va online.",
  },
  {
    k: "02",
    title: "Rigore ingegneristico, applicato alla tua attività.",
    body: "Sviluppo piattaforme tecnologiche complesse e porto quella stessa solidità e cura nei siti di studi professionali, attività ricettive e imprese che vogliono distinguersi.",
  },
  {
    k: "03",
    title: "Veloce, sicuro e senza manutenzione continua.",
    body: "Niente siti appesantiti da decine di plugin fragili che si rompono a ogni aggiornamento. Scrivo codice pulito e sicuro fin dalle fondamenta perché il tuo sito si carichi in un istante e duri nel tempo.",
  },
];

export function About() {
  return (
    <section className="act about" id="chi-sono" aria-labelledby="about-title">
      <Heading id="about-title" number="01" label="Chi sono" inkAt={2} hideEyebrow>
        Dalla prima bozza / al sito online.
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
