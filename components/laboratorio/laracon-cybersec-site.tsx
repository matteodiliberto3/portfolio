"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowIcon } from "@/components/cyber/arrow-icon";
import { AsciiPortraitCanvas } from "@/components/laboratorio/ascii-portrait-canvas";
import {
  BUYER_SEGMENTS,
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
  word: string;
  bg: string;
  fg: string;
  badgeBg: string;
  badgeFg: string;
  scene: DitherSceneKind;
  title: string;
  body: string[];
  statement: string;
}> = [
  {
    word: "RETOOL",
    bg: PALETTE.blue,
    fg: "#F4F3FA",
    badgeBg: PALETTE.bg,
    badgeFg: PALETTE.ink,
    scene: "torus",
    title: "Rimetti in discussione i tuoi strumenti.",
    body: [
      "Un sistema datato, un software non supportato o una tecnologia mai aggiornata possono diventare un punto debole.",
    ],
    statement:
      "Aggiornare non significa necessariamente sostituire tutto. Significa capire cosa mantenere, cosa migliorare e cosa non puoi più trascurare.",
  },
  {
    word: "ADAPT",
    bg: PALETTE.red,
    fg: "#F4F3FA",
    badgeBg: PALETTE.bg,
    badgeFg: PALETTE.ink,
    scene: "mutant",
    title: "Cambia il modo in cui affronti i rischi.",
    body: [
      "Non basta installare una nuova tecnologia se continui a utilizzarla con le stesse abitudini.",
    ],
    statement:
      "La sicurezza dipende dalle tecnologie, ma anche dalle decisioni e dai comportamenti di chi le utilizza.",
  },
  {
    word: "EVOLVE",
    bg: PALETTE.ink,
    fg: PALETTE.bg,
    badgeBg: PALETTE.bg,
    badgeFg: PALETTE.ink,
    scene: "hollowCube",
    title: "Non aspettare che sia un problema a farti cambiare.",
    body: [
      "Le minacce evolvono, le tecnologie cambiano e gli obblighi normativi con esse.",
    ],
    statement:
      "Evolvere significa imparare a riconoscere quando è il momento di verificare, aggiornare e migliorare ciò su cui si basa la tua attività.",
  },
];

/* ============================================================================
 * COMPONENTE PRINCIPALE: SITO CYBERSEC IN STILE LARACON AU 26
 * ========================================================================== */
export function LaraconCybersecSite() {
  const [replayNonce, setReplayNonce] = useState(0);
  const [activeBuyer, setActiveBuyer] = useState<BuyerSegmentKey>("pmi");

  const buyer = BUYER_SEGMENTS[activeBuyer];

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
        aria-label="Il cambiamento digitale"
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
              alt="Ritratto di Matteo Di Liberto in stile ASCII art"
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
              La tua azienda è rimasta al passo?
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
                Parliamo della tua azienda
                <ArrowIcon direction="right" variant="display" />
              </Link>
              <a href="#go-deeper" className="cyber-ghost-white">
                Scopri cosa è cambiato ↓
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
        aria-label="La consapevolezza: funzionare non significa essere al sicuro"
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
              Funzionare
              <br />
              <span style={{ color: "#F4F3FA" }}>non significa essere al sicuro</span>
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
                La tua azienda può operare ogni giorno senza mostrare segnali di problemi, ma avere vulnerabilità che nessuno sta controllando.
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
                Con l&apos;evoluzione delle minacce e delle responsabilità normative, conoscere i propri rischi digitali è il primo passo per proteggersi.
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
        aria-label="Le tre risposte al cambiamento: Retool, Adapt, Evolve"
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
              IL MONDO CAMBIA.
              <br />
              RESTARE FERMI È UNA SCELTA.
            </h2>
          </div>
        </div>

        {/* 3 Bande Widescreen con figure 3D in Bayer dither (torus / mutant / hollowCube) */}
        {DIFF_BANDS.map((band) => (
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
                  {band.title}
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
                  {band.body.map((paragraph) => (
                    <p key={paragraph} style={{ margin: 0, fontSize: "14px", lineHeight: 1.65 }}>
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
                  {band.statement}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* =====================================================================
       * 05 — A CHI MI RIVOLGO (PMI / Startup / Multinazionali)
       * =================================================================== */}
      <section
        id="a-chi-mi-rivolgo"
        aria-label="A chi mi rivolgo: Imprenditori e PMI, Startup e software house, Multinazionali"
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
              OGNI AZIENDA HA QUALCOSA
              <br />
              CHE NON PUÒ PERMETTERSI{" "}
              <span
                style={{
                  color: buyer.badgeColor === PALETTE.ink ? "#F4F3FA" : buyer.badgeColor,
                  transition: "color 220ms cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                DI PERDERE.
              </span>
            </h2>
          </div>

          {/* 3 Card selezionabili per tipologia di realtà aziendale */}
          <div
            role="tablist"
            aria-label="Seleziona il tipo di realtà aziendale"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "10px",
            }}
          >
            {(Object.keys(BUYER_SEGMENTS) as BuyerSegmentKey[]).map((key) => {
              const seg = BUYER_SEGMENTS[key];
              const isSelected = activeBuyer === key;
              const selectedInk = seg.badgeColor === PALETTE.ink ? PALETTE.bg : "#ffffff";
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className="cyber-home-tab"
                  onClick={() => setActiveBuyer(key)}
                  style={{
                    padding: "20px",
                    minHeight: "119px",
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

          {/* Scheda sintetica per la realtà selezionata */}
          <div
            role="tabpanel"
            style={{
              border: `1px solid ${buyer.badgeColor}`,
              background: "rgba(1, 1, 1, 0.94)",
              padding: "clamp(32px, 5vw, 56px)",
              minHeight: "290px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "28px",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontFamily: DISPLAY_FONT,
                fontSize: "clamp(1.7rem, 3.2vw, 2.5rem)",
                lineHeight: 1.12,
                textTransform: "uppercase",
                textWrap: "balance",
                color: "#F4F3FA",
              }}
            >
              {buyer.headline}
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <Link
                href="/prenota"
                className={`cyber-segment-solid ${buyer.solidButtonClass}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45em",
                  minWidth: "min(100%, 304px)",
                  padding: "14px 24px",
                  minHeight: "48px",
                  background: buyer.badgeColor,
                  color: buyer.badgeColor === PALETTE.ink ? PALETTE.bg : "#ffffff",
                  fontFamily: DISPLAY_FONT,
                  fontSize: "1.25rem",
                  lineHeight: 1,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 0,
                }}
              >
                {buyer.cta}
                <ArrowIcon direction="right" variant="display" />
              </Link>

              <Link href={`/per-chi#${activeBuyer}`} className="cyber-home-deep-link">
                Approfondisci: {buyer.shortLabel}
                <ArrowIcon direction="right" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 06 — LA CONCLUSIONE ("IL PROSSIMO ATTACCO NON TI AVVISERÀ.")
       * =================================================================== */}
      <section
        id="conclusione"
        aria-label="Dalla consapevolezza all'azione"
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
            <span>IL PROSSIMO ATTACCO</span>
            <span>NON TI AVVISERÀ.</span>
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
              Ma questo non significa che tu debba aspettarlo per iniziare a porti le domande giuste.
            </p>
            <p style={{ margin: "2px 0", fontSize: "16px", lineHeight: 1.55, fontWeight: 700, color: PALETTE.bg }}>
              Non devi conoscere tutte le risposte oggi. Devi sapere da dove iniziare a cercarle.
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
              Prenota un primo confronto
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
              Contatto diretto
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
