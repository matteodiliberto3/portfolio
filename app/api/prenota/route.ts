import type { NextRequest } from "next/server";
import { isSlotFree } from "@/lib/booking/availability";
import { createCall, isConfigured } from "@/lib/booking/google";
import { allow, clientKey } from "@/lib/booking/rate-limit";
import { dayOf, rules } from "@/lib/booking/rules";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Body = {
  start?: unknown;
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  /** honeypot: real users never fill it */
  website?: unknown;
};

function str(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** POST /api/prenota → books one slot on the calendar and invites the guest. */
export async function POST(req: NextRequest) {
  if (!allow(`book:${clientKey(req)}`, 5, 60 * 60_000)) {
    return Response.json({ error: "Troppe prenotazioni da questo indirizzo." }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Richiesta non leggibile." }, { status: 400 });
  }

  if (str(body.website, 10)) return Response.json({ ok: true }); // bot fed, nothing created

  const startMs = typeof body.start === "number" ? body.start : Number.NaN;
  const name = str(body.name, 80);
  const email = str(body.email, 120);
  const topic = str(body.topic, 600);

  if (!Number.isFinite(startMs) || startMs % 60_000 !== 0) {
    return Response.json({ error: "Orario non valido." }, { status: 400 });
  }
  if (name.length < 2) return Response.json({ error: "Manca il nome." }, { status: 400 });
  if (!EMAIL.test(email)) return Response.json({ error: "Email non valida." }, { status: 400 });

  const day = dayOf(startMs);
  try {
    if (!(await isSlotFree(day, startMs))) {
      return Response.json(
        { error: "Questo orario è appena stato preso. Scegline un altro." },
        { status: 409 },
      );
    }
    const endMs = startMs + rules.slotMinutes * 60_000;
    if (!isConfigured()) {
      return Response.json({ ok: true, demo: true, start: startMs, end: endMs, meet: null });
    }
    const created = await createCall({ startMs, endMs, name, email, topic });
    return Response.json({ ok: true, demo: false, start: startMs, end: endMs, meet: created.meet });
  } catch (err) {
    console.error("[prenota]", err);
    return Response.json({ error: "Non sono riuscito a scrivere sul calendario." }, { status: 502 });
  }
}
