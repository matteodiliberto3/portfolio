"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowIcon } from "@/components/cyber/arrow-icon";
import { LanguageSwitcher } from "@/components/cyber/language-switcher";
import { FixedLocaleLabel } from "@/components/i18n/fixed-locale-label";
import { useI18n } from "@/components/i18n/locale-provider";
import { getDictionary, LOCALES } from "@/lib/i18n";

const NAV_ROUTES = [
  { key: "home", href: "/" },
  { key: "perChi", href: "/per-chi" },
  { key: "metodologia", href: "/metodologia" },
] as const;

const ALL_NAV_LABELS = {
  home: LOCALES.map((l) => getDictionary(l).header.nav.home),
  perChi: LOCALES.map((l) => getDictionary(l).header.nav.perChi),
  metodologia: LOCALES.map((l) => getDictionary(l).header.nav.metodologia),
} as const;

const ALL_CTA_LABELS = LOCALES.map((l) => getDictionary(l).header.cta);

export function SiteHeader({
  active,
  hideOnScrollMiddle = false,
}: {
  active: "home" | "per-chi" | "metodologia";
  hideOnScrollMiddle?: boolean;
}) {
  const { t } = useI18n();
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

  const activeRouteKey = active === "per-chi" ? "perChi" : active;

  return (
    <header
      ref={headerRef}
      className="cyber-topbar"
      data-hidden={isHidden ? "true" : undefined}
      aria-hidden={isHidden || undefined}
    >
      <Link href="/" className="cyber-brand">
        {t.header.brand}
      </Link>

      <div className="cyber-topbar-right">
        <nav className="cyber-nav" aria-label={t.header.navAriaLabel}>
          {NAV_ROUTES.map((item) => {
            const isActive = activeRouteKey === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className="cyber-nav-link"
                data-active={isActive ? "true" : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <FixedLocaleLabel
                  values={ALL_NAV_LABELS[item.key]}
                  active={t.header.nav[item.key]}
                  align="center"
                  activeClassName="cyber-nav-text"
                />
              </Link>
            );
          })}
        </nav>

        <Link href="/prenota" className="cyber-topbar-cta">
          <FixedLocaleLabel values={ALL_CTA_LABELS} active={t.header.cta} align="center" />
          <ArrowIcon direction="right" />
        </Link>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
