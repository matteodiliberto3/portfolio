"use client";

import { PageLink } from "@/components/page-link";
import { useEffect, useRef, useState } from "react";

/* Once the reader is inside the story the bar steps aside, and comes back on the
 * first scroll up: the sections stay one gesture away instead of being lost. */
const STORY_STARTS = 0.9; // viewports to scroll before the bar may leave
const INTENT = 12; // px travelled in one direction before it reacts

export function SiteNav() {
  const [hidden, setHidden] = useState(false);
  const mark = useRef(0);

  useEffect(() => {
    const pastStory = () => window.scrollY > window.innerHeight * STORY_STARTS;

    // A return from another page can land already inside the story, with no
    // scroll gesture. The bar should be gone in that case, same as if the
    // reader had scrolled there.
    mark.current = window.scrollY;
    setHidden(pastStory());

    let frame = 0;

    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const travel = y - mark.current;
      if (Math.abs(travel) < INTENT) return; // a nudge is not a decision
      mark.current = y;
      setHidden(travel > 0 && y > window.innerHeight * STORY_STARTS);
    };

    const onScroll = () => {
      frame ||= requestAnimationFrame(read);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav className="nav" aria-label="Sezioni" data-hidden={hidden || undefined} inert={hidden}>
      <a className="nav-name" href="#top">
        M. Di Liberto
      </a>
      <ul className="nav-links">
        <li>
          <a href="#chi-sono">Chi sono</a>
        </li>
        <li>
          <a href="#lavori">Lavori</a>
        </li>
        <li>
          <a href="#metodo">Metodo</a>
        </li>
        <li>
          <PageLink href="/domande" direction="forward">
            Domande
          </PageLink>
        </li>
        <li>
          <a className="nav-cta" href="#contatto">
            Scrivimi
          </a>
        </li>
      </ul>
    </nav>
  );
}
