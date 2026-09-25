import { faqs } from "@/lib/site";
import { Heading } from "./heading";
import { Reveal } from "./reveal";

export function Faq() {
  return (
    <section className="act faq" id="domande" aria-labelledby="faq-title">
      <Heading id="faq-title" number="04" label="Domande">
        Prima di / scrivermi.
      </Heading>
      <dl className="faq-list">
        {faqs.map((item, i) => (
          <Reveal as="div" key={item.question} className="faq-item" delay={80 + i * 70}>
            <dt>{item.question}</dt>
            <dd>{item.answer}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
