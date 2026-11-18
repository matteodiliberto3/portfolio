"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { ArrowIcon } from "@/components/cyber/arrow-icon";
import { useI18n } from "@/components/i18n/locale-provider";
import type { Dictionary } from "@/lib/i18n";
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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Availability = {
  demo: boolean;
  timeZone: string;
  slotMinutes: number;
  window: { first: string; last: string };
  days: Record<string, number[]>;
};

type Booked = { start: number; end: number; meet: string | null; demo: boolean };

type SubmitErrorState =
  | { code: keyof Dictionary["booking"]["apiErrors"] }
  | { code: "connection" }
  | { code: "generic"; message?: string };

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

function monthLabel(month: string, intlLocale: string) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1),
  );
}

function dayLabel(day: string, intlLocale: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

function timeLabel(ms: number, timeZone: string, intlLocale: string) {
  return new Intl.DateTimeFormat(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(ms);
}

function dayLabelAt(ms: number, timeZone: string, intlLocale: string) {
  return new Intl.DateTimeFormat(intlLocale, {
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
  const { locale, intlLocale, t } = useI18n();
  const b = t.booking;

  const [month, setMonth] = useState(() => ym(new Date()));
  const [dir, setDir] = useState<1 | -1>(1);
  const [cache, setCache] = useState<Record<string, Availability>>({});
  const [failed, setFailed] = useState<Record<string, true>>({});
  const inflight = useRef(new Set<string>());
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitErrorState | null>(null);
  const [booked, setBooked] = useState<Booked | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const data = cache[month];
  const loadError = Boolean(failed[month]);
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
      .catch(() => setFailed((f) => ({ ...f, [month]: true })))
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
      requestAnimationFrame(() =>
        sideRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
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
    const idx = buttons.findIndex((btn) => btn.dataset.day === current);
    const target =
      buttons[
        Math.min(
          buttons.length - 1,
          Math.max(0, idx + Math.sign(step) * (Math.abs(step) === 7 ? 5 : 1)),
        )
      ];
    target?.focus();
  }, []);

  const normalizedName = name.trim();
  const normalizedEmail = normalizeEmail(email);
  const nameError =
    (touched.name || submitAttempted) && normalizedName.length < 2 ? b.nameError : null;
  const emailError =
    (touched.email || submitAttempted) && !EMAIL_RE.test(normalizedEmail) ? b.emailError : null;

  const resolvedSubmitError = useMemo(() => {
    if (!submitError) return null;
    if (submitError.code === "connection") return b.connectionError;
    if (submitError.code === "generic") return submitError.message || b.genericError;
    return b.apiErrors[submitError.code] ?? b.genericError;
  }, [submitError, b]);

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
          locale,
          website: form.get("website"),
        }),
      });
      const json = (await r.json()) as Partial<Booked> & {
        error?: string;
        errorCode?: keyof Dictionary["booking"]["apiErrors"];
        ok?: boolean;
      };
      if (!r.ok || !json.ok) {
        if (json.errorCode && json.errorCode in b.apiErrors) {
          setSubmitError({ code: json.errorCode });
        } else {
          setSubmitError({ code: "generic", message: json.error });
        }
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
      setBooked({
        start: json.start ?? slot,
        end: json.end ?? slot + 30 * 60_000,
        meet: json.meet ?? null,
        demo: Boolean(json.demo),
      });
      track("prenota_confermata", { demo: Boolean(json.demo) });
    } catch {
      setSubmitError({ code: "connection" });
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
        <span className="bk-done-badge">{b.confirmedBadge}</span>
        <h2 className="bk-done-title">
          {dayLabelAt(booked.start, tz, intlLocale)}
          <br />
          {b.confirmedTimePrefix} {timeLabel(booked.start, tz, intlLocale)}
        </h2>
        <p className="bk-done-copy">
          {booked.demo
            ? b.confirmedDemoNote
            : `${b.confirmedLivePrefix}${normalizedEmail || email}${b.confirmedLiveSuffix}`}
        </p>
        <div className="bk-done-actions">
          {booked.meet ? (
            <a className="bk-done-primary press" href={booked.meet} target="_blank" rel="noreferrer">
              {b.openMeet}
              <ArrowIcon direction="right" variant="display" />
            </a>
          ) : null}
          <Link className={booked.meet ? "bk-done-secondary press" : "bk-done-primary press"} href="/">
            {b.backToSiteDone}
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
        <section className="bk-cal" aria-label={b.calAriaLabel}>
          <header className="bk-cal-head">
            <button
              type="button"
              className="bk-nav press"
              onClick={() => go(-1)}
              disabled={!canPrev}
              aria-label={b.prevMonth}
            >
              <ArrowIcon direction="left" variant="icon" />
            </button>
            <h2 className="bk-month" key={month} data-dir={dir}>
              {monthLabel(month, intlLocale)}
            </h2>
            <button
              type="button"
              className="bk-nav press"
              onClick={() => go(1)}
              disabled={!canNext}
              aria-label={b.nextMonth}
            >
              <ArrowIcon direction="right" variant="icon" />
            </button>
          </header>

          <div className="bk-weekdays" aria-hidden>
            {b.weekDays.map((w) => (
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
                  aria-label={`${dayLabel(d, intlLocale)}${state === "full" ? `, ${b.dayFullSuffix}` : ""}`}
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
              <span>{b.fetchError}</span>
              <button type="button" className="bk-retry" onClick={retryMonth}>
                {b.retry}
              </button>
            </div>
          ) : null}
        </section>

        {/* ------- colonna destra: scheda iniziale / orari / form ------- */}
        <section ref={sideRef} className="bk-side" data-step={activeStep}>
          <ol className="bk-steps" aria-label={b.stepsAriaLabel}>
            {b.steps.map((s, idx) => {
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
                <h2 className="bk-side-title">{b.guideTitle}</h2>
              </div>

              <div className="bk-guide">
                {b.howItWorks.map((item) => (
                  <div key={item.code} className="bk-guide-item">
                    <div className="bk-guide-head">
                      <span className="bk-guide-num">{item.code}</span>
                      <strong className="bk-guide-title">{item.title}</strong>
                    </div>
                    <p className="bk-guide-body">{item.body}</p>
                  </div>
                ))}
              </div>

              <div className="bk-guide-foot">{b.guideFoot}</div>
            </div>
          ) : (
            <div key={day} className="bk-panel">
              <div className="bk-side-head" aria-live="polite">
                <div className="bk-side-meta">
                  <h2 className="bk-side-title">{dayLabel(day, intlLocale)}</h2>
                  <button
                    type="button"
                    className="bk-reset-day"
                    onClick={() => {
                      setDay(null);
                      setSlot(null);
                      setSubmitError(null);
                    }}
                  >
                    {b.resetToGuide}
                  </button>
                </div>
              </div>

              {loading ? (
                <p className="bk-empty-day" role="status">
                  {b.loadingSlots}
                </p>
              ) : slots.length === 0 ? (
                <p className="bk-empty-day">{b.emptyDay}</p>
              ) : (
                <div className="bk-slots" role="group" aria-label={b.slotsAriaLabel}>
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
                        {selected
                          ? `✓ ${timeLabel(s, tz, intlLocale)}`
                          : timeLabel(s, tz, intlLocale)}
                      </button>
                    );
                  })}
                </div>
              )}

              {slot != null ? (
                <form key={slot} className="bk-form" onSubmit={submit} noValidate>
                  <div className="bk-summary">
                    <span>
                      {b.selectedPrefix} <strong>{dayLabel(day, intlLocale)}</strong> {b.selectedGlue}{" "}
                      <strong>{timeLabel(slot, tz, intlLocale)}</strong>
                    </span>
                    <button
                      type="button"
                      className="bk-change-slot"
                      onClick={() => {
                        setSlot(null);
                        setSubmitError(null);
                      }}
                    >
                      {b.changeSlot}
                    </button>
                  </div>

                  <label className="bk-field">
                    <span className="bk-label">{b.fieldName}</span>
                    <input
                      ref={nameInputRef}
                      name="name"
                      autoComplete="name"
                      required
                      minLength={2}
                      placeholder={b.namePlaceholder}
                      value={name}
                      aria-invalid={Boolean(nameError)}
                      aria-describedby={nameError ? "bk-err-name" : undefined}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                    />
                    {nameError ? (
                      <span id="bk-err-name" className="bk-field-error" aria-live="polite">
                        {nameError}
                      </span>
                    ) : null}
                  </label>

                  <label className="bk-field">
                    <span className="bk-label">{b.fieldEmail}</span>
                    <input
                      ref={emailInputRef}
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder={b.emailPlaceholder}
                      value={email}
                      aria-invalid={Boolean(emailError)}
                      aria-describedby={emailError ? "bk-err-email" : undefined}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    />
                    {emailError ? (
                      <span id="bk-err-email" className="bk-field-error" aria-live="polite">
                        {emailError}
                      </span>
                    ) : null}
                  </label>

                  <label className="bk-field">
                    <span className="bk-label">{b.fieldTopic}</span>
                    <textarea
                      name="topic"
                      rows={2}
                      maxLength={600}
                      placeholder={b.topicPlaceholder}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </label>

                  <input className="bk-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden />

                  {resolvedSubmitError ? (
                    <p className="bk-error" role="alert">
                      {resolvedSubmitError}
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
                        b.submitBusy
                      ) : (
                        <>
                          {b.submitIdlePrefix} · {timeLabel(slot, tz, intlLocale)}
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
      <section className="bk-direct" aria-label={b.directAriaLabel}>
        <div className="bk-direct-copy">
          <span className="bk-direct-k">{b.directEyebrow}</span>
          <p className="bk-direct-text">{b.directText}</p>
        </div>
        <a className="bk-direct-btn press" href={PHONE_NUMBER}>
          {b.directButtonPrefix} · {b.phoneDisplay}
          <ArrowIcon direction="right" />
        </a>
      </section>
    </div>
  );
}
