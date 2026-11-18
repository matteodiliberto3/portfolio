export const LOCALES = ["it", "en", "de"] as const;

export type Locale = (typeof LOCALES)[number];

/** Default fallback when the browser prefers an unsupported language. */
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "site-locale";

export const INTL_LOCALE: Record<Locale, string> = {
  it: "it-IT",
  en: "en-GB",
  de: "de-DE",
};

export const OG_LOCALE: Record<Locale, string> = {
  it: "it_IT",
  en: "en_US",
  de: "de_DE",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Parses an HTTP Accept-Language header in quality-priority order.
 * Supports IT and DE explicitly and falls back to EN for all other languages.
 */
export function resolveAcceptLanguage(headerValue: string | null | undefined): Locale {
  if (!headerValue) return DEFAULT_LOCALE;

  const parsed = headerValue
    .split(",")
    .map((part, index) => {
      const segments = part.trim().split(";");
      const tag = (segments[0] ?? "").toLowerCase();
      let q = 1;
      for (let i = 1; i < segments.length; i++) {
        const s = segments[i].trim();
        if (s.startsWith("q=")) {
          const val = Number.parseFloat(s.slice(2));
          if (!Number.isNaN(val)) q = val;
        }
      }
      return { tag, q, index };
    })
    .filter((entry) => entry.tag && entry.tag !== "*" && entry.q > 0)
    .sort((a, b) => (b.q !== a.q ? b.q - a.q : a.index - b.index));

  for (const { tag } of parsed) {
    const base = tag.split("-")[0];
    if (base === "it") return "it";
    if (base === "de") return "de";
    if (base === "en") return "en";
  }

  return DEFAULT_LOCALE;
}
