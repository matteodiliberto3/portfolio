"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  getDictionary,
  INTL_LOCALE,
  LOCALE_COOKIE,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  intlLocale: string;
  t: Dictionary;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      startTransition(() => {
        router.refresh();
      });
    },
    [locale, router],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      intlLocale: INTL_LOCALE[locale],
      t: getDictionary(locale),
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <LocaleProvider>");
  }
  return ctx;
}
