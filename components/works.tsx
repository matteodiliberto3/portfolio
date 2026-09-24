import Image from "next/image";
import type { Project } from "@/lib/projects";
import { Heading } from "./heading";
import { Reveal } from "./reveal";

export function Works({ projects }: { projects: Project[] }) {
  return (
    <section className="act works" id="lavori" aria-labelledby="works-title">
      <Heading id="works-title" number="02" label="Lavori" hideEyebrow>
        Alcuni dei / miei lavori.
      </Heading>

      <ol className="work-list">
        {projects.map((p, i) => (
          <li key={p.slug} className="work" data-flip={i % 2 === 1 ? "true" : "false"}>
            <Reveal className="work-media" delay={0}>
              <a
                className="work-frame"
                href={p.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Apri ${p.title} in una nuova scheda`}
              >
                <Image
                  src={p.still}
                  alt={`Schermata di ${p.title}`}
                  fill
                  sizes="(max-width: 960px) 100vw, 60vw"
                  className="work-img"
                />
                <span className="work-curtain" aria-hidden />
              </a>
            </Reveal>

            <div className="work-copy">
              <Reveal as="p" className="work-index" delay={120}>
                {p.index}
              </Reveal>
              <Reveal as="h3" className="work-title" delay={180}>
                <a href={`/lavori/${p.slug}`}>{p.title}</a>
              </Reveal>
              <Reveal as="p" className="work-summary" delay={260}>
                {p.summary}
              </Reveal>
              <Reveal className="work-meta" delay={340}>
                <span className="chip">{p.kind}</span>
                <span className="chip" data-status={p.status}>
                  <span className="dot" aria-hidden />
                  {p.status === "live" ? "Online" : "In avvio"}
                </span>
                <a className="text-link" href={p.href} target="_blank" rel="noreferrer">
                  Apri il sito ↗
                </a>
              </Reveal>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
