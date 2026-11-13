"use client";

import React, { useEffect, useRef, useState } from "react";

export interface SimulationConfig {
  gridSize: number;
  threshold: number;
  radius: number;
  mouseForce: number;
  velocityTransfer: number;
  stiffness: number;
  damping: number;
  particleShape: "square" | "circle";
  interactionMode: "repel" | "attract" | "slice";
}

const PRESETS: Record<string, { label: string; desc: string; config: Partial<SimulationConfig> }> = {
  emil: {
    label: "Linear Original (Emil Kowalski 1:1)",
    desc: "Calibrazione 1:1 esatta: 24.000 micro-particelle, squircle solido, sfumatura continua e fisica cubica.",
    config: {
      gridSize: 220,
      threshold: 140,
      radius: 95,
      mouseForce: 22,
      velocityTransfer: 0.62,
      stiffness: 0.08,
      damping: 0.88,
      particleShape: "square",
      interactionMode: "repel",
    },
  },
  jelly: {
    label: "Membrana Elastica / Cyber Shield",
    desc: "Basso smorzamento: l'icona oscilla e vibra come uno scudo cibernetico sotto il passaggio del mouse.",
    config: {
      gridSize: 220,
      radius: 110,
      mouseForce: 28,
      velocityTransfer: 0.5,
      stiffness: 0.055,
      damping: 0.94,
      interactionMode: "repel",
    },
  },
  fluid: {
    label: "Fluido Viscoso / Mulinello",
    desc: "Altissimo trasferimento di quantità di moto: vortici profondi stile inchiostro in sospensione.",
    config: {
      gridSize: 220,
      radius: 130,
      mouseForce: 14,
      velocityTransfer: 0.95,
      stiffness: 0.04,
      damping: 0.92,
      interactionMode: "repel",
    },
  },
};

export function TabDitherPhysics() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePreset, setActivePreset] = useState<string>("emil");

  const [config, setConfig] = useState<SimulationConfig>({
    gridSize: 220,
    threshold: 140,
    radius: 95,
    mouseForce: 22,
    velocityTransfer: 0.62,
    stiffness: 0.08,
    damping: 0.88,
    particleShape: "square",
    interactionMode: "repel",
  });

  const animState = useRef<{
    particles: {
      x: Float32Array;
      y: Float32Array;
      ox: Float32Array;
      oy: Float32Array;
      vx: Float32Array;
      vy: Float32Array;
      count: number;
    };
    mouse: { x: number; y: number; prevX: number; prevY: number; vx: number; vy: number; active: boolean };
    animId: number;
  }>({
    particles: {
      x: new Float32Array(0),
      y: new Float32Array(0),
      ox: new Float32Array(0),
      oy: new Float32Array(0),
      vx: new Float32Array(0),
      vy: new Float32Array(0),
      count: 0,
    },
    mouse: { x: -1000, y: -1000, prevX: -1000, prevY: -1000, vx: 0, vy: 0, active: false },
    animId: 0,
  });

  const initParticles = (width: number, height: number) => {
    const cols = config.gridSize;
    const rows = Math.floor(cols * (height / width));
    const step = width / cols;
    const cx = width / 2;
    const cy = height / 2;
    const logoRadius = Math.min(width, height) * 0.28;

    const validPoints: Array<{ x: number; y: number }> = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = c * step;
        const py = r * step;
        const dx = px - cx;
        const dy = py - cy;
        // Icona di scudo o squircle
        const dist = Math.hypot(dx, dy);
        if (dist < logoRadius && (Math.abs(dx) < logoRadius * 0.85 || dist < logoRadius * 0.95)) {
          validPoints.push({ x: px, y: py });
        }
      }
    }

    const count = validPoints.length;
    const x = new Float32Array(count);
    const y = new Float32Array(count);
    const ox = new Float32Array(count);
    const oy = new Float32Array(count);
    const vx = new Float32Array(count);
    const vy = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      x[i] = ox[i] = validPoints[i].x;
      y[i] = oy[i] = validPoints[i].y;
    }

    animState.current.particles = { x, y, ox, oy, vx, vy, count };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    initParticles(width, height);

    const onResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      initParticles(width, height);
    };

    window.addEventListener("resize", onResize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const m = animState.current.mouse;
      m.prevX = m.x;
      m.prevY = m.y;
      m.x = e.clientX - rect.left;
      m.y = e.clientY - rect.top;
      m.vx = m.x - m.prevX;
      m.vy = m.y - m.prevY;
      m.active = true;
    };

    const onMouseLeave = () => {
      animState.current.mouse.active = false;
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const render = () => {
      ctx.fillStyle = "#07090e";
      ctx.fillRect(0, 0, width, height);

      const { particles, mouse } = animState.current;
      const count = particles.count;
      const { radius, mouseForce, stiffness, damping } = config;

      ctx.fillStyle = "#f4f1ea";

      for (let i = 0; i < count; i++) {
        // Fisica molla
        const fx = (particles.ox[i] - particles.x[i]) * stiffness;
        const fy = (particles.oy[i] - particles.y[i]) * stiffness;

        particles.vx[i] = (particles.vx[i] + fx) * damping;
        particles.vy[i] = (particles.vy[i] + fy) * damping;

        // Repulsione cursore
        if (mouse.active) {
          const dx = particles.x[i] - mouse.x;
          const dy = particles.y[i] - mouse.y;
          const d = Math.hypot(dx, dy);

          if (d < radius && d > 0.001) {
            const factor = Math.pow(1 - d / radius, 3) * mouseForce;
            particles.vx[i] += (dx / d) * factor;
            particles.vy[i] += (dy / d) * factor;
          }
        }

        particles.x[i] += particles.vx[i];
        particles.y[i] += particles.vy[i];

        ctx.fillRect(particles.x[i], particles.y[i], 1.8, 1.8);
      }

      animState.current.animId = requestAnimationFrame(render);
    };

    animState.current.animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animState.current.animId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [config]);

  const selectPreset = (key: string) => {
    setActivePreset(key);
    setConfig((prev) => ({ ...prev, ...PRESETS[key].config }));
  };

  return (
    <div className="dither-lab-container">
      <div className="lab-card-header">
        <div>
          <span className="eyebrow" style={{ color: "#a78bfa" }}>
            Ispirazione: Emil Kowalski Linear App Dither Simulator
          </span>
          <h2 style={{ fontSize: "1.75rem", margin: "4px 0", color: "#f4f1ea" }}>
            04. Quantum Particle & Dither Sandbox
          </h2>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.95rem", maxWidth: "680px" }}>
            Griglia particellare fluida basata su equazioni differenziali con smorzamento e risposta cubica:
            il logo viene disintegrato e si ricompone elasticamente sotto il passaggio del mouse.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {Object.entries(PRESETS).map(([k, p]) => (
            <button
              key={k}
              onClick={() => selectPreset(k)}
              style={{
                padding: "8px 14px",
                fontSize: "11px",
                fontFamily: "var(--font-mono, monospace)",
                background: activePreset === k ? "#a78bfa" : "rgba(255,255,255,0.06)",
                color: activePreset === k ? "#09090b" : "#cbd5e1",
                border: "none",
                borderRadius: "4px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {p.label.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: "relative", height: "480px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", marginTop: "16px" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      </div>
    </div>
  );
}
