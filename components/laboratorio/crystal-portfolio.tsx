"use client";

import React, { useRef, useEffect, useState } from "react";

export function CrystalPortfolio() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "work">("work");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 540);

    const mouse = { x: width / 2, y: height / 2, tx: width / 2, ty: height / 2 };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - rect.left;
      mouse.ty = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", onMouseMove);

    let angleX = 0;
    let angleY = 0;
    let animId = 0;

    // Vertici di un cristallo 3D ottaedrico (icosaedro/prisma sfaccettato)
    const vertices = [
      { x: 0, y: -130, z: 0 },
      { x: 110, y: 0, z: 110 },
      { x: -110, y: 0, z: 110 },
      { x: -110, y: 0, z: -110 },
      { x: 110, y: 0, z: -110 },
      { x: 0, y: 130, z: 0 },
    ];

    const faces = [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
      [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]
    ];

    const render = () => {
      // Easing cursore
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;

      angleX += 0.008 + (mouse.y - height / 2) * 0.00004;
      angleY += 0.012 + (mouse.x - width / 2) * 0.00004;

      ctx.fillStyle = "#07090e";
      ctx.fillRect(0, 0, width, height);

      // 1. Testo gigante retrostante (dietro al cristallo)
      ctx.save();
      ctx.font = "bold clamp(40px, 8vw, 92px) var(--font-sans, sans-serif)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Dispersione cromatica canale Rosso
      ctx.fillStyle = "rgba(244, 63, 94, 0.4)";
      ctx.fillText("CYBER SECURITY", width / 2 - 4, height / 2 - 2);

      // Canale Ciano
      ctx.fillStyle = "rgba(45, 212, 191, 0.4)";
      ctx.fillText("CYBER SECURITY", width / 2 + 4, height / 2 + 2);

      // Testo principale
      ctx.fillStyle = "#f4f1ea";
      ctx.fillText("CYBER SECURITY", width / 2, height / 2);

      ctx.font = "14px var(--font-mono, monospace)";
      ctx.fillStyle = "#64748b";
      ctx.fillText("MATTEO DI LIBERTO // OFFENSIVE AUDIT & PENETRATION TESTING", width / 2, height / 2 + 65);
      ctx.restore();

      // 2. Rotazione 3D e proiezione prospettica del cristallo
      const cx = mouse.x;
      const cy = mouse.y;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const projected = vertices.map((v) => {
        // Rotazione Y
        const x1 = v.x * cosY - v.z * sinY;
        const z1 = v.z * cosY + v.x * sinY;
        // Rotazione X
        const y2 = v.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + v.y * sinX;

        const distance = 450;
        const fov = distance / (distance + z2);

        return {
          x: cx + x1 * fov,
          y: cy + y2 * fov,
          z: z2,
        };
      });

      // 3. Disegno facce rifrangenti con specular gradient
      faces.forEach((f, idx) => {
        const p1 = projected[f[0]];
        const p2 = projected[f[1]];
        const p3 = projected[f[2]];

        // Calcolo normale per backface culling & shading
        const v1x = p2.x - p1.x;
        const v1y = p2.y - p1.y;
        const v2x = p3.x - p1.x;
        const v2y = p3.y - p1.y;
        const normalZ = v1x * v2y - v1y * v2x;

        if (normalZ > 0) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();

          const grad = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
          grad.addColorStop(0, `rgba(45, 212, 191, ${0.18 + (idx % 3) * 0.08})`);
          grad.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
          grad.addColorStop(1, `rgba(168, 85, 247, ${0.15 + (idx % 2) * 0.1})`);

          ctx.fillStyle = grad;
          ctx.fill();

          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div style={{ margin: "20px 0" }}>
      <div style={{ marginBottom: "16px" }}>
        <span className="eyebrow" style={{ color: "#a855f7" }}>
          Ispirazione Esatta dal Video: DaikiFujita.com
        </span>
        <h2 style={{ fontSize: "1.8rem", margin: "4px 0", color: "#f4f1ea" }}>
          Il Cristallo / Prisma di Rifrazione Ottica
        </h2>
        <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.95rem" }}>
          Un prisma WebGL fluido al centro dello schermo che riflette e distorce otticamente il testo retrostante
          in base al movimento del cursore, con dispersione cromatica RGB e specular highlights.
        </p>
      </div>

      <div style={{ position: "relative", height: "540px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

        <div style={{ position: "absolute", bottom: "16px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", background: "rgba(10,13,20,0.85)", backdropFilter: "blur(8px)", padding: "4px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={() => setActiveTab("work")}
            style={{
              padding: "6px 16px",
              borderRadius: "999px",
              border: "none",
              background: activeTab === "work" ? "#f4f1ea" : "transparent",
              color: activeTab === "work" ? "#09090b" : "#9ca3af",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            WORK
          </button>
          <button
            onClick={() => setActiveTab("about")}
            style={{
              padding: "6px 16px",
              borderRadius: "999px",
              border: "none",
              background: activeTab === "about" ? "#f4f1ea" : "transparent",
              color: activeTab === "about" ? "#09090b" : "#9ca3af",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ABOUT
          </button>
        </div>
      </div>
    </div>
  );
}
