"use client";

import React, { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowIcon } from "@/components/cyber/arrow-icon";
import { AsciiPortraitCanvas } from "@/components/laboratorio/ascii-portrait-canvas";
import {
  buildBuyerSegments,
  type BuyerSegmentKey,
} from "@/components/cyber/buyer-segments";
import {
  DISPLAY_FONT,
  MONO_FONT,
  PALETTE,
  PixelDitherCanvas,
  PixelDissolveBadge,
  ScannerVsManualComparison,
  type DitherSceneKind,
} from "@/components/cyber/dither-primitives";
import { useI18n } from "@/components/i18n/locale-provider";

export { PixelDitherCanvas, ScannerVsManualComparison, type DitherSceneKind };

const PHONE_NUMBER = "tel:+393711500055";

/** 1a. HeroEvolveTitle: "THE THREATS" + [EVOLVE] -> EVOLVE sale sopra -> YOUR BUSINESS -> dissolve dither e loop */
function HeroEvolveTitle({
  replayKey,
  onReplay,
}: {
  replayKey: number;
  onReplay: () => void;
}) {
  const [phase, setPhase] = useState<
    "empty" | "animating" | "settled" | "rising" | "your" | "business" | "exiting"
  >("empty");
  const [cycle, setCycle] = useState(0);
  const [metrics, setMetrics] = useState({ riseY: 120, evolveW: 360 });
  const evolveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const measure = () => {
      if (!mounted || !evolveRef.current) return;
      if (phase === "animating" || phase === "exiting") return;
      const nextRiseY = evolveRef.current.offsetTop;
      const nextEvolveW = evolveRef.current.offsetWidth;
      setMetrics((prev) =>
        prev.riseY === nextRiseY && prev.evolveW === nextEvolveW
          ? prev
          : { riseY: nextRiseY, evolveW: nextEvolveW }
      );
    };
    const raf = requestAnimationFrame(measure);
    const ro =
      typeof ResizeObserver !== "undefined" && evolveRef.current
        ? new ResizeObserver(measure)
        : null;
    if (ro && evolveRef.current) {
      ro.observe(evolveRef.current);
    }
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    window.addEventListener("resize", measure);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [replayKey, cycle, phase]);

  useEffect(() => {
    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, ms: number) => {
      timers.push(
        setTimeout(() => {
          if (active) fn();
        }, ms)
      );
    };

    // Passaggio 1: THE THREATS visibile, il posto sotto è vuoto
    schedule(() => setPhase("empty"), 0);
    // Passaggio 2: dopo ~1.3s entra EVOLVE con dissolvenza dither + scramble
    schedule(() => setPhase("animating"), 1300);
    // Passaggio 3: EVOLVE resta visibile sotto THE THREATS
    schedule(() => setPhase("settled"), 1800);
    // Passaggio 4: EVOLVE sale sopra THE THREATS
    schedule(() => setPhase("rising"), 3000);
    // Passaggio 5: compare YOUR a destra
    schedule(() => setPhase("your"), 3650);
    // Passaggio 6: compare BUSINESS sotto YOUR
    schedule(() => setPhase("business"), 4000);
    // Passaggio 7: dopo ~3.2s la frase EVOLVE YOUR BUSINESS svanisce con lo stesso effetto dither
    schedule(() => setPhase("exiting"), 7200);
    // Passaggio 8: riparte il ciclo tornando a THE THREATS
    schedule(() => setCycle((c) => c + 1), 7750);

    return () => {
      active = false;
      timers.forEach(clearTimeout);
    };
  }, [replayKey, cycle]);

  const isEmpty = phase === "empty";
  const isExiting = phase === "exiting";
  const isRising =
    phase === "rising" || phase === "your" || phase === "business" || isExiting;
  const showYour = phase === "your" || phase === "business" || isExiting;
  const showBusiness = phase === "business" || isExiting;
  const rightColOffset = metrics.evolveW + Math.max(12, Math.round(metrics.evolveW * 0.05));
  const baseTitleFontSize = "var(--hero-base-size, clamp(2.45rem, 9vw, 5.4rem))";
  const evolveBadgeFontSize = "var(--hero-evolve-size, clamp(2.75rem, 10.2vw, 6.4rem))";

  return (
    <h1
      onClick={onReplay}
      style={{
        position: "relative",
        margin: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.18em",
        textTransform: "uppercase",
        cursor: "pointer",
        width: "100%",
      }}
    >
      {/* Riga 1: THE THREATS (svanisce quando EVOLVE sale, riappare a fine ciclo) */}
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 700,
          fontSize: baseTitleFontSize,
          lineHeight: 0.94,
          letterSpacing: "-0.02em",
          color: PALETTE.ink,
          whiteSpace: "nowrap",
          opacity: isRising ? 0 : 1,
          transform: isRising ? "translateY(-14px)" : "translateY(0)",
          transition: "opacity 340ms ease, transform 420ms ease",
          pointerEvents: "none",
        }}
      >
        THE THREATS
      </span>

      {/* Riga 2: EVOLVE (vuoto iniziale -> entrata dither -> ascesa -> uscita dither) */}
      <div
        ref={evolveRef}
        style={{
          position: "relative",
          zIndex: 2,
          opacity: isEmpty ? 0 : 1,
          pointerEvents: isEmpty ? "none" : "auto",
          transform: isRising ? `translateY(-${metrics.riseY}px)` : "translateY(0)",
          transition: isEmpty
            ? "none"
            : "transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease",
        }}
      >
        <PixelDissolveBadge
          text="EVOLVE"
          triggerKey={
            isEmpty
              ? `${replayKey}-${cycle}-empty`
              : isExiting
                ? `${replayKey}-${cycle}-exit`
                : `${replayKey}-${cycle}-visible`
          }
          dissolveMode={isExiting ? "exit" : "enter"}
          animateOnMount={!isEmpty}
          scrambleOnEnter={!isEmpty && !isExiting}
          bg={PALETTE.blue}
          fg="#F4F3FA"
          fontSize={evolveBadgeFontSize}
          padding="0.07em 0.22em"
        />
      </div>

      {/* A destra di EVOLVE compare YOUR e sotto BUSINESS */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: `${rightColOffset}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "0.14em",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            opacity: showYour ? 1 : 0,
            transform: showYour ? "translateY(0)" : "translateY(18px)",
            transition: isEmpty
              ? "none"
              : "opacity 360ms ease, transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <PixelDissolveBadge
            text="YOUR"
            triggerKey={`${replayKey}-${cycle}-${isExiting ? "exit" : "idle"}`}
            dissolveMode={isExiting ? "exit" : "enter"}
            animateOnMount={isExiting}
            bg="transparent"
            fg={PALETTE.ink}
            fontSize={baseTitleFontSize}
            lineHeight={0.94}
            whiteSpace="nowrap"
            padding="0"
          />
        </span>
        <span
          style={{
            display: "inline-flex",
            opacity: showBusiness ? 1 : 0,
            transform: showBusiness ? "translateY(0)" : "translateY(18px)",
            transition: isEmpty
              ? "none"
              : "opacity 380ms ease, transform 440ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <PixelDissolveBadge
            text="BUSINESS"
            triggerKey={`${replayKey}-${cycle}-${isExiting ? "exit" : "idle"}`}
            dissolveMode={isExiting ? "exit" : "enter"}
            animateOnMount={isExiting}
            bg="transparent"
            fg={PALETTE.ink}
            fontSize={baseTitleFontSize}
            lineHeight={0.94}
            whiteSpace="nowrap"
            padding="0"
          />
        </span>
      </div>
    </h1>
  );
}

const DIFF_BANDS: Array<{
  word: "RETOOL" | "ADAPT" | "EVOLVE";
  bg: string;
  fg: string;
  badgeBg: string;
  badgeFg: string;
  scene: DitherSceneKind;
}> = [
  {
    word: "RETOOL",
    bg: PALETTE.blue,
    fg: "#F4F3FA",
    badgeBg: PALETTE.bg,
    badgeFg: PALETTE.ink,
    scene: "torus",
  },
  {
    word: "ADAPT",
    bg: PALETTE.red,
    fg: "#F4F3FA",
    badgeBg: PALETTE.bg,
    badgeFg: PALETTE.ink,
    scene: "mutant",
  },
  {
    word: "EVOLVE",
    bg: PALETTE.ink,
    fg: PALETTE.bg,
    badgeBg: PALETTE.bg,
    badgeFg: PALETTE.ink,
    scene: "hollowCube",
  },
];

/* ============================================================================
 * COMPONENTE PRINCIPALE: SITO CYBERSEC IN STILE LARACON AU 26
 * ========================================================================== */
export function LaraconCybersecSite() {
  const { t } = useI18n();
  const [replayNonce, setReplayNonce] = useState(0);
  const [activeBuyer, setActiveBuyer] = useState<BuyerSegmentKey>("pmi");

  const buyerSegments = useMemo(() => buildBuyerSegments(t.segments), [t.segments]);
  const buyer = buyerSegments[activeBuyer];

  return (
    <div
      style={{
        background: PALETTE.bg,
        color: PALETTE.ink,
        fontFamily: MONO_FONT,
        overflowX: "clip",
      }}
    >
      {/* =====================================================================
       * 01 — HERO ("THE THREATS" -> "EVOLVE YOUR BUSINESS" + RITRATTO ASCII)
       * =================================================================== */}
      <section
        id="hero"
        className="cyber-hero-section"
        aria-label={t.hero.ariaLabel}
        style={{
          borderBottom: `1px solid ${PALETTE.slate}`,
        }}
      >
        <div className="cyber-hero-grid">
          <div className="cyber-hero-copy">
            <HeroEvolveTitle
              replayKey={replayNonce}
              onReplay={() => setReplayNonce((n) => n + 1)}
            />
          </div>

          <div className="cyber-hero-portrait">
            <AsciiPortraitCanvas
              src="/portrait.jpg"
              alt={t.hero.portraitAlt}
              bgColor={PALETTE.bg}
            />
          </div>

          <div className="cyber-hero-cta">
            <p
              style={{
                margin: 0,
                maxWidth: "62ch",
                fontSize: "clamp(1.05rem, 1.4vw, 1.2rem)",
                lineHeight: 1.45,
                fontWeight: 700,
                color: "#F4F3FA",
              }}
            >
              {t.hero.subtitle}
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-start",
                gap: "12px",
              }}
            >
              <Link href="/prenota" className="cyber-ghost-red">
                {t.hero.ctaPrimary}
                <ArrowIcon direction="right" variant="display" />
              </Link>
              <a href="#go-deeper" className="cyber-ghost-white">
                {t.hero.ctaSecondary}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 02 — GO DEEPER ("FUNZIONARE NON SIGNIFICA ESSERE AL SICURO")
       * =================================================================== */}
      <section
        id="go-deeper"
        aria-label={t.goDeeper.ariaLabel}
        style={{
          minHeight: "88vh",
          borderBottom: `1px solid ${PALETTE.slate}`,
          padding: "clamp(48px, 7vw, 96px) clamp(20px, 4vw, 48px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            position: "relative",
            border: "1px solid #1f1d21",
            background: "#020206",
            padding: "clamp(28px, 5vw, 64px) clamp(20px, 4vw, 48px)",
            overflow: "hidden",
          }}
        >
          {/* Tunnel prospettico 3D pixel-locked di sfondo */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.58,
            }}
          >
            <PixelDitherCanvas
              kind="tunnel"
              color={PALETTE.blue}
              width={720}
              height={420}
              cellSize={6}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                fontSize: "clamp(2.15rem, 6vw, 5.4rem)",
                lineHeight: 0.92,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                color: PALETTE.ink,
              }}
            >
              {t.goDeeper.titleLine1}
              <br />
              <span style={{ color: "#F4F3FA" }}>{t.goDeeper.titleLine2}</span>
            </h2>

            <div
              style={{
                margin: "32px auto 0 auto",
                maxWidth: "66ch",
                width: "100%",
                textAlign: "left",
                background: "rgba(1, 1, 1, 0.9)",
                padding: "clamp(20px, 3vw, 32px)",
                border: "1px solid #262428",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <p style={{ margin: 0, fontSize: "14.5px", lineHeight: 1.65, color: PALETTE.ink }}>
                {t.goDeeper.p1}
              </p>
              <p
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  fontWeight: 700,
                  color: "#F4F3FA",
                  borderLeft: `3px solid ${PALETTE.red}`,
                  paddingLeft: "14px",
                }}
              >
                {t.goDeeper.p2}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 04 — LE TRE RISPOSTE AL CAMBIAMENTO (RETOOL / ADAPT / EVOLVE)
       * =================================================================== */}
      <section
        id="risposte"
        aria-label={t.risposte.ariaLabel}
        style={{ borderBottom: `1px solid ${PALETTE.slate}` }}
      >
        {/* Intestazione Sezione 04 */}
        <div
          style={{
            padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px) clamp(56px, 7vw, 88px)",
            borderBottom: `2px solid ${PALETTE.bg}`,
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <h2
              style={{
                margin: 0,
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                fontSize: "clamp(2.8rem, 6.2vw, 5.4rem)",
                lineHeight: 1.28,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                color: PALETTE.ink,
              }}
            >
              {t.risposte.headingLine1}
              <br />
              {t.risposte.headingLine2}
            </h2>
          </div>
        </div>

        {/* 3 Bande Widescreen con figure 3D in Bayer dither (torus / mutant / hollowCube) */}
        {DIFF_BANDS.map((band) => {
          const bandCopy = t.risposte.bands[band.word];
          return (
            <div
              key={band.word}
              style={{
                background: band.bg,
                color: band.fg,
                borderBottom: `2px solid ${PALETTE.bg}`,
                padding: "clamp(40px, 6vw, 76px) clamp(20px, 4vw, 48px)",
              }}
            >
              <div
                style={{
                  maxWidth: "1280px",
                  margin: "0 auto",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  alignItems: "center",
                  gap: "36px",
                }}
              >
                {/* Parte SX: Figura 3D dithered + Badge parola */}
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "260px",
                  }}
                >
                  <PixelDitherCanvas
                    kind={band.scene}
                    color={PALETTE.bg}
                    width={420}
                    height={280}
                    cellSize={5}
                    style={{ width: "100%", maxWidth: "420px", height: "auto" }}
                  />
                  <div style={{ position: "absolute", left: "8%", top: "50%", transform: "translateY(-50%)" }}>
                    <PixelDissolveBadge
                      text={band.word}
                      bg={band.badgeBg}
                      fg={band.badgeFg}
                      fontSize="clamp(2.4rem, 5vw, 4.2rem)"
                      padding="0.1em 0.28em"
                    />
                  </div>
                </div>

                {/* Parte DX: Risposta strategica */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: DISPLAY_FONT,
                      fontSize: "clamp(1.9rem, 3.3vw, 2.7rem)",
                      lineHeight: 0.98,
                      textTransform: "uppercase",
                    }}
                  >
                    {bandCopy.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "10px",
                      minHeight: "104px",
                    }}
                  >
                    {bandCopy.body.map((paragraph, idx) => (
                      <p key={idx} style={{ margin: 0, fontSize: "14px", lineHeight: 1.65 }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: "6px",
                      padding: "14px 16px",
                      background: PALETTE.bg,
                      color: PALETTE.ink,
                      fontSize: "13.5px",
                      lineHeight: 1.6,
                      fontWeight: 700,
                    }}
                  >
                    {bandCopy.statement}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* =====================================================================
       * 05 — A CHI MI RIVOLGO (PMI / Startup / Multinazionali)
       * =================================================================== */}
      <section
        id="a-chi-mi-rivolgo"
        aria-label={t.targetsHome.ariaLabel}
        style={{
          position: "relative",
          minHeight: "88vh",
          borderBottom: `1px solid ${PALETTE.slate}`,
          padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px)",
          overflow: "hidden",
        }}
      >
        {/* Cupola antracite in dither sullo sfondo */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: "min(900px, 100%)",
            pointerEvents: "none",
            opacity: 0.85,
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
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
          }}
        >
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
            <h2
              style={{
                margin: 0,
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                fontSize: "clamp(2.25rem, 5.1vw, 4.5rem)",
                lineHeight: 1.24,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                color: PALETTE.ink,
              }}
            >
              {t.targetsHome.titleLine1}
              <br />
              {t.targetsHome.titleLine2Prefix}
              <span
                style={{
                  color: buyer.badgeColor === PALETTE.ink ? "#F4F3FA" : buyer.badgeColor,
                  transition: "color 220ms cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                {t.targetsHome.titleEmphasis}
              </span>
            </h2>
          </div>

          {/* 3 Card selezionabili per tipologia di realtà aziendale */}
          <div
            role="tablist"
            aria-label={t.targetsHome.tablistAriaLabel}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gridAutoRows: "1fr",
              gap: "10px",
            }}
          >
            {(Object.keys(buyerSegments) as BuyerSegmentKey[]).map((key) => {
              const seg = buyerSegments[key];
              const isSelected = activeBuyer === key;
              const selectedInk = seg.badgeColor === PALETTE.ink ? PALETTE.bg : "#ffffff";
              return (
                <button
                  key={key}
                  id={`home-buyer-tab-${key}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="home-buyer-tabpanel"
                  className="cyber-home-tab"
                  onClick={() => setActiveBuyer(key)}
                  style={{
                    padding: "20px",
                    minHeight: "119px",
                    height: "100%",
                    textAlign: "left",
                    background: isSelected ? seg.badgeColor : "#08080a",
                    color: isSelected ? selectedInk : PALETTE.ink,
                    border: `1px solid ${isSelected ? seg.badgeColor : "#2b292e"}`,
                    borderRadius: 0,
                    cursor: "pointer",
                    fontFamily: MONO_FONT,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: DISPLAY_FONT,
                      fontSize: "1.55rem",
                      textTransform: "uppercase",
                      lineHeight: 1.05,
                    }}
                  >
                    {seg.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Scheda sintetica ad altezza costante su tutti gli scenari */}
          <div
            id="home-buyer-tabpanel"
            role="tabpanel"
            aria-labelledby={`home-buyer-tab-${activeBuyer}`}
            style={{
              border: `1px solid ${buyer.badgeColor}`,
              background: "rgba(1, 1, 1, 0.94)",
              minHeight: "290px",
              display: "grid",
              transition: "border-color 180ms ease",
            }}
          >
            {(Object.keys(buyerSegments) as BuyerSegmentKey[]).map((key) => {
              const seg = buyerSegments[key];
              const isActive = key === activeBuyer;
              const headlineStyle: CSSProperties = {
                margin: 0,
                fontFamily: DISPLAY_FONT,
                fontSize: "clamp(1.7rem, 3.2vw, 2.5rem)",
                lineHeight: 1.12,
                textTransform: "uppercase",
                textWrap: "balance",
                color: "#F4F3FA",
              };
              const ctaStyle: CSSProperties = {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45em",
                minWidth: "min(100%, 304px)",
                padding: "14px 24px",
                minHeight: "48px",
                background: seg.badgeColor,
                color: seg.badgeColor === PALETTE.ink ? PALETTE.bg : "#ffffff",
                fontFamily: DISPLAY_FONT,
                fontSize: "1.25rem",
                lineHeight: 1,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: 0,
              };

              return (
                <div
                  key={key}
                  aria-hidden={!isActive || undefined}
                  style={{
                    gridArea: "1 / 1",
                    minWidth: 0,
                    padding: "clamp(32px, 5vw, 56px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: "28px",
                    visibility: isActive ? "visible" : "hidden",
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                >
                  {isActive ? (
                    <h3 style={headlineStyle}>{seg.headline}</h3>
                  ) : (
                    <div style={headlineStyle}>{seg.headline}</div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {isActive ? (
                      <>
                        <Link
                          href="/prenota"
                          className={`cyber-segment-solid ${seg.solidButtonClass}`}
                          style={ctaStyle}
                        >
                          {seg.cta}
                          <ArrowIcon direction="right" variant="display" />
                        </Link>

                        <Link href={`/per-chi#${key}`} className="cyber-home-deep-link">
                          {t.targetsHome.deepLinkPrefix} {seg.shortLabel}
                          <ArrowIcon direction="right" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <span style={ctaStyle}>
                          {seg.cta}
                          <ArrowIcon direction="right" variant="display" />
                        </span>

                        <span className="cyber-home-deep-link">
                          {t.targetsHome.deepLinkPrefix} {seg.shortLabel}
                          <ArrowIcon direction="right" />
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 06 — LA CONCLUSIONE ("IL PROSSIMO ATTACCO NON TI AVVISERÀ.")
       * =================================================================== */}
      <section
        id="conclusione"
        aria-label={t.conclusion.ariaLabel}
        style={{
          background: PALETTE.ink,
          color: PALETTE.bg,
          position: "relative",
          minHeight: "calc(100svh - 54px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "clamp(48px, 6vw, 84px) clamp(20px, 4vw, 48px) clamp(64px, 9vh, 108px)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "920px",
            width: "100%",
            margin: "0 auto",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              paddingTop: "0.1em",
              fontFamily: DISPLAY_FONT,
              fontWeight: 700,
              fontSize: "clamp(2.75rem, 8vw, 6.5rem)",
              lineHeight: 1.22,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: PALETTE.bg,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.06em",
            }}
          >
            <span>{t.conclusion.line1}</span>
            <span>{t.conclusion.line2}</span>
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              maxWidth: "56ch",
              marginTop: "8px",
            }}
          >
            <p style={{ margin: 0, fontSize: "14.5px", lineHeight: 1.65, color: "#1B1A1D" }}>
              {t.conclusion.p1}
            </p>
            <p style={{ margin: "2px 0", fontSize: "16px", lineHeight: 1.55, fontWeight: 700, color: PALETTE.bg }}>
              {t.conclusion.p2}
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", marginTop: "8px" }}>
            <Link
              href="/prenota"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45em",
                padding: "16px 28px",
                background: PALETTE.bg,
                color: PALETTE.ink,
                fontFamily: DISPLAY_FONT,
                fontSize: "1.35rem",
                lineHeight: 1,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: 0,
              }}
            >
              {t.conclusion.ctaPrimary}
              <ArrowIcon direction="right" variant="display" />
            </Link>
            <a
              href={PHONE_NUMBER}
              style={{
                padding: "16px 24px",
                background: PALETTE.ink,
                color: PALETTE.bg,
                border: `2px solid ${PALETTE.bg}`,
                fontFamily: MONO_FONT,
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {t.conclusion.ctaDirect}
            </a>
          </div>
        </div>

        {/* Sole / Semisfera rossa dithered sullo sfondo in basso */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            zIndex: 1,
            width: "min(640px, 100%)",
            pointerEvents: "none",
          }}
        >
          <PixelDitherCanvas
            kind="sunDome"
            color={PALETTE.red}
            width={640}
            height={220}
            cellSize={6}
            interactive={false}
            style={{ display: "block", width: "100%", height: "auto" }}
          />
        </div>
      </section>
    </div>
  );
}
