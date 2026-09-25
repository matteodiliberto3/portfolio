"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/** Marks the bar hidden before the next page paints, and skips the smooth hash scroll. */
export function BackHome({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Link
      className={className}
      href="/#contatto"
      scroll={false}
      onClick={() => {
        const html = document.documentElement;
        html.dataset.navAway = "";
        html.dataset.scrollBehavior = "auto";
        html.style.scrollBehavior = "auto";
      }}
    >
      {children}
    </Link>
  );
}
