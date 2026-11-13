"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface Node {
  id: string;
  name: string;
  type: "api" | "db" | "cloud" | "auth" | "llm" | "firewall";
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  radius: number;
  status: "secure" | "warning" | "breached" | "isolated";
  cve?: string;
  traffic: number;
}

interface Edge {
  source: number;
  target: number;
  strength: number;
}

export function TabTopologyMesh() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [threatLevel, setThreatLevel] = useState<"low" | "medium" | "critical">("low");
  const [attackMode, setAttackMode] = useState<boolean>(false);
  const [stats, setStats] = useState({ nodes: 38, links: 52, defendedAttacks: 1240, activeScan: true });

  const stateRef = useRef<{
    nodes: Node[];
    edges: Edge[];
    mouse: { x: number; y: number; active: boolean; radius: number; isDown: boolean };
    pulses: Array<{ x: number; y: number; r: number; maxR: number; color: string; alpha: number }>;
    animId: number;
  }>({
    nodes: [],
    edges: [],
    mouse: { x: -1000, y: -1000, active: false, radius: 140, isDown: false },
    pulses: [],
    animId: 0,
  });

  const initGraph = useCallback((width: number, height: number) => {
    const types: Array<Node["type"]> = ["api", "db", "cloud", "auth", "llm", "firewall"];
    const names = [
      "gw.api.main", "auth.oauth2", "db.customer.sharded", "cache.redis.01",
      "k8s.ingress.traefik", "agent.llm.orchestrator", "rag.vector.milvus", "iam.vault.kms",
      "srv.billing.stripe", "waf.cloudflare.edge", "worker.celery.ml", "log.siem.splunk",
      "audit.strix.probe", "api.graphql.mesh", "broker.kafka.events", "vpn.wireguard.hub"
    ];

    const nodeCount = 36;
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const type = types[i % types.length];
      const name = names[i % names.length] + (i >= names.length ? `.${Math.floor(i / names.length)}` : "");
      const padding = 80;
      const x = padding + Math.random() * (width - padding * 2);
      const y = padding + Math.random() * (height - padding * 2);

      nodes.push({
        id: `node-${i}`,
        name,
        type,
        x,
        y,
        ox: x,
        oy: y,
        vx: 0,
        vy: 0,
        radius: type === "firewall" || type === "auth" ? 8 : 6,
        status: "secure",
        traffic: Math.random() * 0.8 + 0.2,
      });
    }

    // Costruisci link di prossimità
    const edges: Edge[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].ox - nodes[j].ox;
        const dy = nodes[i].oy - nodes[j].oy;
        const dist = Math.hypot(dx, dy);
        if (dist < 140 && Math.random() > 0.35) {
          edges.push({ source: i, target: j, strength: 1 - dist / 140 });
        }
      }
    }

    stateRef.current.nodes = nodes;
    stateRef.current.edges = edges;
    setStats((prev) => ({ ...prev, nodes: nodes.length, links: edges.length }));
  }, []);

  const triggerShockwave = (x: number, y: number, color = "rgba(45, 212, 191, 0.8)") => {
    stateRef.current.pulses.push({
      x,
      y,
      r: 10,
      maxR: 260,
      color,
      alpha: 1.0,
    });
  };

  const simulatePenetrationScan = () => {
    setAttackMode(true);
    setThreatLevel("critical");
    const { nodes } = stateRef.current;
    
    // Compromette 2 nodi casuali e scatena l'alert
    const targetIdx1 = Math.floor(Math.random() * nodes.length);
    const targetIdx2 = (targetIdx1 + 5) % nodes.length;

    nodes[targetIdx1].status = "breached";
    nodes[targetIdx1].cve = "CVE-2024-BOLA-IDOR";
    nodes[targetIdx2].status = "warning";
    nodes[targetIdx2].cve = "EXPOSED_CREDENTIAL";

    setSelectedNode(nodes[targetIdx1]);
    triggerShockwave(nodes[targetIdx1].x, nodes[targetIdx1].y, "rgba(244, 63, 94, 0.9)");

    setTimeout(() => {
      // Automazione hardening
      nodes[targetIdx1].status = "isolated";
      triggerShockwave(nodes[targetIdx1].x, nodes[targetIdx1].y, "rgba(56, 189, 248, 0.9)");
      setThreatLevel("medium");

      setTimeout(() => {
        nodes[targetIdx1].status = "secure";
        nodes[targetIdx2].status = "secure";
        setAttackMode(false);
        setThreatLevel("low");
        setStats((prev) => ({ ...prev, defendedAttacks: prev.defendedAttacks + 1 }));
      }, 2500);
    }, 2000);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 560);

    initGraph(width, height);

    const onResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      initGraph(width, height);
    };

    window.addEventListener("resize", onResize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouse.x = e.clientX - rect.left;
      stateRef.current.mouse.y = e.clientY - rect.top;
      stateRef.current.mouse.active = true;
    };

    const onMouseLeave = () => {
      stateRef.current.mouse.active = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      stateRef.current.mouse.isDown = true;
      triggerShockwave(mx, my, "rgba(52, 211, 153, 0.85)");

      // Trova se è stato cliccato un nodo
      const clicked = stateRef.current.nodes.find((n) => Math.hypot(n.x - mx, n.y - my) < n.radius + 8);
      if (clicked) {
        setSelectedNode(clicked);
      }
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("mousedown", onMouseDown);

    let frame = 0;
    const render = () => {
      frame++;
      ctx.fillStyle = "#07090e";
      ctx.fillRect(0, 0, width, height);

      // Sfondo a griglia tattica / radar blueprint
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const { nodes, edges, mouse, pulses } = stateRef.current;

      // 1. Onde d'urto / shockwaves
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.r += 4.5;
        p.alpha -= 0.018;
        if (p.alpha <= 0 || p.r >= p.maxR) {
          pulses.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.strokeStyle = p.color.replace(/[\d\.]+\)$/, `${p.alpha})`);
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 2. Radar sweep del mouse
      if (mouse.active) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, mouse.radius);
        grad.addColorStop(0, "rgba(45, 212, 191, 0.08)");
        grad.addColorStop(1, "rgba(45, 212, 191, 0.00)");
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = "rgba(45, 212, 191, 0.25)";
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Calcolo fisica dei nodi (molla verso origine + repulsione mouse)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Forza di richiamo elastico verso ox, oy
        const k = 0.04;
        const fx = (n.ox - n.x) * k;
        const fy = (n.oy - n.y) * k;
        n.vx = (n.vx + fx) * 0.88;
        n.vy = (n.vy + fy) * 0.88;

        // Repulsione cursore
        if (mouse.active) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < mouse.radius && d > 0.001) {
            const force = (1 - d / mouse.radius) * 6.5;
            n.vx += (dx / d) * force;
            n.vy += (dy / d) * force;
          }
        }

        n.x += n.vx;
        n.y += n.vy;
      }

      // 4. Disegno collegamenti (edges) con pacchetti dati che scorrono
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        const s = nodes[e.source];
        const t = nodes[e.target];

        const isAlertEdge = s.status === "breached" || t.status === "breached";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = isAlertEdge
          ? "rgba(244, 63, 94, 0.45)"
          : `rgba(45, 212, 191, ${0.12 * e.strength})`;
        ctx.lineWidth = isAlertEdge ? 1.5 : 1;
        ctx.stroke();

        // Pacchetto dati che scorre sulla linea
        const speed = 0.003 * (i % 2 === 0 ? 1 : -1);
        const progress = (frame * speed + i * 0.15) % 1;
        const px = s.x + (t.x - s.x) * Math.abs(progress);
        const py = s.y + (t.y - s.y) * Math.abs(progress);

        ctx.beginPath();
        ctx.arc(px, py, isAlertEdge ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isAlertEdge ? "#f43f5e" : "#5eead4";
        ctx.fill();
      }

      // 5. Disegno nodi
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHovered = mouse.active && Math.hypot(n.x - mouse.x, n.y - mouse.y) < n.radius + 12;

        let fillColor = "#14b8a6";
        let glowColor = "rgba(20, 184, 166, 0.4)";

        if (n.status === "breached") {
          fillColor = "#f43f5e";
          glowColor = "rgba(244, 63, 94, 0.7)";
        } else if (n.status === "warning") {
          fillColor = "#f59e0b";
          glowColor = "rgba(245, 158, 11, 0.6)";
        } else if (n.status === "isolated") {
          fillColor = "#38bdf8";
          glowColor = "rgba(56, 189, 248, 0.5)";
        }

        // Alone luminoso
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + (isHovered ? 6 : 2), 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();

        // Nucleo solido
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Etichetta micro-monospace
        if (isHovered || n.status !== "secure") {
          ctx.font = "10px var(--font-mono, monospace)";
          ctx.fillStyle = "#f4f1ea";
          ctx.fillText(n.name, n.x + 12, n.y + 3);

          if (n.cve) {
            ctx.fillStyle = "#f43f5e";
            ctx.fillText(n.cve, n.x + 12, n.y + 16);
          }
        }
      }

      stateRef.current.animId = requestAnimationFrame(render);
    };

    stateRef.current.animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(stateRef.current.animId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("mousedown", onMouseDown);
    };
  }, [initGraph]);

  return (
    <div className="mesh-lab-container">
      <div className="lab-card-header">
        <div>
          <span className="eyebrow" style={{ color: "#2dd4bf" }}>
            Ispirazione: TheStart & NoomoAgency WebGL Physics
          </span>
          <h2 style={{ fontSize: "1.75rem", margin: "4px 0", color: "#f4f1ea" }}>
            01. Interactive Attack Surface & Mesh Shader
          </h2>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.95rem", maxWidth: "680px" }}>
            Mappa topologica dinamica a fisica continua: i nodi rappresentano API, database, policy IAM e gateway cloud.
            Il cursore agisce come probe radarico per rilevare la salute della rete, le porte esposte e mitigare intrusioni in tempo reale.
          </p>
        </div>

        <div className="lab-controls">
          <button
            onClick={simulatePenetrationScan}
            disabled={attackMode}
            className="cta"
            style={{
              padding: "10px 18px",
              fontSize: "0.85rem",
              background: attackMode ? "#f43f5e" : "#2dd4bf",
              color: "#09090b",
              fontWeight: 600,
              borderRadius: "4px",
              cursor: attackMode ? "not-allowed" : "pointer",
            }}
          >
            {attackMode ? "⚠️ Attacco in Corso..." : "⚡ Simula Penetration Test"}
          </button>
        </div>
      </div>

      <div className="lab-canvas-wrapper" style={{ position: "relative", height: "540px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

        {/* HUD Overlay Tattico */}
        <div style={{ position: "absolute", top: 16, left: 16, pointerEvents: "none", display: "flex", gap: "12px", fontFamily: "var(--font-mono, monospace)", fontSize: "11px" }}>
          <div style={{ background: "rgba(10,13,20,0.85)", backdropFilter: "blur(8px)", padding: "8px 12px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
            NODES: <span style={{ color: "#f4f1ea", fontWeight: 600 }}>{stats.nodes}</span>
          </div>
          <div style={{ background: "rgba(10,13,20,0.85)", backdropFilter: "blur(8px)", padding: "8px 12px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
            LINKS: <span style={{ color: "#f4f1ea", fontWeight: 600 }}>{stats.links}</span>
          </div>
          <div style={{ background: "rgba(10,13,20,0.85)", backdropFilter: "blur(8px)", padding: "8px 12px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
            THREAT LEVEL:{" "}
            <span style={{ color: threatLevel === "critical" ? "#f43f5e" : threatLevel === "medium" ? "#f59e0b" : "#2dd4bf", fontWeight: 600 }}>
              {threatLevel.toUpperCase()}
            </span>
          </div>
          <div style={{ background: "rgba(10,13,20,0.85)", backdropFilter: "blur(8px)", padding: "8px 12px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
            INTERCEPTED: <span style={{ color: "#2dd4bf", fontWeight: 600 }}>{stats.defendedAttacks}</span>
          </div>
        </div>

        {/* Dettaglio Nodo Selezionato */}
        {selectedNode && (
          <div style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            background: "rgba(10,13,20,0.92)",
            backdropFilter: "blur(12px)",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid rgba(45,212,191,0.3)",
            maxWidth: "320px",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "12px",
            color: "#f4f1ea"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#2dd4bf", fontWeight: 600 }}>TARGET INSPECTOR</span>
              <button onClick={() => setSelectedNode(null)} style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer" }}>✕</button>
            </div>
            <div>HOST: <span style={{ color: "#f4f1ea" }}>{selectedNode.name}</span></div>
            <div>TYPE: <span style={{ color: "#9ca3af" }}>{selectedNode.type.toUpperCase()}</span></div>
            <div>STATUS: <span style={{ color: selectedNode.status === "breached" ? "#f43f5e" : "#2dd4bf" }}>{selectedNode.status.toUpperCase()}</span></div>
            {selectedNode.cve && <div style={{ color: "#f43f5e", marginTop: "4px" }}>VULN: {selectedNode.cve}</div>}
            <div style={{ marginTop: "10px", fontSize: "10px", color: "#6b7280" }}>
              Clicca su qualsiasi punto del canvas per emettere un impulso radar di test.
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: "16px", padding: "14px 18px", background: "rgba(255,255,255,0.03)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.9rem", color: "#cbd5e1" }}>
        <strong style={{ color: "#2dd4bf" }}>🎯 Come si applicherebbe alla Home di Matteo:</strong>{" "}
        Può fare da sfondo interattivo intero per l&apos;<strong>Hero</strong> o per la sezione <strong>Metodo / Attacco & Difesa</strong>. Invece di una foto statica o un&apos;illustrazione generica, l&apos;utente interagisce direttamente con una mappa d&apos;infrastruttura viva che reagisce con precisione millimetrica al suo passaggio.
      </div>
    </div>
  );
}
