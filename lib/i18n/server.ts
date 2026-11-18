import "server-only";
import { cookies, headers } from "next/headers";
import { isLocale, LOCALE_COOKIE, resolveAcceptLanguage, type Locale } from "./config";

/**
 * Resolves the active locale for the current request:
 * 1. Explicit user preference saved in cookie
 * 2. Browser Accept-Language detection (IT / DE / fallback EN)
 */
export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const saved = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;

  const headerStore = await headers();
  return resolveAcceptLanguage(headerStore.get("accept-language"));
}
