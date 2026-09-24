/**
 * Booking rules. Everything the availability engine needs that is not on the
 * calendar: when calls are accepted, how long they last, how much air sits
 * between them. Times are wall-clock in `timeZone`.
 */
export const rules = {
  timeZone: "Europe/Rome",
  /** 0 = Sunday … 6 = Saturday */
  workDays: [1, 2, 3, 4, 5],
  /** wall-clock window, inclusive start / exclusive end */
  dayStart: { h: 9, m: 30 },
  dayEnd: { h: 18, m: 0 },
  slotMinutes: 30,
  /** air kept around existing events */
  bufferMinutes: 15,
  /** earliest bookable moment from now */
  minNoticeHours: 24,
  /** how far ahead a call can be booked */
  horizonDays: 45,
  /**
   * Events whose title contains one of these (case-insensitive) do not block
   * slots: commitments you are willing to skip for a call.
   */
  ignoreTitles: ["software project management"],
} as const;

export function isIgnoredTitle(summary: string | undefined) {
  const s = (summary ?? "").toLowerCase();
  return rules.ignoreTitles.some((t) => s.includes(t));
}

export type Interval = { start: number; end: number };

const MIN = 60_000;

/** Offset (ms) of `timeZone` relative to UTC at a given instant. */
function tzOffsetMs(at: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(at).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - at.getTime();
}

/** UTC instant for a wall-clock time on a calendar day in `timeZone`. */
export function zonedToUtc(day: string, h: number, m: number, timeZone = rules.timeZone) {
  const [y, mo, d] = day.split("-").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, m);
  let utc = guess - tzOffsetMs(new Date(guess), timeZone);
  const second = tzOffsetMs(new Date(utc), timeZone);
  if (guess - second !== utc) utc = guess - second;
  return utc;
}

/** YYYY-MM-DD of an instant, as seen in `timeZone`. */
export function dayOf(at: number | Date, timeZone = rules.timeZone) {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(at);
}

export function addDays(day: string, n: number) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function weekday(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isWorkDay(day: string) {
  return (rules.workDays as readonly number[]).includes(weekday(day));
}

/** Bookable window as calendar days in the rules' time zone. */
export function bookableWindow(now = Date.now()) {
  const first = dayOf(now + rules.minNoticeHours * 60 * MIN);
  const last = addDays(dayOf(now), rules.horizonDays);
  return { first, last };
}

/**
 * Free slot starts (UTC ms) for one calendar day, given busy intervals.
 * Applies the buffer around busy blocks and the minimum notice.
 */
export function freeSlots(day: string, busy: Interval[], now = Date.now()) {
  if (!isWorkDay(day)) return [];
  const notBefore = now + rules.minNoticeHours * 60 * MIN;
  const slot = rules.slotMinutes * MIN;
  const buffer = rules.bufferMinutes * MIN;
  const open = zonedToUtc(day, rules.dayStart.h, rules.dayStart.m);
  const close = zonedToUtc(day, rules.dayEnd.h, rules.dayEnd.m);

  const out: number[] = [];
  for (let start = open; start + slot <= close; start += slot) {
    if (start < notBefore) continue;
    const end = start + slot;
    const clash = busy.some((b) => start < b.end + buffer && end > b.start - buffer);
    if (!clash) out.push(start);
  }
  return out;
}
