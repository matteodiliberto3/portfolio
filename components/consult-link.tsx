"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ARROW_LEAVE = "consult-arrow-leave";
const LATEST = 900; // if the arrow never reports back, leave anyway

export function ConsultLink() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const left = useRef(false);
  const failsafe = useRef(0);

  /* The page swaps the instant the arrow lands, so the click reads as one
   * gesture: the arrow leaves, and what it points at is already there. */
  const leave = () => {
    if (left.current) return;
    left.current = true;
    window.clearTimeout(failsafe.current);
    router.push("/prenota");
  };

  useEffect(() => () => window.clearTimeout(failsafe.current), []);

  return (
    <Link
      className="faq-consult"
      href="/prenota"
      data-leaving={leaving || undefined}
      onPointerEnter={() => router.prefetch("/prenota")}
      onFocus={() => router.prefetch("/prenota")}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          leaving
        ) {
          return;
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        event.preventDefault();
        setLeaving(true);
        failsafe.current = window.setTimeout(leave, LATEST);
      }}
      onAnimationEnd={(event) => {
        if (event.animationName === ARROW_LEAVE) leave();
      }}
    >
      <span className="faq-consult-label">Prenota una consulenza</span>
      <span className="faq-consult-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
