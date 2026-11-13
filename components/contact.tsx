import Link from "next/link";
import { Heading } from "./heading";
import { Reveal } from "./reveal";

const PHONE_NUMBER = "tel:+393711500055";

export function Contact() {
  return (
    <section className="act contact" id="contatto" aria-labelledby="contact-title">
      <Heading
        id="contact-title"
        number="04"
        label="Contatto"
        className="heading-contact"
        accentFrom={4}
        hideEyebrow
      >
        I tuoi sistemi meritano / difese all’altezza.
      </Heading>
      <Reveal className="contact-actions" delay={160}>
        <a className="cta" href={PHONE_NUMBER}>
          Contattami direttamente
        </a>
        <Link className="text-link" href="/prenota">
          Prenota una sessione tecnica
        </Link>
      </Reveal>
      <Reveal as="p" className="colophon" delay={240}>
        Matteo Di Liberto · Varese · {new Date().getFullYear()}
      </Reveal>
    </section>
  );
}
