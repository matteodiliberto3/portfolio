import type { NextRequest } from "next/server";
import { monthAvailability } from "@/lib/booking/availability";
import { allow, clientKey } from "@/lib/booking/rate-limit";
import { rules } from "@/lib/booking/rules";

export const dynamic = "force-dynamic";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** GET /api/disponibilita?mese=YYYY-MM → free slots per day for that month. */
export async function GET(req: NextRequest) {
  if (!allow(`disp:${clientKey(req)}`, 60, 60_000)) {
    return Response.json({ error: "Troppe richieste." }, { status: 429 });
  }
  const month = req.nextUrl.searchParams.get("mese") ?? "";
  if (!MONTH.test(month)) {
    return Response.json({ error: "Mese non valido." }, { status: 400 });
  }
  try {
    const data = await monthAvailability(month);
    return Response.json(
      { ...data, timeZone: rules.timeZone, slotMinutes: rules.slotMinutes },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    console.error("[disponibilita]", err);
    return Response.json({ error: "Calendario non raggiungibile." }, { status: 502 });
  }
}
