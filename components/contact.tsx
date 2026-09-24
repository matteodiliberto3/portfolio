import Link from "next/link";
import { Heading } from "./heading";
import { Reveal } from "./reveal";

const GITHUB = "https://github.com/matteodiliberto3";

export function Contact() {
  return (
    <section className="act contact" id="contatto" aria-labelledby="contact-title">
      <Heading
        id="contact-title"
        number="04"
        label="Contatto"
        className="heading-contact"
        accentFrom={3}
        hideEyebrow
      >
        Hai un’idea? / Mettiamola online.
      </Heading>
      <Reveal className="contact-actions" delay={160}>
        <a className="cta" href={GITHUB}>
          Scrivimi
        </a>
        <Link className="text-link" href="/prenota">
          Prenota una chiamata →
        </Link>
      </Reveal>
      <Reveal as="p" className="colophon" delay={240}>
        Matteo Di Liberto · Palermo · {new Date().getFullYear()}
      </Reveal>
    </section>
  );
}
