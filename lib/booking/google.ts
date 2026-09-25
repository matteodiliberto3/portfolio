import "server-only";
import { isIgnoredTitle, rules, type Interval } from "./rules";

/**
 * Minimal Google Calendar client over REST. Server-only: the refresh token
 * never leaves the server. Configured through environment variables; when
 * they are missing the booking flow runs in demo mode (see availability.ts).
 */
const env = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  /** where bookings are written */
  calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
  /**
   * every calendar that counts as "busy": the booking calendar plus any
   * others (e.g. a subscribed university timetable), comma-separated
   */
  busyCalendarIds: Array.from(
    new Set([
      process.env.GOOGLE_CALENDAR_ID ?? "primary",
      ...(process.env.GOOGLE_BUSY_CALENDAR_IDS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ]),
  ),
};

export function isConfigured() {
  return Boolean(env.clientId && env.clientSecret && env.refreshToken);
}

let cached: { token: string; exp: number } | null = null;

async function accessToken() {
  if (cached && cached.exp > Date.now() + 30_000) return cached.token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.clientId!,
      client_secret: env.clientSecret!,
      refresh_token: env.refreshToken!,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`google token ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return cached.token;
}

async function call<T>(path: string, init: RequestInit = {}) {
  const token = await accessToken();
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`google ${path} ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

type GEvent = {
  status?: string;
  summary?: string;
  transparency?: "opaque" | "transparent";
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

/**
 * Busy intervals across every configured calendar between two instants.
 * Uses the events list (not free/busy) so titles can be inspected: events
 * matching `rules.ignoreTitles` are skipped, as are all-day and "free" ones.
 *
 * Fails loudly rather than reporting an empty agenda: a calendar we cannot
 * read is not a free calendar, and pretending otherwise would offer slots
 * that are already taken. Only the extra busy calendars are optional.
 */
export async function busyBetween(fromMs: number, toMs: number): Promise<Interval[]> {
  const out: Interval[] = [];
  const timeMin = new Date(fromMs).toISOString();
  const timeMax = new Date(toMs).toISOString();

  await accessToken(); // without a token nothing below is readable

  await Promise.all(
    env.busyCalendarIds.map(async (id) => {
      let pageToken: string | undefined;
      do {
        const params = new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: "true",
          maxResults: "250",
          fields: "nextPageToken,items(status,summary,transparency,start,end)",
        });
        if (pageToken) params.set("pageToken", pageToken);
        let page: { items?: GEvent[]; nextPageToken?: string };
        try {
          page = await call(`/calendars/${encodeURIComponent(id)}/events?${params}`);
        } catch (err) {
          if (id === env.calendarId) throw err; // the booking calendar is not optional
          console.warn("[events] calendario secondario non leggibile:", id, err);
          return;
        }
        for (const e of page.items ?? []) {
          if (e.status === "cancelled") continue;
          if (e.transparency === "transparent") continue;
          if (!e.start.dateTime || !e.end.dateTime) continue; // all-day: does not block
          if (isIgnoredTitle(e.summary)) continue;
          out.push({ start: Date.parse(e.start.dateTime), end: Date.parse(e.end.dateTime) });
        }
        pageToken = page.nextPageToken;
      } while (pageToken);
    }),
  );
  return out;
}

export type NewCall = {
  startMs: number;
  endMs: number;
  name: string;
  email: string;
  topic: string;
};

/** Creates the event with the guest invited and a Meet link; Google sends the invites. */
export async function createCall(call_: NewCall) {
  const json = await call<{ id: string; hangoutLink?: string; htmlLink?: string }>(
    `/calendars/${encodeURIComponent(env.calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: `Chiamata con ${call_.name}`,
        description: call_.topic ? `Di cosa parliamo:\n${call_.topic}` : undefined,
        start: { dateTime: new Date(call_.startMs).toISOString(), timeZone: rules.timeZone },
        end: { dateTime: new Date(call_.endMs).toISOString(), timeZone: rules.timeZone },
        attendees: [{ email: call_.email, displayName: call_.name }],
        conferenceData: {
          createRequest: {
            requestId: `call-${call_.startMs}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: { useDefault: true },
        guestsCanInviteOthers: false,
      }),
    },
  );
  return { id: json.id, meet: json.hangoutLink ?? null };
}
