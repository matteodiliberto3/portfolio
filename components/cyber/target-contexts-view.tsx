"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ArrowIcon } from "@/components/cyber/arrow-icon";
import {
  buildBuyerSegments,
  BUYER_SEGMENT_KEYS,
  type BuyerSegment,
  type BuyerSegmentKey,
} from "@/components/cyber/buyer-segments";
import {
  DISPLAY_FONT,
  MONO_FONT,
  PALETTE,
  PixelDitherCanvas,
  SANS_FONT,
} from "@/components/cyber/dither-primitives";
import { useI18n } from "@/components/i18n/locale-provider";

function isBuyerSegmentKey(value: string): value is BuyerSegmentKey {
  return (BUYER_SEGMENT_KEYS as readonly string[]).includes(value);
}

function getHeaderHeight(): number {
  if (typeof document === "undefined") return 54;
  const header = document.querySelector(".cyber-topbar");
  return header ? header.getBoundingClientRect().height : 54;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function SegmentSchemaPanel({
  segment,
  asideAriaLabel,
}: {
  segment: BuyerSegment;
  asideAriaLabel: string;
}) {
  return (
    <aside
      aria-label={asideAriaLabel}
      className="cyber-segment-aside"
      style={{
        background: PALETTE.surface,
        border: `1px solid ${PALETTE.borderStrong}`,
        borderTop: `2px solid ${segment.accentInk}`,
        padding: "clamp(20px, 3vw, 28px)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Intestazione schematica */}
      <div
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: "1.45rem",
          lineHeight: 1.08,
          textTransform: "uppercase",
          color: PALETTE.inkStrong,
        }}
      >
        {segment.schemaTitle}
      </div>

      {/* Flusso nodi di rischio */}
      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {segment.schemaNodes.map((node, index) => (
          <li
            key={index}
            className="cyber-schema-step"
            style={
              {
                "--step-delay": `${170 + index * 55}ms`,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              } as CSSProperties
            }
          >
            <div
              style={{
                background: node.highlighted ? PALETTE.surfaceRaised : PALETTE.bg,
                borderLeft: `2px solid ${node.highlighted ? segment.accentInk : PALETTE.borderStrong}`,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                style={{
                  fontFamily: MONO_FONT,
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: node.highlighted ? segment.accentInk : PALETTE.muted,
                }}
              >
                {node.role}
              </div>

              <div
                style={{
                  fontFamily: SANS_FONT,
                  fontSize: "14.5px",
                  fontWeight: 600,
                  lineHeight: 1.35,
                  color: PALETTE.inkStrong,
                }}
              >
                {node.label}
              </div>

              <div
                style={{
                  fontFamily: SANS_FONT,
                  fontSize: "13.5px",
                  lineHeight: 1.5,
                  color: PALETTE.inkSecondary,
                }}
              >
                {node.detail}
              </div>
            </div>

            {index < segment.schemaNodes.length - 1 ? (
              <div
                aria-hidden="true"
                style={{
                  paddingLeft: "14px",
                  fontFamily: MONO_FONT,
                  fontSize: "11px",
                  lineHeight: 1,
                  color: PALETTE.dim,
                }}
              >
                ↓
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {/* Risultato concreto per il cliente */}
      <div
        style={{
          borderTop: `1px solid ${PALETTE.border}`,
          paddingTop: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div
          style={{
            fontFamily: MONO_FONT,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: segment.accentInk,
          }}
        >
          {segment.deliverableTitle}
        </div>
        <div
          style={{
            fontFamily: SANS_FONT,
            fontSize: "16px",
            fontWeight: 700,
            lineHeight: 1.35,
            color: PALETTE.inkStrong,
          }}
        >
          {segment.deliverableHeadline}
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: SANS_FONT,
            fontSize: "14px",
            lineHeight: 1.6,
            color: PALETTE.inkSecondary,
          }}
        >
          {segment.deliverableSummary}
        </p>
      </div>
    </aside>
  );
}

export function TargetContextsView() {
  const { t } = useI18n();
  const segments = useMemo(() => buildBuyerSegments(t.segments), [t.segments]);
  const [activeKey, setActiveKey] = useState<BuyerSegmentKey | null>(null);
  const [revealedKey, setRevealedKey] = useState<BuyerSegmentKey | null>(null);
  const [revealSeq, setRevealSeq] = useState(0);

  const stageRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Partial<Record<BuyerSegmentKey, HTMLButtonElement | null>>>({});
  const cancelSequenceRef = useRef<(() => void) | null>(null);

  const triggerSequence = useCallback((nextKey: BuyerSegmentKey) => {
    cancelSequenceRef.current?.();
    cancelSequenceRef.current = null;

    setActiveKey(nextKey);
    setRevealedKey(null);

    if (typeof window === "undefined") return;

    window.history.replaceState(null, "", `#${nextKey}`);

    const stageEl = stageRef.current;
    if (!stageEl) {
      setRevealSeq((n) => n + 1);
      setRevealedKey(nextKey);
      return;
    }

    const headerH = getHeaderHeight();
    const rawTargetY = stageEl.getBoundingClientRect().top + window.scrollY - headerH;
    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const targetY = Math.max(0, Math.min(rawTargetY, maxScrollY));

    if (prefersReducedMotion()) {
      window.scrollTo({ top: targetY, behavior: "auto" });
      setRevealSeq((n) => n + 1);
      setRevealedKey(nextKey);
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let revealTimer = 0;
    let fallbackTimer = 0;

    const finishArrival = () => {
      if (cancelled) return;
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);

      // Pausa breve nello spazio vuoto appena raggiunto prima di far comparire i testi
      revealTimer = window.setTimeout(() => {
        setRevealSeq((n) => n + 1);
        setRevealedKey(nextKey);
      }, 150);
    };

    window.scrollTo({ top: targetY, behavior: "smooth" });

    let stableFrames = 0;
    let lastScrollY = window.scrollY;
    const startedAt = performance.now();

    const watchScroll = () => {
      if (cancelled) return;
      const currentY = window.scrollY;
      const dist = Math.abs(currentY - targetY);

      if (dist <= 6) {
        finishArrival();
        return;
      }

      if (performance.now() - startedAt > 180 && Math.abs(currentY - lastScrollY) < 0.5) {
        stableFrames++;
        if (stableFrames >= 4) {
          finishArrival();
          return;
        }
      } else {
        stableFrames = 0;
      }

      lastScrollY = currentY;
      rafId = window.requestAnimationFrame(watchScroll);
    };

    rafId = window.requestAnimationFrame(watchScroll);
    fallbackTimer = window.setTimeout(finishArrival, 760);

    cancelSequenceRef.current = () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (revealTimer) window.clearTimeout(revealTimer);
    };
  }, []);

  useEffect(() => {
    let mountTimer = 0;

    const handleHash = (isMount = false) => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!isBuyerSegmentKey(hash)) return;

      if (isMount) {
        mountTimer = window.setTimeout(() => triggerSequence(hash), 120);
      } else {
        triggerSequence(hash);
      }
    };

    handleHash(true);
    const onHashChange = () => handleHash(false);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      if (mountTimer) window.clearTimeout(mountTimer);
      window.removeEventListener("hashchange", onHashChange);
      cancelSequenceRef.current?.();
    };
  }, [triggerSequence]);

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const fallbackIndex = activeKey ? BUYER_SEGMENT_KEYS.indexOf(activeKey) : 0;
    let targetIndex = -1;

    if (event.key === "ArrowRight") {
      targetIndex = activeKey
        ? (fallbackIndex + 1) % BUYER_SEGMENT_KEYS.length
        : 0;
    } else if (event.key === "ArrowLeft") {
      targetIndex = activeKey
        ? (fallbackIndex - 1 + BUYER_SEGMENT_KEYS.length) % BUYER_SEGMENT_KEYS.length
        : BUYER_SEGMENT_KEYS.length - 1;
    } else if (event.key === "Home") {
      targetIndex = 0;
    } else if (event.key === "End") {
      targetIndex = BUYER_SEGMENT_KEYS.length - 1;
    }

    if (targetIndex !== -1) {
      event.preventDefault();
      const key = BUYER_SEGMENT_KEYS[targetIndex];
      tabRefs.current[key]?.focus();
      triggerSequence(key);
    }
  };

  const scrollBackToChooser = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  const revealedSegment: BuyerSegment | null = revealedKey ? segments[revealedKey] : null;

  return (
    <div
      style={{
        background: PALETTE.bg,
        color: PALETTE.ink,
        fontFamily: SANS_FONT,
        overflowX: "clip",
      }}
    >
      {/* =====================================================================
       * FASCIA 1 — TITOLO + SELEZIONE CONTESTO (occupa la prima schermata)
       * =================================================================== */}
      <section
        aria-labelledby="per-chi-heading"
        style={{
          minHeight: "calc(100svh - 54px)",
          display: "flex",
          flexDirection: "column",
          padding: "clamp(48px, 8vh, 96px) clamp(20px, 4vw, 48px) clamp(40px, 7vh, 76px)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "clamp(48px, 9vh, 104px)",
          }}
        >
          <header
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "clamp(20px, 3.2vh, 34px)",
              paddingTop: "clamp(16px, 6vh, 64px)",
            }}
          >
            <h1
              id="per-chi-heading"
              style={{
                margin: 0,
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                fontSize: "clamp(2.65rem, 6vw, 5.25rem)",
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                color: PALETTE.inkStrong,
              }}
            >
              {t.perChi.headingLine1}
              <br />
              {t.perChi.headingLine2}
            </h1>

            <p
              style={{
                margin: 0,
                maxWidth: "56ch",
                fontFamily: SANS_FONT,
                fontSize: "clamp(16px, 1.45vw, 18.5px)",
                lineHeight: 1.6,
                color: PALETTE.inkSecondary,
              }}
            >
              {t.perChi.intro}
            </p>
          </header>

          {/* Selettore a tab ancorato in basso nella prima schermata */}
          <div style={{ paddingBottom: "clamp(4px, 2vh, 20px)" }}>
            <div
              role="tablist"
              aria-label={t.perChi.tabsAriaLabel}
              className="cyber-chapter-nav"
              onKeyDown={handleTabKeyDown}
            >
              {BUYER_SEGMENT_KEYS.map((key, index) => {
                const seg = segments[key];
                const isSelected = activeKey === key;

                return (
                  <button
                    key={key}
                    ref={(el) => {
                      tabRefs.current[key] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`per-chi-tab-${key}`}
                    aria-selected={isSelected}
                    aria-controls="per-chi-stage"
                    tabIndex={isSelected || (activeKey === null && index === 0) ? 0 : -1}
                    className="cyber-chapter-pill"
                    data-active={isSelected ? "true" : undefined}
                    onClick={() => triggerSequence(key)}
                    style={
                      {
                        "--tab-accent": seg.accentInk,
                      } as CSSProperties
                    }
                  >
                    {seg.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * FASCIA 2 — ZONA DEDICATA A TUTTO SCHERMO (inizialmente vuota)
       * =================================================================== */}
      <section
        ref={stageRef}
        id="per-chi-stage"
        aria-live="polite"
        aria-label={t.perChi.stageAriaLabel}
        style={{
          position: "relative",
          minHeight: "calc(100svh - 54px)",
          display: "flex",
          alignItems: "center",
          padding: "clamp(48px, 6vh, 80px) clamp(20px, 4vw, 48px)",
          overflow: "hidden",
        }}
      >
        {/* Cupola antracite in dither centrata sul fondo dello schermo dedicato */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: "min(900px, 100%)",
            pointerEvents: "none",
            opacity: 0.42,
          }}
        >
          <PixelDitherCanvas
            kind="dome"
            color={PALETTE.slate}
            width={760}
            height={360}
            cellSize={6}
            interactive={false}
            style={{ width: "100%", height: "auto" }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          {revealedKey && revealedSegment ? (
            <article
              key={`${revealedKey}-${revealSeq}`}
              role="tabpanel"
              id={`per-chi-panel-${revealedKey}`}
              aria-labelledby={`per-chi-tab-${revealedKey}`}
              className="cyber-chapter-grid"
            >
              {/* Colonna SX: Identità contesto + Testi completi + Azione */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  maxWidth: "64ch",
                }}
              >
                <div className="cyber-reveal-head">
                  <h2
                    style={{
                      margin: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      fontFamily: MONO_FONT,
                      fontSize: "13px",
                      fontWeight: 700,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: revealedSegment.accentInk,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "18px",
                        height: "2px",
                        background: revealedSegment.accentInk,
                        flexShrink: 0,
                      }}
                    />
                    {revealedSegment.label}
                  </h2>

                  <h3
                    style={{
                      margin: "10px 0 0 0",
                      fontFamily: DISPLAY_FONT,
                      fontSize: "clamp(1.85rem, 3.3vw, 2.75rem)",
                      lineHeight: 1.06,
                      textTransform: "uppercase",
                      textWrap: "balance",
                      color: PALETTE.inkStrong,
                    }}
                  >
                    {revealedSegment.headline}
                  </h3>
                </div>

                <div
                  className="cyber-reveal-body"
                  style={{
                    marginTop: "22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  {revealedSegment.intro.map((paragraph, index) => (
                    <p
                      key={index}
                      style={{
                        margin: 0,
                        fontFamily: SANS_FONT,
                        fontSize: "16px",
                        lineHeight: 1.66,
                        color: PALETTE.ink,
                      }}
                    >
                      {paragraph}
                    </p>
                  ))}

                  <p
                    style={{
                      margin: "10px 0",
                      paddingLeft: "16px",
                      borderLeft: `3px solid ${revealedSegment.accentInk}`,
                      fontFamily: SANS_FONT,
                      fontSize: "20px",
                      lineHeight: 1.45,
                      fontWeight: 600,
                      color: PALETTE.inkStrong,
                    }}
                  >
                    {revealedSegment.statement}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontFamily: SANS_FONT,
                      fontSize: "16px",
                      lineHeight: 1.66,
                      color: PALETTE.inkSecondary,
                    }}
                  >
                    {revealedSegment.approach}
                  </p>
                </div>

                <div className="cyber-reveal-cta" style={{ marginTop: "28px" }}>
                  <Link
                    href="/prenota"
                    className={`cyber-segment-btn ${revealedSegment.buttonClass}`}
                  >
                    {revealedSegment.cta}
                    <ArrowIcon direction="right" variant="display" />
                  </Link>
                </div>
              </div>

              {/* Colonna DX: Schema del meccanismo di rischio + Cosa ottieni */}
              <SegmentSchemaPanel
                segment={revealedSegment}
                asideAriaLabel={`${t.perChi.asideAriaLabelPrefix} ${revealedSegment.label}`}
              />
            </article>
          ) : null}
        </div>
      </section>

      {/* =====================================================================
       * CHIUSURA PAGINA E NAVIGAZIONE SECONDARIA (sotto lo schermo dedicato)
       * =================================================================== */}
      <footer
        style={{
          padding: "28px clamp(20px, 4vw, 48px) clamp(40px, 6vw, 64px)",
          borderTop: `1px solid ${PALETTE.border}`,
        }}
      >
        <div
          className="cyber-perchi-footer-bar"
          style={{
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <Link
            href="/"
            className="cyber-ghost-white cyber-perchi-footer-left"
          >
            <ArrowIcon direction="left" />
            {t.perChi.homeLink}
          </Link>

          <button
            type="button"
            onClick={scrollBackToChooser}
            className="cyber-ghost-white cyber-perchi-footer-center"
          >
            {t.perChi.topLink}
          </button>

          <Link
            href="/metodologia"
            className="cyber-ghost-white cyber-perchi-footer-right"
          >
            {t.perChi.methodLink}
            <ArrowIcon direction="right" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
