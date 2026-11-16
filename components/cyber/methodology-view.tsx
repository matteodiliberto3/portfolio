"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowIcon } from "@/components/cyber/arrow-icon";
import {
  DISPLAY_FONT,
  MONO_FONT,
  PALETTE,
  PixelDitherCanvas,
  PixelDissolveBadge,
  type DitherSceneKind,
} from "@/components/cyber/dither-primitives";

const RE_PILLARS: Array<{
  prefix: string;
  verb: string;
  color: string;
  scene: DitherSceneKind;
  title: string;
  body: string[];
}> = [
  {
    prefix: "DE",
    verb: "CONSTRUCT",
    color: PALETTE.red,
    scene: "cube",
    title: "Prima capiamo come funziona.",
    body: [
      "Ogni azienda utilizza tecnologie diverse. Partiamo dai sistemi, dagli accessi e dalle applicazioni che sostengono il suo lavoro, per capire dove concentrare le verifiche.",
    ],
  },
  {
    prefix: "EX",
    verb: "PLOIT",
    color: "#8B46FF",
    scene: "exploitCube",
    title: "Poi mettiamo alla prova la sicurezza.",
    body: [
      "Con test autorizzati e mirati, verifichiamo se determinate debolezze possano essere realmente sfruttate.",
      "Perché conoscere una vulnerabilità è diverso dal capire quali conseguenze potrebbe avere.",
    ],
  },
  {
    prefix: "RE",
    verb: "MEDIATE",
    color: PALETTE.ink,
    scene: "cluster",
    title: "Infine, capiamo cosa correggere.",
    body: [
      "Le verifiche devono produrre risposte, non soltanto elenchi di problemi.",
      "Le criticità individuate vengono spiegate, documentate e tradotte in indicazioni operative, così da poter decidere dove intervenire e con quale priorità.",
    ],
  },
];

export function MethodologyView() {
  const [cubeExploded, setCubeExploded] = useState(false);
  const [exploitActive, setExploitActive] = useState(false);
  const pillar0Ref = useRef<HTMLDivElement | null>(null);
  const pillar1Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const checkScrollCards = () => {
      const vh = window.innerHeight;
      const el0 = pillar0Ref.current;
      if (el0) {
        const r0 = el0.getBoundingClientRect();
        const c0 = r0.top + r0.height * 0.5;
        if (c0 <= vh * 0.58 && r0.bottom >= vh * 0.25) {
          setCubeExploded(true);
        } else if (r0.top > vh * 0.48) {
          setCubeExploded(false);
        }
      }

      const el1 = pillar1Ref.current;
      if (el1) {
        const r1 = el1.getBoundingClientRect();
        const c1 = r1.top + r1.height * 0.5;
        if (c1 <= vh * 0.58 && r1.bottom >= vh * 0.25) {
          setExploitActive(true);
        } else if (r1.top > vh * 0.48) {
          setExploitActive(false);
        }
      }
    };

    checkScrollCards();
    window.addEventListener("scroll", checkScrollCards, { passive: true });
    window.addEventListener("resize", checkScrollCards);
    return () => {
      window.removeEventListener("scroll", checkScrollCards);
      window.removeEventListener("resize", checkScrollCards);
    };
  }, []);

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
       * METODOLOGIA ("NON PUOI PROTEGGERE CIÒ CHE NON CONOSCI.")
       * =================================================================== */}
      <section
        id="metodo"
        aria-labelledby="metodologia-heading"
        style={{
          padding: "clamp(48px, 7vw, 96px) clamp(20px, 4vw, 48px)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "clamp(36px, 5vw, 56px)",
          }}
        >
          {/* Intestazione Metodologia */}
          <div style={{ maxWidth: "68ch" }}>
            <h1
              id="metodologia-heading"
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
              NON PUOI PROTEGGERE
              <br />
              CIÒ CHE NON CONOSCI.
            </h1>
          </div>

          {/* 3 Card grandi in sticky stacking */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18vh",
              paddingBottom: "6vh",
            }}
          >
            {RE_PILLARS.map((item, idx) => (
              <div
                key={item.verb}
                ref={idx === 0 ? pillar0Ref : idx === 1 ? pillar1Ref : undefined}
                style={{
                  position: "sticky",
                  top: `${72 + idx * 24}px`,
                  zIndex: idx + 1,
                  minHeight: "min(72vh, 560px)",
                  background: "#050507",
                  border: "1px solid #262428",
                  borderTop: `3px solid ${item.color}`,
                  boxShadow: idx > 0 ? "0 -28px 60px rgba(0, 0, 0, 0.9)" : "none",
                  padding: "clamp(28px, 4.5vw, 56px)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  alignItems: "center",
                  gap: "32px",
                }}
              >
                {/* Colonna SX: Fase + Verbo + Spiegazione chiara */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: PALETTE.dim,
                      letterSpacing: "0.12em",
                    }}
                  >
                    FASE 0{idx + 1}
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.14em", flexWrap: "wrap" }}>
                    <PixelDissolveBadge
                      text={item.prefix}
                      bg={item.color}
                      fg={PALETTE.bg}
                      fontSize="clamp(2.8rem, 5.2vw, 4.8rem)"
                      padding="0.06em 0.18em"
                    />
                    <span
                      style={{
                        fontFamily: DISPLAY_FONT,
                        fontWeight: 700,
                        fontSize: "clamp(2.8rem, 5.2vw, 4.8rem)",
                        lineHeight: 0.92,
                        letterSpacing: "-0.02em",
                        color: PALETTE.ink,
                        textTransform: "uppercase",
                      }}
                    >
                      {item.verb}
                    </span>
                  </div>
                  <h2
                    style={{
                      margin: "6px 0 0 0",
                      fontSize: "clamp(1.05rem, 1.45vw, 1.25rem)",
                      lineHeight: 1.4,
                      fontWeight: 700,
                      color: "#F4F3FA",
                    }}
                  >
                    {item.title}
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "48ch" }}>
                    {item.body.map((paragraph) => (
                      <p
                        key={paragraph}
                        style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: "#B8B6BA" }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Colonna DX: Solido 3D */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <PixelDitherCanvas
                    kind={item.scene}
                    color={item.color}
                    width={380}
                    height={270}
                    cellSize={5}
                    explode={idx === 0 && cubeExploded ? 1 : idx === 1 && exploitActive ? 1 : 0}
                    style={{ width: "100%", maxWidth: "380px", height: "auto" }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              paddingTop: "24px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: 1.6,
                fontStyle: "italic",
                color: PALETTE.ink,
              }}
            >
              La consapevolezza, da sola, non basta. Deve portare a una decisione.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <Link
                href="/prenota"
                className="cyber-action-primary"
                style={{
                  padding: "14px 24px",
                  minHeight: "48px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45em",
                  background: PALETTE.red,
                  color: "#ffffff",
                  fontFamily: DISPLAY_FONT,
                  fontSize: "1.25rem",
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
              <Link
                href="/"
                className="cyber-action-secondary"
                style={{
                  padding: "14px 20px",
                  minHeight: "48px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "transparent",
                  color: PALETTE.ink,
                  border: `1px solid ${PALETTE.ink}`,
                  fontFamily: MONO_FONT,
                  fontSize: "12px",
                  lineHeight: 1,
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 0,
                }}
              >
                <ArrowIcon direction="left" />
                Torna alla home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
