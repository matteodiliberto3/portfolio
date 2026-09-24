import Image from "next/image";
import { Reveal } from "@/components/reveal";

export function Opening() {
  return (
    <Reveal as="section" className="act opening" aria-labelledby="opening-title">
      <div className="opening-copy">
        <h1 id="opening-title" className="display">
          <span className="line-mask">
            <span className="line intro-line" style={{ ["--i" as string]: 1 }}>
              Matteo
            </span>
          </span>
          <span className="line-mask">
            <span className="line intro-line" style={{ ["--i" as string]: 2 }}>
              Di Liberto
            </span>
          </span>
        </h1>
        <p className="lede intro-line" style={{ ["--i" as string]: 3 }}>
          Disegno la pagina e scrivo il codice che la fa funzionare. Sotto ci
          sono cinque cose online: si aprono, si usano, si comprano.
        </p>
        <a className="cta intro-line" style={{ ["--i" as string]: 4 }} href="#contatto">
          Parliamo del tuo progetto
        </a>
      </div>

      <figure className="opening-portrait">
        <div className="portrait-mask">
          <Image
            src="/portrait.jpg"
            alt="Matteo Di Liberto, ritratto"
            fill
            priority
            sizes="(max-width: 960px) 70vw, 38vw"
          />
        </div>
        <figcaption className="eyebrow intro-line" style={{ ["--i" as string]: 5 }}>
          Scorri per vedere i lavori
        </figcaption>
      </figure>
    </Reveal>
  );
}
