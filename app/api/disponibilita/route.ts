import type { NextRequest } from "next/server";
import { monthAvailability } from "@/lib/booking/availability";
import { allow, clientKey } from "@/lib/booking/rate-limit";
import { rules } from "@/lib/booking/rules";
import { getDictionary } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** GET /api/disponibilita?mese=YYYY-MM → free slots per day for that month. */
export async function GET(req: NextRequest) {
  const locale = await getRequestLocale();
  const errCopy = getDictionary(locale).booking.apiErrors;

  if (!allow(`disp:${clientKey(req)}`, 60, 60_000)) {
    return Response.json(
      { error: errCopy.rateLimitDisp, errorCode: "rateLimitDisp" },
      { status: 429 },
    );
  }
  const month = req.nextUrl.searchParams.get("mese") ?? "";
  if (!MONTH.test(month)) {
    return Response.json(
      { error: errCopy.invalidMonth, errorCode: "invalidMonth" },
      { status: 400 },
    );
  }
  try {
    const data = await monthAvailability(month);
    return Response.json(
      { ...data, timeZone: rules.timeZone, slotMinutes: rules.slotMinutes },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    console.error("[disponibilita]", err);
    return Response.json(
      { error: errCopy.calUnreachable, errorCode: "calUnreachable" },
      { status: 502 },
    );
  }
}
