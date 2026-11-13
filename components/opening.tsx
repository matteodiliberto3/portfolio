import Image from "next/image";
import { Reveal } from "@/components/reveal";

export function Opening() {
  return (
    <Reveal as="section" className="act opening" aria-labelledby="opening-title">
      <div className="opening-copy">
        <h1 id="opening-title" className="display opening-title">
          <span className="line-mask">
            <span className="line intro-line" style={{ ["--i" as string]: 1 }}>
              La sicurezza del software
            </span>
          </span>
          <span className="line-mask">
            <span className="line intro-line" style={{ ["--i" as string]: 2 }}>
              si misura contro un attaccante reale.
            </span>
          </span>
        </h1>
        <p className="lede intro-line" style={{ ["--i" as string]: 3 }}>
          Conduco penetration test manuali, audit del codice e hardening infrastrutturale
          per team che trattano flussi e dati critici. Niente report generati da scanner
          automatici: proof-of-concept documentati, matrici di rischio concrete e supporto
          diretto agli sviluppatori per risolvere le vulnerabilità prima del rilascio.
        </p>
        <a className="cta intro-line" style={{ ["--i" as string]: 4 }} href="#contatto">
          Richiedi un assessment di sicurezza
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
          Scorri per saperne di più
        </figcaption>
      </figure>
    </Reveal>
  );
}
