"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { ArrowIcon } from "@/components/cyber/arrow-icon";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

const PHONE_NUMBER = "tel:+393711500055";
const PHONE_DISPLAY = "+39 371 150 0055";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Availability = {
  demo: boolean;
  timeZone: string;
  slotMinutes: number;
  window: { first: string; last: string };
  days: Record<string, number[]>;
};

type Booked = { start: number; end: number; meet: string | null; demo: boolean };

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const STEPS = [
  { num: "01", label: "GIORNO" },
  { num: "02", label: "ORARIO" },
  { num: "03", label: "DETTAGLI" },
] as const;

const HOW_IT_WORKS = [
  {
    code: "01",
    title: "Inquadriamo il contesto",
    body: "Mi racconti quali software, accessi o applicazioni sostengono la tua attività e che cosa vuoi proteggere.",
  },
  {
    code: "02",
    title: "Distinguiamo le priorità",
    body: "Capiamo insieme se ci sono rischi concreti da verificare subito o aspetti che possono aspettare.",
  },
  {
    code: "03",
    title: "Nessun impegno commerciale",
    body: "Esci dalla chiamata con indicazioni chiare sui possibili primi passi, senza paroloni tecnici né pressioni.",
  },
] as const;

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

function normalizeEmail(raw: string) {
  const trimmed = raw.trim();
  const at = trimmed.lastIndexOf("@");
  if (at === -1) return trimmed;
  return `${trimmed.slice(0, at)}@${trimmed.slice(at + 1).toLowerCase()}`;
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
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booked, setBooked] = useState<Booked | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

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

  const retryMonth = () => {
    setFailed((f) => {
      const next = { ...f };
      delete next[month];
      return next;
    });
  };

  const cells = useMemo(() => monthCells(month), [month]);
  const thisMonth = ym(new Date());
  const lastMonth = data ? data.window.last.slice(0, 7) : shiftMonth(thisMonth, 1);
  const canPrev = month > thisMonth;
  const canNext = month < lastMonth;

  const go = (by: 1 | -1) => {
    setDir(by);
    setMonth((m) => shiftMonth(m, by));
  };

  const pickDay = (d: string) => {
    if (day == null) track("prenota_giorno");
    setDay(d);
    setSlot(null);
    setSubmitError(null);
    setSubmitAttempted(false);
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

  const normalizedName = name.trim();
  const normalizedEmail = normalizeEmail(email);
  const nameError =
    (touched.name || submitAttempted) && normalizedName.length < 2
      ? "Inserisci almeno 2 caratteri per il nome."
      : null;
  const emailError =
    (touched.email || submitAttempted) && !EMAIL_RE.test(normalizedEmail)
      ? "Inserisci un indirizzo email valido (es. nome@azienda.it)."
      : null;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (slot == null || submitting) return;
    setSubmitAttempted(true);

    if (normalizedName.length < 2) {
      nameInputRef.current?.focus();
      return;
    }
    if (!EMAIL_RE.test(normalizedEmail)) {
      emailInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/prenota", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          start: slot,
          name: normalizedName,
          email: normalizedEmail,
          topic: topic.trim(),
          website: form.get("website"),
        }),
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
  const activeStep = !day ? 1 : slot == null ? 2 : 3;

  if (booked) {
    return (
      <section className="bk-done" aria-live="polite">
        <span className="bk-done-badge">PRENOTAZIONE CONFERMATA</span>
        <h2 className="bk-done-title">
          {dayLabelAt(booked.start, tz)}
          <br />
          alle {timeLabel(booked.start, tz)}
        </h2>
        <p className="bk-done-copy">
          {booked.demo
            ? "Modalità di prova: il calendario non è collegato, nessun evento è stato creato."
            : `Ti ho mandato l’invito a ${normalizedEmail || email}. Dentro trovi già il link per Google Meet.`}
        </p>
        <div className="bk-done-actions">
          {booked.meet ? (
            <a className="bk-done-primary press" href={booked.meet} target="_blank" rel="noreferrer">
              APRI LINK GOOGLE MEET
              <ArrowIcon direction="right" variant="display" />
            </a>
          ) : null}
          <Link className={booked.meet ? "bk-done-secondary press" : "bk-done-primary press"} href="/">
            TORNA AL SITO
            <ArrowIcon direction="right" variant="display" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="bk-layout">
      <div className="bk">
        {/* ------- colonna sinistra: calendario ------- */}
        <section className="bk-cal" aria-label="Scegli un giorno">
          <header className="bk-cal-head">
            <button
              type="button"
              className="bk-nav press"
              onClick={() => go(-1)}
              disabled={!canPrev}
              aria-label="Mese precedente"
            >
              <ArrowIcon direction="left" variant="icon" />
            </button>
            <h2 className="bk-month" key={month} data-dir={dir}>
              {monthLabel(month)}
            </h2>
            <button
              type="button"
              className="bk-nav press"
              onClick={() => go(1)}
              disabled={!canNext}
              aria-label="Mese successivo"
            >
              <ArrowIcon direction="right" variant="icon" />
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
            aria-busy={loading}
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
                  aria-label={`${dayLabel(d)}${state === "full" ? ", nessun orario disponibile" : ""}`}
                  disabled={state !== "open"}
                  onClick={() => pickDay(d)}
                >
                  <span className="bk-day-n">{Number(d.slice(-2))}</span>
                  {state === "open" ? <span className="bk-day-dot" aria-hidden /> : null}
                </button>
              );
            })}
          </div>

          {loadError ? (
            <div className="bk-cal-error" role="alert">
              <span>{loadError}</span>
              <button type="button" className="bk-retry" onClick={retryMonth}>
                RIPROVA
              </button>
            </div>
          ) : null}
        </section>

        {/* ------- colonna destra: scheda iniziale / orari / form ------- */}
      <section ref={sideRef} className="bk-side" data-step={activeStep}>
        <ol className="bk-steps" aria-label="Avanzamento prenotazione">
          {STEPS.map((s, idx) => {
            const num = idx + 1;
            const status = num < activeStep ? "done" : num === activeStep ? "active" : "todo";
            return (
              <li
                key={s.num}
                className="bk-step"
                data-status={status}
                aria-current={status === "active" ? "step" : undefined}
              >
                <span className="bk-step-code">{status === "done" ? "✓" : s.num}</span>
                <span className="bk-step-name">{s.label}</span>
              </li>
            );
          })}
        </ol>

        {!day ? (
          <div key="how-it-works" className="bk-panel bk-panel-guide">
            <div className="bk-side-head">
              <h2 className="bk-side-title">COME FUNZIONA IL CONFRONTO</h2>
            </div>

            <div className="bk-guide">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.code} className="bk-guide-item">
                  <div className="bk-guide-head">
                    <span className="bk-guide-num">{item.code}</span>
                    <strong className="bk-guide-title">{item.title}</strong>
                  </div>
                  <p className="bk-guide-body">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="bk-guide-foot">
              ← SCEGLI UN GIORNO DISPONIBILE SUL CALENDARIO PER VEDERE GLI ORARI SU GOOGLE MEET.
            </div>
          </div>
        ) : (
          <div key={day} className="bk-panel">
            <div className="bk-side-head" aria-live="polite">
              <div className="bk-side-meta">
                <h2 className="bk-side-title">{dayLabel(day)}</h2>
                <button
                  type="button"
                  className="bk-reset-day"
                  onClick={() => {
                    setDay(null);
                    setSlot(null);
                    setSubmitError(null);
                  }}
                >
                  GUIDA
                </button>
              </div>
            </div>

            {loading ? (
              <p className="bk-empty-day" role="status">
                Aggiornamento orari disponibili…
              </p>
            ) : slots.length === 0 ? (
              <p className="bk-empty-day">
                Nessun orario libero per questa data. Seleziona un altro giorno sul calendario.
              </p>
            ) : (
              <div className="bk-slots" role="group" aria-label="Orari disponibili">
                {slots.map((s, i) => {
                  const selected = slot === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      className="bk-slot"
                      style={{ ["--i" as string]: Math.min(i, 9) }}
                      aria-pressed={selected}
                      onClick={() => {
                        if (slot == null) track("prenota_orario");
                        setSlot(s);
                        setSubmitError(null);
                      }}
                    >
                      {selected ? `✓ ${timeLabel(s, tz)}` : timeLabel(s, tz)}
                    </button>
                  );
                })}
              </div>
            )}

            {slot != null ? (
              <form key={slot} className="bk-form" onSubmit={submit} noValidate>
                <div className="bk-summary">
                  <span>
                    SCELTO: <strong>{dayLabel(day)}</strong> · <strong>{timeLabel(slot, tz)}</strong>
                  </span>
                  <button
                    type="button"
                    className="bk-change-slot"
                    onClick={() => {
                      setSlot(null);
                      setSubmitError(null);
                    }}
                  >
                    CAMBIA ORARIO
                  </button>
                </div>

                <label className="bk-field">
                  <span className="bk-label">NOME *</span>
                  <input
                    ref={nameInputRef}
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    placeholder="Es. Marco Rossi"
                    value={name}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? "bk-err-name" : undefined}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  />
                  {nameError ? (
                    <span id="bk-err-name" className="bk-field-error" aria-live="polite">
                      {nameError}
                    </span>
                  ) : null}
                </label>

                <label className="bk-field">
                  <span className="bk-label">EMAIL *</span>
                  <input
                    ref={emailInputRef}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="nome@azienda.it"
                    value={email}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? "bk-err-email" : undefined}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  />
                  {emailError ? (
                    <span id="bk-err-email" className="bk-field-error" aria-live="polite">
                      {emailError}
                    </span>
                  ) : null}
                </label>

                <label className="bk-field">
                  <span className="bk-label">DI COSA PARLIAMO (OPZIONALE)</span>
                  <textarea
                    name="topic"
                    rows={2}
                    maxLength={600}
                    placeholder="Es. gestionale aziendale, accessi, applicazione web o primo controllo."
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
                  className="bk-submit press"
                  disabled={submitting}
                  data-busy={submitting || undefined}
                >
                  <span key={submitting ? "busy" : "idle"} className="bk-submit-label">
                    {submitting ? (
                      "PRENOTAZIONE IN CORSO…"
                    ) : (
                      <>
                        CONFERMA CONFRONTO · {timeLabel(slot, tz)}
                        <ArrowIcon direction="right" variant="display" />
                      </>
                    )}
                  </span>
                </button>
              </form>
            ) : null}
          </div>
        )}
        </section>
      </div>

      {/* Fallback diretto con chiamata telefonica sotto le due colonne */}
      <section className="bk-direct" aria-label="Contatto telefonico diretto">
        <div className="bk-direct-copy">
          <span className="bk-direct-k">CONTATTO DIRETTO</span>
          <p className="bk-direct-text">
            Non trovi un orario comodo o preferisci parlarne subito al telefono?
          </p>
        </div>
        <a className="bk-direct-btn press" href={PHONE_NUMBER}>
          CHIAMA ORA · {PHONE_DISPLAY}
          <ArrowIcon direction="right" />
        </a>
      </section>
    </div>
  );
}
