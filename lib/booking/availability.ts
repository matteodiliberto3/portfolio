import "server-only";
import { busyBetween, isConfigured } from "./google";
import { addDays, bookableWindow, freeSlots, isWorkDay, zonedToUtc, type Interval } from "./rules";

/**
 * Demo busy pattern used when Google is not configured: a deterministic
 * handful of blocks per day so the UI shows realistic gaps and full days.
 */
function demoBusy(day: string): Interval[] {
  let h = 0;
  for (const c of day) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const blocks: Interval[] = [];
  const picks = [(h % 5) + 1, ((h >> 3) % 6) + 3, ((h >> 6) % 7) + 6];
  for (const p of picks) {
    const start = zonedToUtc(day, 9, 30) + p * 30 * 60_000;
    blocks.push({ start, end: start + 45 * 60_000 });
  }
  if (h % 9 === 0) blocks.push({ start: zonedToUtc(day, 9, 0), end: zonedToUtc(day, 18, 30) });
  return blocks;
}

async function busyFor(fromDay: string, toDay: string) {
  const fromMs = zonedToUtc(fromDay, 0, 0);
  const toMs = zonedToUtc(addDays(toDay, 1), 0, 0);
  if (isConfigured()) return busyBetween(fromMs, toMs);
  const out: Interval[] = [];
  for (let d = fromDay; d <= toDay; d = addDays(d, 1)) out.push(...demoBusy(d));
  return out;
}

export type Availability = {
  demo: boolean;
  window: { first: string; last: string };
  /** day -> free slot starts as UTC ms */
  days: Record<string, number[]>;
};

/** Free slots for every bookable day inside a calendar month (YYYY-MM). */
export async function monthAvailability(month: string, now = Date.now()): Promise<Availability> {
  const window = bookableWindow(now);
  const monthFirst = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const monthLast = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);

  const from = monthFirst > window.first ? monthFirst : window.first;
  const to = monthLast < window.last ? monthLast : window.last;

  const days: Record<string, number[]> = {};
  if (from > to) return { demo: !isConfigured(), window, days };

  const busy = await busyFor(from, to);
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (!isWorkDay(d)) continue;
    days[d] = freeSlots(d, busy, now);
  }
  return { demo: !isConfigured(), window, days };
}

/** True if `startMs` is a free slot right now (re-checked against the calendar). */
export async function isSlotFree(day: string, startMs: number, now = Date.now()) {
  const window = bookableWindow(now);
  if (day < window.first || day > window.last) return false;
  const busy = await busyFor(day, day);
  return freeSlots(day, busy, now).includes(startMs);
}
