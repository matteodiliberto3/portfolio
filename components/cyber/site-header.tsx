"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowIcon } from "@/components/cyber/arrow-icon";

const NAV_ITEMS = [
  { key: "home", label: "Home", href: "/" },
  { key: "per-chi", label: "Per chi", href: "/per-chi" },
  { key: "metodologia", label: "Metodo", href: "/metodologia" },
] as const;

export function SiteHeader({
  active,
  hideOnScrollMiddle = false,
}: {
  active: "home" | "per-chi" | "metodologia";
  hideOnScrollMiddle?: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!hideOnScrollMiddle) return;

    let rafId = 0;

    const evaluate = () => {
      rafId = 0;
      const goDeeper = document.getElementById("go-deeper");
      const targetSection = document.getElementById("a-chi-mi-rivolgo");
      if (!goDeeper || !targetSection) return;

      const vh = window.innerHeight;
      const enteredMiddle = goDeeper.getBoundingClientRect().top <= vh * 0.3;
      const reachedTarget = targetSection.getBoundingClientRect().top <= vh * 0.45;

      setHidden(enteredMiddle && !reachedTarget);
    };

    const scheduleCheck = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(evaluate);
    };

    scheduleCheck();
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
    };
  }, [hideOnScrollMiddle]);

  const isHidden = hideOnScrollMiddle && hidden;

  useEffect(() => {
    const el = headerRef.current as (HTMLElement & { inert?: boolean }) | null;
    if (el) {
      el.inert = isHidden;
    }
  }, [isHidden]);

  return (
    <header
      ref={headerRef}
      className="cyber-topbar"
      data-hidden={isHidden ? "true" : undefined}
      aria-hidden={isHidden || undefined}
    >
      <Link href="/" className="cyber-brand">
        MATTEO DI LIBERTO
      </Link>

      <div className="cyber-topbar-right">
        <nav className="cyber-nav" aria-label="Navigazione principale">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className="cyber-nav-link"
                data-active={isActive ? "true" : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/prenota" className="cyber-topbar-cta">
          PRENOTA UN PRIMO CONFRONTO
          <ArrowIcon direction="right" />
        </Link>
      </div>
    </header>
  );
}
