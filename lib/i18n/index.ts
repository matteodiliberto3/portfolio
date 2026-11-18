import { de } from "./dictionaries/de";
import { en } from "./dictionaries/en";
import { it } from "./dictionaries/it";
import type { Dictionary } from "./dictionaries/types";
import type { Locale } from "./config";

const DICTIONARIES: Record<Locale, Dictionary> = {
  it,
  en,
  de,
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES.en;
}

export * from "./config";
export type { BuyerSegmentCopy, Dictionary } from "./dictionaries/types";
