"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, type ReactNode } from "react";

const MOVE_KEY = "page-move";

/** Plays the arrival on the first paint, and releases the held intro after it scrolls away. */
export function ViewTransitionBridge() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const html = document.documentElement;
    let direction: string | null = null;
    try {
      direction = sessionStorage.getItem(MOVE_KEY);
      if (direction) sessionStorage.removeItem(MOVE_KEY);
    } catch {
      direction = null;
    }
    if (direction !== "forward" && direction !== "back") return;
    html.dataset.arrive = direction;
    html.dataset.scrollBehavior = "smooth";
    const timer = window.setTimeout(() => {
      delete html.dataset.arrive;
    }, 360);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;
    const section = document.querySelector(".opening");
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) delete document.documentElement.dataset.introHold;
      },
      { rootMargin: "12% 0px 12% 0px", threshold: 0 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}

type PageLinkProps = {
  href: string;
  direction: "forward" | "back";
  className?: string;
  children: ReactNode;
};

export function PageLink({ href, direction, className, children }: PageLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        const html = document.documentElement;
        html.dataset.scrollBehavior = "auto";
        if (direction === "back") html.dataset.introHold = "";
        try {
          sessionStorage.setItem(MOVE_KEY, direction);
        } catch {
          /* arrival still happens, just without the enter */
        }
        router.push(href);
      }}
    >
      {children}
    </Link>
  );
}
