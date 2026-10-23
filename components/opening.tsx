import Image from "next/image";
import { Reveal } from "@/components/reveal";

export function Opening() {
  return (
    <Reveal as="section" className="act opening" aria-labelledby="opening-title">
      <div className="opening-copy">
        <p className="eyebrow opening-eyebrow intro-line" style={{ ["--i" as string]: 1 }}>
          Matteo Di Liberto · Design &amp; Sviluppo Web
        </p>
        <h1 id="opening-title" className="display opening-title">
          <span className="line-mask">
            <span className="line intro-line" style={{ ["--i" as string]: 2 }}>
              Il tuo lavoro ha una storia.
            </span>
          </span>
          <span className="line-mask">
            <span className="line intro-line" style={{ ["--i" as string]: 3 }}>
              Costruiamo il sito che la racconta nel modo giusto.
            </span>
          </span>
        </h1>
        <p className="lede intro-line" style={{ ["--i" as string]: 4 }}>
          Niente template preconfezionati o passaggi di mano. Disegno l’interfaccia e scrivo
          ogni riga di codice su misura per dare alla tua attività una presenza online veloce,
          solida e autorevole.
        </p>
        <a className="cta intro-line" style={{ ["--i" as string]: 5 }} href="#contatto">
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
        <figcaption className="eyebrow intro-line" style={{ ["--i" as string]: 6 }}>
          Scorri per saperne di più
        </figcaption>
      </figure>
    </Reveal>
  );
}
