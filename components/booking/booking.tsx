"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

/**
 * Booking screen: pick a day, pick a slot, leave two lines, done.
 *
 * Motion notes (animations.dev):
 * - Day and slot selection are frequent actions: highlight is instant.
 * - Panels that replace each other crossfade with an 8px directional hint
 *   (via @starting-style, no mount state), entries only; exits get out of the way.
 * - Slots stagger 25ms apart, capped, so the list never blocks interaction.
 * - Buttons: hover gated to fine pointers, press scale(0.985) at 150ms.
 */

type Availability = {
  demo: boolean;
  timeZone: string;
  slotMinutes: number;
  window: { first: string; last: string };
  days: Record<string, number[]>;
};

type Booked = { start: number; end: number; meet: string | null; demo: boolean };

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function ym(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  return ym(new Date(y, m - 1 + by, 1));
}

/** Cells for a Monday-first month grid: null = padding. */
function monthCells(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= count; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

const fmtMonth = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" });
const fmtDayLong = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return fmtMonth.format(new Date(y, m - 1, 1));
}

function dayLabel(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return fmtDayLong.format(new Date(Date.UTC(y, m - 1, d, 12)));
}

function timeLabel(ms: number, timeZone: string) {
  return new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone }).format(ms);
}

function dayLabelAt(ms: number, timeZone: string) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(ms);
}

export function Booking() {
  const [month, setMonth] = useState(() => ym(new Date()));
  const [dir, setDir] = useState<1 | -1>(1);
  const [cache, setCache] = useState<Record<string, Availability>>({});
  const [failed, setFailed] = useState<Record<string, string>>({});
  const inflight = useRef(new Set<string>());
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booked, setBooked] = useState<Booked | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const data = cache[month];
  const loadError = failed[month] ?? null;
  const loading = !data && !loadError;

  // Fetch a month once; results stay cached so going back is instant.
  useEffect(() => {
    if (cache[month] || failed[month] || inflight.current.has(month)) return;
    inflight.current.add(month);
    fetch(`/api/disponibilita?mese=${month}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("availability");
        return (await r.json()) as Availability;
      })
      .then((a) => setCache((c) => ({ ...c, [month]: a })))
      .catch(() => setFailed((f) => ({ ...f, [month]: "Non riesco a leggere il calendario." })))
      .finally(() => inflight.current.delete(month));
  }, [month, cache, failed]);

  const cells = useMemo(() => monthCells(month), [month]);
  const thisMonth = ym(new Date());
  const lastMonth = data ? data.window.last.slice(0, 7) : shiftMonth(thisMonth, 1);
  const canPrev = month > thisMonth;
  const canNext = month < lastMonth;

  const go = (by: 1 | -1) => {
    setDir(by);
    setMonth((m) => shiftMonth(m, by));
  };

  const sideRef = useRef<HTMLElement>(null);

  const pickDay = (d: string) => {
    if (day == null) track("prenota_giorno"); // first step of the funnel, once per visit
    setDay(d);
    setSlot(null);
    setSubmitError(null);
    // on a single column the slots live below the fold: bring them up
    if (window.matchMedia("(max-width: 960px)").matches) {
      requestAnimationFrame(() => sideRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  /** Arrow keys move between days; instant, no animation. */
  const onGridKey = useCallback((e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
    const step = map[e.key];
    if (!step) return;
    const current = (e.target as HTMLElement).dataset.day;
    if (!current) return;
    e.preventDefault();
    const buttons = Array.from(
      gridRef.current?.querySelectorAll<HTMLButtonElement>("button[data-day]:not(:disabled)") ?? [],
    );
    const idx = buttons.findIndex((b) => b.dataset.day === current);
    const target = buttons[Math.min(buttons.length - 1, Math.max(0, idx + Math.sign(step) * (Math.abs(step) === 7 ? 5 : 1)))];
    target?.focus();
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (slot == null || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/prenota", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ start: slot, name, email, topic, website: form.get("website") }),
      });
      const json = (await r.json()) as Partial<Booked> & { error?: string; ok?: boolean };
      if (!r.ok || !json.ok) {
        setSubmitError(json.error ?? "Qualcosa è andato storto.");
        if (r.status === 409) {
          setCache((c) => {
            const next = { ...c };
            delete next[month];
            return next;
          });
          setSlot(null);
        }
        return;
      }
      setBooked({ start: json.start!, end: json.end!, meet: json.meet ?? null, demo: Boolean(json.demo) });
      track("prenota_confermata", { demo: Boolean(json.demo) });
    } catch {
      setSubmitError("Connessione persa. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  const tz = data?.timeZone ?? "Europe/Rome";
  const slots = day && data ? data.days[day] ?? [] : [];

  if (booked) {
    return (
      <section className="bk-done" aria-live="polite">
        <p className="eyebrow">Prenotata</p>
        <h2 className="bk-done-title">
          {dayLabelAt(booked.start, tz)}
          <br />
          alle {timeLabel(booked.start, tz)}
        </h2>
        <p className="bk-done-copy">
          {booked.demo
            ? "Modalità di prova: il calendario non è collegato, nessun evento è stato creato."
            : `Ti ho mandato l’invito a ${email}. Dentro c’è il link Google Meet.`}
        </p>
        {booked.meet ? (
          <a className="text-link" href={booked.meet} target="_blank" rel="noreferrer">
            Apri il link Meet →
          </a>
        ) : null}
        <Link className="cta bk-done-cta" href="/">
          Torna al sito
        </Link>
      </section>
    );
  }

  return (
    <div className="bk">
      {/* ------- calendar ------- */}
      <section className="bk-cal" aria-label="Scegli un giorno">
        <header className="bk-cal-head">
          <button
            type="button"
            className="bk-nav"
            onClick={() => go(-1)}
            disabled={!canPrev}
            aria-label="Mese precedente"
          >
            ←
          </button>
          <h2 className="bk-month" key={month} data-dir={dir}>
            {monthLabel(month)}
          </h2>
          <button
            type="button"
            className="bk-nav"
            onClick={() => go(1)}
            disabled={!canNext}
            aria-label="Mese successivo"
          >
            →
          </button>
        </header>

        <div className="bk-weekdays" aria-hidden>
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div
          ref={gridRef}
          key={month}
          className="bk-grid"
          data-dir={dir}
          data-loading={loading || undefined}
          role="grid"
          onKeyDown={onGridKey}
        >
          {cells.map((d, i) => {
            if (!d) return <span key={`pad-${i}`} className="bk-pad" />;
            const free = data?.days[d];
            const inWindow = data ? d >= data.window.first && d <= data.window.last : false;
            const state = !data
              ? "wait"
              : !inWindow || free === undefined
                ? "off"
                : free.length === 0
                  ? "full"
                  : "open";
            const selected = d === day;
            return (
              <button
                key={d}
                type="button"
                className="bk-day"
                data-day={d}
                data-state={state}
                aria-pressed={selected}
                aria-label={`${dayLabel(d)}${state === "full" ? ", nessun orario" : ""}`}
                disabled={state !== "open"}
                onClick={() => pickDay(d)}
              >
                <span className="bk-day-n">{Number(d.slice(-2))}</span>
                {state === "open" ? <span className="bk-day-dot" aria-hidden /> : null}
              </button>
            );
          })}
        </div>

        <p className="bk-legend eyebrow" aria-hidden>
          {loadError ? loadError : data?.demo ? "Modalità di prova · orari di esempio" : "Ora italiana · 30 minuti · Google Meet"}
        </p>
      </section>

      {/* ------- side panel ------- */}
      <section ref={sideRef} className="bk-side" aria-live="polite">
        {!day ? (
          <div key="hint" className="bk-panel bk-hint">
            <p className="eyebrow">Passo 1 di 3</p>
            <p className="bk-hint-text">
              Scegli un giorno.
              <br />
              <span>Gli orari liberi compaiono qui.</span>
            </p>
          </div>
        ) : (
          <div key={day} className="bk-panel">
            <p className="eyebrow">{slot == null ? "Passo 2 di 3" : "Passo 3 di 3"}</p>
            <h3 className="bk-side-title">{dayLabel(day)}</h3>

            <div className="bk-slots" role="group" aria-label="Orari disponibili">
              {slots.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  className="bk-slot"
                  style={{ ["--i" as string]: Math.min(i, 9) }}
                  aria-pressed={slot === s}
                  onClick={() => {
                    if (slot == null) track("prenota_orario");
                    setSlot(s);
                    setSubmitError(null);
                  }}
                >
                  {timeLabel(s, tz)}
                </button>
              ))}
            </div>

            {slot != null ? (
              <form key={slot} className="bk-form" onSubmit={submit} noValidate>
                <label className="bk-field">
                  <span className="eyebrow">Nome</span>
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="bk-field">
                  <span className="eyebrow">Email</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="bk-field">
                  <span className="eyebrow">Di cosa parliamo</span>
                  <textarea
                    name="topic"
                    rows={2}
                    maxLength={600}
                    placeholder="Due righe bastano."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </label>
                <input className="bk-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden />

                {submitError ? (
                  <p className="bk-error" role="alert">
                    {submitError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="cta bk-submit"
                  disabled={submitting || name.trim().length < 2 || !email.includes("@")}
                  data-busy={submitting || undefined}
                >
                  <span key={submitting ? "busy" : "idle"} className="bk-submit-label">
                    {submitting ? "Un attimo…" : `Conferma · ${timeLabel(slot, tz)}`}
                  </span>
                </button>
              </form>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
