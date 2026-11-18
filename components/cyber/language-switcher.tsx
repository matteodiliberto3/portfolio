"use client";

import type { CSSProperties } from "react";
import { LOCALES } from "@/lib/i18n";
import { useI18n } from "@/components/i18n/locale-provider";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const activeIndex = Math.max(0, LOCALES.indexOf(locale));

  return (
    <div
      role="group"
      aria-label={t.lang.switcherLabel}
      className={className ? `cyber-lang-switch ${className}` : "cyber-lang-switch"}
      style={{ ["--lang-idx" as string]: activeIndex } as CSSProperties}
    >
      <div className="cyber-lang-track">
        {LOCALES.map((code) => {
          const active = locale === code;
          return (
            <button
              key={code}
              type="button"
              className="cyber-lang-btn"
              aria-pressed={active}
              title={t.lang.names[code]}
              lang={code}
              onClick={() => setLocale(code)}
            >
              {code.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Livello duplicato tagliato via clip-path per continuità spaziale fluida */}
      <div aria-hidden="true" className="cyber-lang-overlay">
        {LOCALES.map((code) => (
          <span key={code} className="cyber-lang-btn cyber-lang-btn-active">
            {code.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
