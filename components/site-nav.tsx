"use client";

import { PageLink } from "@/components/page-link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/* Once the reader is inside the story the bar steps aside, and comes back on the
 * first scroll up: the sections stay one gesture away instead of being lost. */
const STORY_STARTS = 0.9; // viewports to scroll before the bar may leave
const INTENT = 12; // px travelled in one direction before it reacts

export function SiteNav() {
  const [hidden, setHidden] = useState(false);
  const [instant, setInstant] = useState(false);
  const mark = useRef(0);

  useLayoutEffect(() => {
    const storyLine = () => window.innerHeight * STORY_STARTS;
    const hash = window.location.hash;
    let targetTop = 0;
    const target =
      hash && hash !== "#top"
        ? document.getElementById(decodeURIComponent(hash.slice(1)))
        : null;
    if (target) targetTop = target.getBoundingClientRect().top + window.scrollY;
    // Born hidden when the landing spot is already inside the story. Doing this
    // before paint skips the frame where the bar is visible and then slides away.
    const html = document.documentElement;
    delete html.dataset.navAway;
    html.dataset.scrollBehavior = "smooth";
    html.style.scrollBehavior = "";
    if (target) target.scrollIntoView();
    const y = window.scrollY;
    mark.current = y;
    if (y <= storyLine() && targetTop <= storyLine()) return;
    setHidden(true);
    setInstant(true);
  }, []);

  useEffect(() => {
    if (!instant) return;
    const frame = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(frame);
  }, [instant]);

  useEffect(() => {
    const pastStory = () => window.scrollY > window.innerHeight * STORY_STARTS;
    let frame = 0;

    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const travel = y - mark.current;
      if (Math.abs(travel) < INTENT) return;
      mark.current = y;
      setHidden(travel > 0 && pastStory());
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
    <nav
      className="nav"
      aria-label="Sezioni"
      data-hidden={hidden || undefined}
      data-instant={instant || undefined}
      inert={hidden}
    >
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
