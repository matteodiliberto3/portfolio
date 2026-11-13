"use client";

import React, { useState, useRef, useEffect } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "CRIT" | "SUCCESS";
  module: string;
  message: string;
}

export function TabObsidianSoc() {
  // Tilt 3D per le card
  const [cardTilt, setCardTilt] = useState<{ [key: string]: { rotateX: number; rotateY: number; mouseX: number; mouseY: number } }>({});

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "1", timestamp: "14:52:01", level: "INFO", module: "INGRESS", message: "TLS 1.3 Handshake completed. Cipher: TLS_AES_256_GCM_SHA384." },
    { id: "2", timestamp: "14:52:08", level: "WARN", module: "WAF_PROBE", message: "Suspicious payload in /api/v1/auth: ' OR 1=1-- detected from 194.26.29.11" },
    { id: "3", timestamp: "14:52:12", level: "SUCCESS", module: "DEVSECOPS", message: "Strix SARIF scan on PR #142: 0 Critical, 0 High vulnerabilities." },
    { id: "4", timestamp: "14:52:19", level: "CRIT", module: "IDOR_WATCH", message: "Unusual cross-tenant query ID 9842 blocked by scope policy." },
    { id: "5", timestamp: "14:52:25", level: "SUCCESS", module: "HARDENING", message: "Zero-Trust policy enforced. Token re-signed with rotating KMS key." },
  ]);

  const [cmdInput, setCmdInput] = useState("");
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, cardKey: string) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setCardTilt((prev) => ({
      ...prev,
      [cardKey]: { rotateX, rotateY, mouseX: x, mouseY: y },
    }));
  };

  const handleCardMouseLeave = (cardKey: string) => {
    setCardTilt((prev) => ({
      ...prev,
      [cardKey]: { rotateX: 0, rotateY: 0, mouseX: -100, mouseY: -100 },
    }));
  };

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const now = new Date().toTimeString().split(" ")[0];

    if (!trimmed) return;

    if (trimmed === "clear") {
      setLogs([]);
      setCmdInput("");
      return;
    }

    let newEntries: LogEntry[] = [];

    if (trimmed.startsWith("scan")) {
      newEntries = [
        { id: Math.random().toString(), timestamp: now, level: "INFO", module: "SCANNER", message: `Initiating full scope audit on target surface...` },
        { id: Math.random().toString(), timestamp: now, level: "WARN", module: "PORT_PROBE", message: "Port 8080/TCP exposed without Mutual TLS authentication." },
        { id: Math.random().toString(), timestamp: now, level: "SUCCESS", module: "AUDIT_DONE", message: "Vulnerability analysis complete: 1 finding cataloged with PoC." },
      ];
    } else if (trimmed.includes("exploit") || trimmed.includes("test")) {
      newEntries = [
        { id: Math.random().toString(), timestamp: now, level: "WARN", module: "EXPLOIT_LAB", message: "Injecting simulated Broken Object Authorization payload..." },
        { id: Math.random().toString(), timestamp: now, level: "CRIT", module: "EXPLOIT_LAB", message: "Cross-Tenant Scope Breach Confirmed! Severity CVSS 9.1" },
      ];
    } else if (trimmed.includes("harden") || trimmed.includes("patch")) {
      newEntries = [
        { id: Math.random().toString(), timestamp: now, level: "INFO", module: "HARDENING", message: "Applying Next.js Middleware cryptographic isolation patch..." },
        { id: Math.random().toString(), timestamp: now, level: "SUCCESS", module: "HARDENING", message: "All API routes secured. Re-test passed with 0 leaks." },
      ];
    } else if (trimmed === "help") {
      newEntries = [
        { id: Math.random().toString(), timestamp: now, level: "INFO", module: "HELP", message: "Available commands: 'scan', 'exploit', 'harden', 'status', 'clear'" },
      ];
    } else {
      newEntries = [
        { id: Math.random().toString(), timestamp: now, level: "INFO", module: "SHELL", message: `Command executed: '${trimmed}'. Type 'help' for options.` },
      ];
    }

    setLogs((prev) => [...prev, ...newEntries]);
    setCmdInput("");
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="obsidian-lab-container">
      <div className="lab-card-header">
        <div>
          <span className="eyebrow" style={{ color: "#d6f25a" }}>
            Ispirazione: BunqLabs, Daiki Fujita & Shopify Editions 3D Shaders
          </span>
          <h2 style={{ fontSize: "1.75rem", margin: "4px 0", color: "#f4f1ea" }}>
            03. Obsidian Hologram & Live SOC Terminal
          </h2>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.95rem", maxWidth: "680px" }}>
            Estetica dark lussuosa: superfici in ossidiana, card con tilt tridimensionale 3D guidato dalla gravità del cursore,
            e una console Security Operations interattiva con live log stream e comandi digitabili.
          </p>
        </div>
      </div>

      {/* Grid delle 3 Card Olografiche 3D */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          margin: "24px 0",
          perspective: "1200px",
        }}
      >
        {/* Card 1 */}
        <div
          onMouseMove={(e) => handleCardMouseMove(e, "card1")}
          onMouseLeave={() => handleCardMouseLeave("card1")}
          style={{
            position: "relative",
            background: "linear-gradient(145deg, #0e121b 0%, #06080d 100%)",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            transform: `rotateX(${cardTilt.card1?.rotateX || 0}deg) rotateY(${cardTilt.card1?.rotateY || 0}deg)`,
            transition: "transform 0.12s ease-out, border-color 0.2s",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          {/* Riflesso speculare neon */}
          <div
            style={{
              position: "absolute",
              top: (cardTilt.card1?.mouseY || -200) - 150,
              left: (cardTilt.card1?.mouseX || -200) - 150,
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, rgba(214, 242, 90, 0.15) 0%, rgba(214, 242, 90, 0) 70%)",
              pointerEvents: "none",
              borderRadius: "50%",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "#d6f25a", fontWeight: 600 }}>
              UNIT 01 // OFFENSIVE
            </span>
            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "rgba(214, 242, 90, 0.1)", color: "#d6f25a" }}>
              ACTIVE
            </span>
          </div>
          <h3 style={{ fontSize: "1.3rem", color: "#f4f1ea", margin: "0 0 10px 0" }}>
            Penetration Testing Manuale
          </h3>
          <p style={{ fontSize: "0.88rem", color: "#9ca3af", lineHeight: "1.5", margin: "0 0 16px 0" }}>
            Simulazione di attacchi reali mirata alla business logic, bypass di privilegi orizzontali, e discovery di zero-day senza dipendere da scanner automatici.
          </p>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "#64748b" }}>
            CVSS 9.8 PROOF · BURP SUITE PRO · ZERO FAKE ALERTS
          </div>
        </div>

        {/* Card 2 */}
        <div
          onMouseMove={(e) => handleCardMouseMove(e, "card2")}
          onMouseLeave={() => handleCardMouseLeave("card2")}
          style={{
            position: "relative",
            background: "linear-gradient(145deg, #0e121b 0%, #06080d 100%)",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            transform: `rotateX(${cardTilt.card2?.rotateX || 0}deg) rotateY(${cardTilt.card2?.rotateY || 0}deg)`,
            transition: "transform 0.12s ease-out, border-color 0.2s",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: (cardTilt.card2?.mouseY || -200) - 150,
              left: (cardTilt.card2?.mouseX || -200) - 150,
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0) 70%)",
              pointerEvents: "none",
              borderRadius: "50%",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "#38bdf8", fontWeight: 600 }}>
              UNIT 02 // DEVSECOPS
            </span>
            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8" }}>
              CONTINUOUS
            </span>
          </div>
          <h3 style={{ fontSize: "1.3rem", color: "#f4f1ea", margin: "0 0 10px 0" }}>
            Automated CI/CD Security
          </h3>
          <p style={{ fontSize: "0.88rem", color: "#9ca3af", lineHeight: "1.5", margin: "0 0 16px 0" }}>
            Gate differenziali su ogni Pull Request: il pentesting autonomo con Strix prova ogni vulnerabilità con PoC prima che il codice arrivi in produzione.
          </p>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "#64748b" }}>
            SARIF REPORTS · GITHUB ACTIONS · DIFF TESTING
          </div>
        </div>

        {/* Card 3 */}
        <div
          onMouseMove={(e) => handleCardMouseMove(e, "card3")}
          onMouseLeave={() => handleCardMouseLeave("card3")}
          style={{
            position: "relative",
            background: "linear-gradient(145deg, #0e121b 0%, #06080d 100%)",
            borderRadius: "12px",
            padding: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            transform: `rotateX(${cardTilt.card3?.rotateX || 0}deg) rotateY(${cardTilt.card3?.rotateY || 0}deg)`,
            transition: "transform 0.12s ease-out, border-color 0.2s",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: (cardTilt.card3?.mouseY || -200) - 150,
              left: (cardTilt.card3?.mouseX || -200) - 150,
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)",
              pointerEvents: "none",
              borderRadius: "50%",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "#c084fc", fontWeight: 600 }}>
              UNIT 03 // AI DEFENSE
            </span>
            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "rgba(168, 85, 247, 0.1)", color: "#c084fc" }}>
              NEW VECTORS
            </span>
          </div>
          <h3 style={{ fontSize: "1.3rem", color: "#f4f1ea", margin: "0 0 10px 0" }}>
            AI & MLOps Red Teaming
          </h3>
          <p style={{ fontSize: "0.88rem", color: "#9ca3af", lineHeight: "1.5", margin: "0 0 16px 0" }}>
            Protezione contro attacchi di nuova generazione: isolamento di agenti autonomi, mitigazione di indirect prompt injection e crittografia per banche vettoriali RAG.
          </p>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "#64748b" }}>
            PROMPT SHIELDS · RAG SANITIZATION · ZERO EXFILTRATION
          </div>
        </div>
      </div>

      {/* Terminale SOC Interattivo Live */}
      <div
        style={{
          background: "#05070a",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            background: "#0c0f16",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f43f5e", display: "inline-block" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ marginLeft: "8px", fontSize: "11px", color: "#94a3b8" }}>
              MATTEO-DILIBERTO // SECURITY-OPERATIONS-TERMINAL v2.4.0
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => executeCommand("scan")}
              style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#cbd5e1", fontSize: "11px", padding: "4px 8px", borderRadius: "3px", cursor: "pointer" }}
            >
              + Scan Target
            </button>
            <button
              onClick={() => executeCommand("exploit")}
              style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e", fontSize: "11px", padding: "4px 8px", borderRadius: "3px", cursor: "pointer" }}
            >
              + Test Exploit
            </button>
            <button
              onClick={() => executeCommand("harden")}
              style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.3)", color: "#2dd4bf", fontSize: "11px", padding: "4px 8px", borderRadius: "3px", cursor: "pointer" }}
            >
              + Apply Patch
            </button>
          </div>
        </div>

        {/* Log Viewer */}
        <div style={{ padding: "16px", maxHeight: "240px", overflowY: "auto", fontSize: "12px", lineHeight: "1.7" }}>
          {logs.map((log) => {
            let color = "#94a3b8";
            if (log.level === "CRIT") color = "#f43f5e";
            if (log.level === "WARN") color = "#f59e0b";
            if (log.level === "SUCCESS") color = "#2dd4bf";

            return (
              <div key={log.id} style={{ display: "flex", gap: "10px" }}>
                <span style={{ color: "#475569" }}>[{log.timestamp}]</span>
                <span style={{ color, minWidth: "75px", fontWeight: 600 }}>[{log.level}]</span>
                <span style={{ color: "#64748b" }}>[{log.module}]</span>
                <span style={{ color: "#f4f1ea" }}>{log.message}</span>
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Line Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeCommand(cmdInput);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "#080b10",
          }}
        >
          <span style={{ color: "#2dd4bf", marginRight: "10px", fontWeight: 600 }}>❯</span>
          <input
            type="text"
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            placeholder="Digita un comando (es. 'scan', 'exploit', 'harden', 'clear') e premi Invio..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "#f4f1ea",
              fontSize: "12px",
              fontFamily: "var(--font-mono, monospace)",
              outline: "none",
            }}
          />
        </form>
      </div>

      <div style={{ marginTop: "20px", padding: "14px 18px", background: "rgba(255,255,255,0.03)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.9rem", color: "#cbd5e1" }}>
        <strong style={{ color: "#d6f25a" }}>🎯 Come si applicherebbe alla Home di Matteo:</strong>{" "}
        Le <strong>card olografiche 3D con specular lighting</strong> possono diventare la vetrina principale dei servizi nella Home, donando un senso di profondità hardware/blueprint militare irresistibile. Il terminale SOC interattivo può essere inserito come prova tangibile dell&apos;approccio operativo a riga di comando.
      </div>
    </div>
  );
}
