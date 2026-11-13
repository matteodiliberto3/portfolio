"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LaraconCybersecSite } from "@/components/laboratorio/laracon-cybersec-site";
import { BookPortfolio } from "@/components/laboratorio/book-portfolio";
import { CrystalPortfolio } from "@/components/laboratorio/crystal-portfolio";
import { TabTopologyMesh } from "@/components/laboratorio/tab-topology-mesh";
import { TabKineticType } from "@/components/laboratorio/tab-kinetic-type";
import { TabObsidianSoc } from "@/components/laboratorio/tab-obsidian-soc";

export type LabTab = "laracon" | "book" | "crystal" | "mesh" | "kinetic" | "obsidian";

const LAB_TABS: Array<{
  id: LabTab;
  number: string;
  title: string;
  tag: string;
  color: string;
}> = [
  {
    id: "laracon",
    number: "00",
    title: "Sito Cybersec Dither 26 (Laracon Style)",
    tag: "DflaJLXPqWW",
    color: "#3E3EE0",
  },
  {
    id: "book",
    number: "01",
    title: "Dossier Libro 3D",
    tag: "Interactive Dossier",
    color: "#f59e0b",
  },
  {
    id: "crystal",
    number: "02",
    title: "Prisma Ottico",
    tag: "Daiki Fujita",
    color: "#a855f7",
  },
  {
    id: "mesh",
    number: "03",
    title: "Topologia di Rete",
    tag: "TheStart / Noomo",
    color: "#2dd4bf",
  },
  {
    id: "kinetic",
    number: "04",
    title: "Tipografia Cinetica",
    tag: "IMDDay",
    color: "#38bdf8",
  },
  {
    id: "obsidian",
    number: "05",
    title: "Obsidian SOC",
    tag: "BunqLabs",
    color: "#d6f25a",
  },
];

export default function LaboratorioPage() {
  const [activeTab, setActiveTab] = useState<LabTab>("laracon");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#010101",
        color: "#C8C7C9",
        fontFamily: "var(--font-geist-mono), monospace",
      }}
    >
      {/* Top Bar Tattica Compatta */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#010101",
          borderBottom: "1px solid #262428",
          padding: "10px clamp(14px, 3vw, 32px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              background: "#0d0d10",
              color: "#C8C7C9",
              fontSize: "11px",
              letterSpacing: "0.06em",
              textDecoration: "none",
              border: "1px solid #2e2c30",
              borderRadius: 0,
            }}
          >
            ← TORNA AL SITO
          </Link>
          <span style={{ fontSize: "11px", color: "#7C797A", letterSpacing: "0.08em" }}>
            LABORATORIO // CYBERSEC PROTOTIPI
          </span>
        </div>

        {/* Selettore compatto dei prototipi */}
        <nav aria-label="Prototipi di Laboratorio" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {LAB_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "6px 10px",
                  fontSize: "11px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  background: isActive ? tab.color : "transparent",
                  color: isActive ? (tab.id === "laracon" ? "#ffffff" : "#010101") : "#8a8789",
                  border: `1px solid ${isActive ? tab.color : "#262428"}`,
                  borderRadius: 0,
                  cursor: "pointer",
                }}
              >
                {tab.number} // {tab.title}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Vista Principale: Full-Screen per Laracon Cybersec, con padding per gli altri prototipi */}
      {activeTab === "laracon" ? (
        <LaraconCybersecSite />
      ) : (
        <section style={{ padding: "clamp(20px, 4vw, 48px) clamp(16px, 4vw, 64px)", minHeight: "760px" }}>
          {activeTab === "book" && <BookPortfolio />}
          {activeTab === "crystal" && <CrystalPortfolio />}
          {activeTab === "mesh" && <TabTopologyMesh />}
          {activeTab === "kinetic" && <TabKineticType />}
          {activeTab === "obsidian" && <TabObsidianSoc />}
        </section>
      )}
    </main>
  );
}
