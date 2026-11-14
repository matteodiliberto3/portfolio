"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const PHONE_NUMBER = "tel:+393711500055";

/* ============================================================================
 * DESIGN SYSTEM — ESTRATTO DAL REEL "LARACON AU 26 / DEV.OLUTION" (DflaJLXPqWW)
 * Zero sfumature continue · Zero border-radius · 4+1 toni piatti · Bayer Dither
 * ========================================================================== */
const PALETTE = {
  bg: "#010101",
  ink: "#C8C7C9",
  blue: "#3E3EE0",
  red: "#C50B3F",
  slate: "#262428",
  dim: "#7C797A",
} as const;

const DISPLAY_FONT = "var(--font-antonio), Impact, 'Arial Narrow', sans-serif";
const MONO_FONT = "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";

/* Matrice di Bayer 8x8 normalizzata [0..63] per halftone ordinato a pixel fissi */
const BAYER_8X8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

export type DitherSceneKind =
  | "abacus"
  | "matrix"
  | "laptop"
  | "skyline"
  | "wave"
  | "stairs"
  | "tunnel"
  | "cube"
  | "exploitCube"
  | "maze"
  | "cluster"
  | "dome"
  | "torus"
  | "star"
  | "mutant"
  | "hollowCube"
  | "structureRetool"
  | "structureAdapt"
  | "structureEvolve"
  | "sunDome";

interface PixelDitherCanvasProps {
  kind: DitherSceneKind;
  color: string;
  bgColor?: string;
  width?: number;
  height?: number;
  cellSize?: number;
  interactive?: boolean;
  explode?: number;
  className?: string;
  style?: React.CSSProperties;
}

/* Proiezione 3D -> Griglia luminanza discreta senza allocazioni per frame */
type Vec3 = [number, number, number];

function rotatePoint(x: number, y: number, z: number, rx: number, ry: number): Vec3 {
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;

  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  return [x1, y2, z2];
}

function splatPoint(
  buf: Float32Array,
  zBuf: Float32Array,
  cols: number,
  rows: number,
  px: number,
  py: number,
  pz: number,
  val: number,
  radius = 0,
  colorBuf?: Uint8Array,
  colorId = 0,
  replaceCloser = false
) {
  const gx = Math.round(px);
  const gy = Math.round(py);
  for (let dy = -radius; dy <= radius; dy++) {
    const yy = gy + dy;
    if (yy < 0 || yy >= rows) continue;
    for (let dx = -radius; dx <= radius; dx++) {
      const xx = gx + dx;
      if (xx < 0 || xx >= cols) continue;
      if (radius > 0 && dx * dx + dy * dy > radius * radius + 0.35) continue;
      const idx = yy * cols + xx;
      if (replaceCloser) {
        if (pz > zBuf[idx] + 0.03) {
          zBuf[idx] = pz;
          buf[idx] = val;
          if (colorBuf) colorBuf[idx] = colorId;
        } else if (pz >= zBuf[idx] - 0.06) {
          zBuf[idx] = Math.max(zBuf[idx], pz);
          if (val >= buf[idx]) {
            buf[idx] = val;
            if (colorBuf) colorBuf[idx] = colorId;
          } else if (colorBuf && colorId > colorBuf[idx]) {
            colorBuf[idx] = colorId;
          }
        }
      } else if (pz >= zBuf[idx] - 0.15) {
        zBuf[idx] = Math.max(zBuf[idx], pz);
        if (val > buf[idx]) {
          buf[idx] = val;
          if (colorBuf) colorBuf[idx] = colorId;
        }
      }
    }
  }
}

function drawLine3D(
  buf: Float32Array,
  zBuf: Float32Array,
  cols: number,
  rows: number,
  a: Vec3,
  b: Vec3,
  rx: number,
  ry: number,
  scale: number,
  cx: number,
  cy: number,
  lum: number,
  radius = 0,
  colorBuf?: Uint8Array,
  colorId = 0,
  replaceCloser = false
) {
  const p1 = rotatePoint(a[0], a[1], a[2], rx, ry);
  const p2 = rotatePoint(b[0], b[1], b[2], rx, ry);
  const steps = Math.max(8, Math.ceil(Math.hypot((p2[0] - p1[0]) * scale, (p2[1] - p1[1]) * scale) * 1.4));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = p1[0] + (p2[0] - p1[0]) * t;
    const y = p1[1] + (p2[1] - p1[1]) * t;
    const z = p1[2] + (p2[2] - p1[2]) * t;
    const persp = 4.2 / (4.2 - Math.min(3.3, z) * 0.42);
    const sx = cx + x * scale * persp;
    const sy = cy + y * scale * persp;
    const shade = Math.min(1, lum * (0.65 + (z + 1.2) * 0.28));
    splatPoint(buf, zBuf, cols, rows, sx, sy, z, shade, radius, colorBuf, colorId, replaceCloser);
  }
}

function drawFilledBox3D(
  buf: Float32Array,
  zBuf: Float32Array,
  cols: number,
  rows: number,
  center: Vec3,
  half: Vec3,
  rx: number,
  ry: number,
  scale: number,
  cx: number,
  cy: number,
  density = 12,
  explodeOffset = 0
) {
  // Campiona le 6 facce del parallelepipedo in object space con shading direzionale netto
  const faces: Array<{ normal: Vec3; u: Vec3; v: Vec3; fixed: Vec3; light: number }> = [
    { normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], fixed: [0, 0, half[2] + explodeOffset], light: 0.96 },
    { normal: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0], fixed: [0, 0, -half[2] - explodeOffset], light: 0.38 },
    { normal: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], fixed: [half[0] + explodeOffset, 0, 0], light: 0.78 },
    { normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], fixed: [-half[0] - explodeOffset, 0, 0], light: 0.28 },
    { normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], fixed: [0, -half[1] - explodeOffset, 0], light: 0.88 },
    { normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], fixed: [0, half[1] + explodeOffset, 0], light: 0.22 },
  ];

  for (const face of faces) {
    const rn = rotatePoint(face.normal[0], face.normal[1], face.normal[2], rx, ry);
    if (explodeOffset < 0.04 && rn[2] < -0.15) continue; // Back-face culling solo quando è chiuso
    const lDot = Math.max(0.18, Math.abs(rn[0] * 0.45 - rn[1] * 0.55 + rn[2] * 0.72));
    const val = Math.min(1, face.light * 0.45 + lDot * 0.65);

    const suMax = face.u[0] ? half[0] : face.u[1] ? half[1] : half[2];
    const svMax = face.v[0] ? half[0] : face.v[1] ? half[1] : half[2];
    const stepsU = Math.max(4, Math.ceil(suMax * density));
    const stepsV = Math.max(4, Math.ceil(svMax * density));

    for (let iu = 0; iu <= stepsU; iu++) {
      const fu = -1 + (2 * iu) / stepsU;
      for (let iv = 0; iv <= stepsV; iv++) {
        const fv = -1 + (2 * iv) / stepsV;
        const ox = center[0] + face.fixed[0] + face.u[0] * suMax * fu + face.v[0] * svMax * fv;
        const oy = center[1] + face.fixed[1] + face.u[1] * suMax * fu + face.v[1] * svMax * fv;
        const oz = center[2] + face.fixed[2] + face.u[2] * suMax * fu + face.v[2] * svMax * fv;

        const rp = rotatePoint(ox, oy, oz, rx, ry);
        const persp = 4.5 / (4.5 - rp[2] * 0.4);
        const sx = cx + rp[0] * scale * persp;
        const sy = cy + rp[1] * scale * persp;

        const isEdge = iu === 0 || iu === stepsU || iv === 0 || iv === stepsV;
        splatPoint(buf, zBuf, cols, rows, sx, sy, rp[2], isEdge ? Math.min(1, val + 0.16) : val, 0);
      }
    }
  }
}

function drawRotatedBox3D(
  buf: Float32Array,
  zBuf: Float32Array,
  cols: number,
  rows: number,
  center: Vec3,
  half: Vec3,
  boxRx: number,
  boxRy: number,
  rx: number,
  ry: number,
  scale: number,
  cx: number,
  cy: number,
  density = 16,
  lumBoost = 0,
  colorBuf?: Uint8Array,
  colorId = 0,
  replaceCloser = true
) {
  const faces: Array<{ normal: Vec3; u: Vec3; v: Vec3; fixed: Vec3; light: number }> = [
    { normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], fixed: [0, 0, half[2]], light: 0.96 },
    { normal: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0], fixed: [0, 0, -half[2]], light: 0.44 },
    { normal: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], fixed: [half[0], 0, 0], light: 0.8 },
    { normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], fixed: [-half[0], 0, 0], light: 0.4 },
    { normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], fixed: [0, -half[1], 0], light: 0.88 },
    { normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], fixed: [0, half[1], 0], light: 0.34 },
  ];

  for (const face of faces) {
    const ln = rotatePoint(face.normal[0], face.normal[1], face.normal[2], boxRx, boxRy);
    const rn = rotatePoint(ln[0], ln[1], ln[2], rx, ry);
    if (rn[2] < -0.18) continue;
    const lDot = Math.max(0.24, Math.abs(rn[0] * 0.45 - rn[1] * 0.55 + rn[2] * 0.72));
    const val = Math.min(0.92, face.light * 0.4 + lDot * 0.55 + lumBoost);

    const suMax = face.u[0] ? half[0] : face.u[1] ? half[1] : half[2];
    const svMax = face.v[0] ? half[0] : face.v[1] ? half[1] : half[2];
    const stepsU = Math.max(4, Math.ceil(suMax * density));
    const stepsV = Math.max(4, Math.ceil(svMax * density));

    for (let iu = 0; iu <= stepsU; iu++) {
      const fu = -1 + (2 * iu) / stepsU;
      for (let iv = 0; iv <= stepsV; iv++) {
        const fv = -1 + (2 * iv) / stepsV;
        const lx = face.fixed[0] + face.u[0] * suMax * fu + face.v[0] * svMax * fv;
        const ly = face.fixed[1] + face.u[1] * suMax * fu + face.v[1] * svMax * fv;
        const lz = face.fixed[2] + face.u[2] * suMax * fu + face.v[2] * svMax * fv;
        const br = rotatePoint(lx, ly, lz, boxRx, boxRy);
        const rp = rotatePoint(center[0] + br[0], center[1] + br[1], center[2] + br[2], rx, ry);
        const persp = 4.5 / (4.5 - Math.min(3.4, rp[2]) * 0.4);
        const sx = cx + rp[0] * scale * persp;
        const sy = cy + rp[1] * scale * persp;
        const isEdge = iu === 0 || iu === stepsU || iv === 0 || iv === stepsV;
        splatPoint(
          buf,
          zBuf,
          cols,
          rows,
          sx,
          sy,
          rp[2],
          isEdge ? Math.min(1, val + 0.22) : val,
          0,
          colorBuf,
          colorId,
          replaceCloser
        );
      }
    }
  }
}

function drawQuadZ3D(
  buf: Float32Array,
  zBuf: Float32Array,
  cols: number,
  rows: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z: number,
  rx: number,
  ry: number,
  scale: number,
  cx: number,
  cy: number,
  val: number,
  rimHighlight: number,
  density = 15,
  colorBuf?: Uint8Array,
  colorId = 0
) {
  const stepsX = Math.max(3, Math.ceil(Math.abs(x1 - x0) * density));
  const stepsY = Math.max(3, Math.ceil(Math.abs(y1 - y0) * density));
  for (let ix = 0; ix <= stepsX; ix++) {
    const x = x0 + ((x1 - x0) * ix) / stepsX;
    for (let iy = 0; iy <= stepsY; iy++) {
      const y = y0 + ((y1 - y0) * iy) / stepsY;
      const rp = rotatePoint(x, y, z, rx, ry);
      const persp = 4.5 / (4.5 - Math.min(3.4, rp[2]) * 0.4);
      const sx = cx + rp[0] * scale * persp;
      const sy = cy + rp[1] * scale * persp;
      const isOuter = ix === 0 || ix === stepsX || iy === 0 || iy === stepsY;
      splatPoint(
        buf,
        zBuf,
        cols,
        rows,
        sx,
        sy,
        rp[2],
        isOuter ? Math.min(1, val + rimHighlight) : val,
        0,
        colorBuf,
        colorId,
        true
      );
    }
  }
}

function drawEvolvingStructure3D(
  stage: 0 | 1 | 2,
  buf: Float32Array,
  zBuf: Float32Array,
  cols: number,
  rows: number,
  t: number,
  mx: number,
  my: number,
  baseScale: number,
  cx: number,
  cy: number
) {
  const rx = 0.5 + my * 0.35;
  const ry = t * 0.54 + mx * 0.5;
  const s = baseScale * 0.9;
  const d = 0.72;
  const thick = stage === 2 ? 0.13 : 0.11;

  // Stessa architettura a 12 travi esterne + nucleo centrale + 6 moduli assiali vista in 3 stati progressivi
  const beams: Array<{ c: Vec3; h: Vec3 }> = [
    { c: [0, -d, -d], h: [d, thick, thick] },
    { c: [0, d, -d], h: [d, thick, thick] },
    { c: [0, -d, d], h: [d, thick, thick] },
    { c: [0, d, d], h: [d, thick, thick] },
    { c: [-d, 0, -d], h: [thick, d, thick] },
    { c: [d, 0, -d], h: [thick, d, thick] },
    { c: [-d, 0, d], h: [thick, d, thick] },
    { c: [d, 0, d], h: [thick, d, thick] },
    { c: [-d, -d, 0], h: [thick, thick, d] },
    { c: [d, -d, 0], h: [thick, thick, d] },
    { c: [-d, d, 0], h: [thick, thick, d] },
    { c: [d, d, 0], h: [thick, thick, d] },
  ];

  const adaptPulse = 0.5 + 0.5 * Math.sin(t * 2.0);

  for (let i = 0; i < beams.length; i++) {
    const beam = beams[i];
    if (stage === 0) {
      // RETOOL: alcune travi mancano (lacune strutturali) e altre sono staccate e inclinate
      if (i === 1 || i === 5 || i === 11) continue;
      if (i === 0 || i === 6 || i === 9) {
        const drift = 0.24 + 0.05 * Math.sin(t * 1.8 + i);
        const dc: Vec3 = [
          beam.c[0] + (beam.c[0] === 0 ? 0.16 : Math.sign(beam.c[0]) * drift),
          beam.c[1] + (beam.c[1] === 0 ? -0.14 : Math.sign(beam.c[1]) * drift),
          beam.c[2] + (beam.c[2] === 0 ? 0.12 : Math.sign(beam.c[2]) * drift),
        ];
        drawRotatedBox3D(buf, zBuf, cols, rows, dc, beam.h, 0.28 + i * 0.07, -0.24, rx, ry, s, cx, cy, 10, 0, undefined, 0, false);
        continue;
      }
      drawFilledBox3D(buf, zBuf, cols, rows, beam.c, beam.h, rx, ry, s, cx, cy, 8);
    } else if (stage === 1) {
      // ADAPT: la cornice viene ricomposta con guide assiali verso la posizione finale
      const isRealigning = i === 1 || i === 5 || i === 9;
      const offset = isRealigning ? (1 - adaptPulse) * 0.24 : 0;
      const cc: Vec3 = [
        beam.c[0] + (offset > 0 ? Math.sign(beam.c[0] || 1) * offset : 0),
        beam.c[1] + (offset > 0 ? Math.sign(beam.c[1] || -1) * offset : 0),
        beam.c[2] + (offset > 0 ? Math.sign(beam.c[2] || 1) * offset : 0),
      ];
      if (offset > 0.03) {
        drawLine3D(buf, zBuf, cols, rows, beam.c, cc, rx, ry, s, cx, cy, 0.72, 0);
      }
      drawFilledBox3D(buf, zBuf, cols, rows, cc, beam.h, rx, ry, s, cx, cy, 8);
    } else {
      // EVOLVE: tutte e 12 le travi della gabbia protettiva sono bloccate e coese
      drawFilledBox3D(buf, zBuf, cols, rows, beam.c, beam.h, rx, ry, s, cx, cy, 8);
    }
  }

  // Nucleo centrale della struttura
  const coreHalf = stage === 0 ? 0.22 : stage === 1 ? 0.29 : 0.35;
  drawFilledBox3D(buf, zBuf, cols, rows, [0, 0, 0], [coreHalf, coreHalf, coreHalf], rx, ry, s, cx, cy, 11);

  // 6 moduli/piastre funzionali lungo gli assi: dispersi (0), in allineamento (1), agganciati al nucleo (2)
  const plateAxes: Array<{ dir: Vec3; half: Vec3 }> = [
    { dir: [0, 0, 1], half: [0.22, 0.22, 0.06] },
    { dir: [0, 0, -1], half: [0.22, 0.22, 0.06] },
    { dir: [1, 0, 0], half: [0.06, 0.22, 0.22] },
    { dir: [-1, 0, 0], half: [0.06, 0.22, 0.22] },
    { dir: [0, 1, 0], half: [0.22, 0.06, 0.22] },
    { dir: [0, -1, 0], half: [0.22, 0.06, 0.22] },
  ];

  for (let i = 0; i < plateAxes.length; i++) {
    const p = plateAxes[i];
    if (stage === 0) {
      const dist = 0.56 + 0.1 * Math.sin(t * 1.5 + i * 1.1);
      const pos: Vec3 = [
        p.dir[0] * dist + Math.sin(i * 2.1) * 0.1,
        p.dir[1] * dist + Math.cos(i * 1.7) * 0.1,
        p.dir[2] * dist,
      ];
      drawRotatedBox3D(buf, zBuf, cols, rows, pos, p.half, 0.34 + i * 0.14, 0.26 - i * 0.1, rx, ry, s, cx, cy, 11, 0, undefined, 0, false);
    } else if (stage === 1) {
      const slide = 0.35 + 0.22 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 0.9));
      const pos: Vec3 = [p.dir[0] * slide, p.dir[1] * slide, p.dir[2] * slide];
      drawLine3D(buf, zBuf, cols, rows, [0, 0, 0], pos, rx, ry, s, cx, cy, 0.65, 0);
      drawFilledBox3D(buf, zBuf, cols, rows, pos, p.half, rx, ry, s, cx, cy, 10);
    } else {
      const lockedDist = 0.39 + Math.sin(t * 1.4) * 0.012;
      const pos: Vec3 = [p.dir[0] * lockedDist, p.dir[1] * lockedDist, p.dir[2] * lockedDist];
      drawFilledBox3D(buf, zBuf, cols, rows, pos, p.half, rx, ry, s, cx, cy, 10);
    }
  }
}

function evalMutantShape(
  shapeIdx: number,
  px: number,
  py: number,
  pz: number,
  t: number,
  beat: number,
  morphSurge: number
): number {
  const r = Math.hypot(px, py, pz);
  const invR = r > 1e-4 ? 1 / r : 0;
  const ux = px * invR;
  const uy = py * invR;
  const uz = pz * invR;
  const ripAmp = 0.03 + 0.025 * beat + 0.028 * morphSurge;
  const rip =
    ripAmp *
    (Math.sin(ux * 6.5 + t * 3.1) * Math.cos(uy * 6.5 - t * 2.4) +
      0.6 * Math.sin(uz * 7.2 + t * 2.7));

  if (shapeIdx === 0) {
    // Forma 0: stella mutante a 4 lobi organici
    const ux2 = ux * ux;
    const uy2 = uy * uy;
    const uz2 = uz * uz;
    const starTerm = ux2 * ux2 - 6 * ux2 * uy2 + uy2 * uy2;
    return r - (0.62 + 0.28 * starTerm - 0.14 * uz2 + rip);
  }
  if (shapeIdx === 1) {
    // Forma 1: organismo tentacolare / nucleo virale a lobi mobili
    const lobe =
      Math.sin(ux * 5.2 + t * 2.0) *
      Math.sin(uy * 5.2 - t * 1.7) *
      Math.sin(uz * 5.2 + t * 1.4);
    const tri = ux * uy * uz * 2.6;
    return r - (0.64 + 0.26 * lobe + 0.12 * tri + rip * 1.2);
  }
  if (shapeIdx === 2) {
    // Forma 2: anello bio-mutante ondulato e pulsante
    const rxy = Math.hypot(px, py);
    const ang = Math.atan2(py, px);
    const ringR = 0.56 + 0.075 * Math.sin(ang * 3 - t * 2.6);
    const tubeR =
      0.22 + 0.048 * Math.cos(ang * 4 + t * 3.2) + 0.025 * Math.sin(pz * 8 + t * 2.5);
    return Math.hypot(rxy - ringR, pz) - tubeR;
  }
  // Forma 3: cristallo mutante a 6 punte assiali
  const ux2 = ux * ux;
  const uy2 = uy * uy;
  const uz2 = uz * uz;
  const axes4 = ux2 * ux2 + uy2 * uy2 + uz2 * uz2;
  return r - (0.52 + 0.42 * (axes4 * axes4 - 0.34) + rip);
}

function drawMutantMorph3D(
  buf: Float32Array,
  cols: number,
  rows: number,
  t: number,
  mx: number,
  my: number,
  baseScale: number,
  cx: number,
  cy: number
) {
  // Pulsazione cardiaca ritmica (lub-dub) + respiro continuo
  const beatPhase = (t * 0.92) % 1;
  const lub = Math.exp(-Math.pow((beatPhase - 0.14) / 0.075, 2));
  const dub = 0.62 * Math.exp(-Math.pow((beatPhase - 0.3) / 0.085, 2));
  const beat = lub + dub;
  const pulse = 0.94 + 0.13 * beat + 0.035 * Math.sin(t * 2.1);

  // Ogni ~2.6s mantiene una forma e poi muta fluidamente nella successiva
  const stageDuration = 2.6;
  const totalCycle = (t / stageDuration) % 4;
  const idxA = Math.floor(totalCycle) % 4;
  const idxB = (idxA + 1) % 4;
  const local = totalCycle - Math.floor(totalCycle);
  const rawBlend = Math.max(0, Math.min(1, (local - 0.62) / 0.38));
  const blend = rawBlend * rawBlend * (3 - 2 * rawBlend);
  const morphSurge = Math.sin(blend * Math.PI);

  const evalSDF = (px: number, py: number, pz: number) => {
    const invP = 1 / pulse;
    const sx = px * invP;
    const sy = py * invP;
    const sz = pz * invP;
    const dA = evalMutantShape(idxA, sx, sy, sz, t, beat, morphSurge);
    if (blend <= 0.001) return dA * pulse;
    const dB = evalMutantShape(idxB, sx, sy, sz, t, beat, morphSurge);
    return ((1 - blend) * dA + blend * dB) * pulse;
  };

  const rx = 0.38 + my * 0.38 + Math.sin(t * 0.55) * 0.2;
  const ry = t * 0.65 + mx * 0.55;
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);

  const camZ = 4.5;
  // Inversa di rotatePoint: Rx(-rx) poi Ry(-ry)
  const roY1 = camZ * sinX;
  const roZ1 = camZ * cosX;
  const rox = roZ1 * sinY;
  const roy = roY1;
  const roz = roZ1 * cosY;

  const scale = baseScale * 0.96;
  const boundR2 = 1.48 * 1.48;
  const eps = 0.015;

  for (let gy = 0; gy < rows; gy++) {
    const py = (gy - cy) / scale;
    const py2 = py * py;
    if (py2 > boundR2) continue;

    for (let gx = 0; gx < cols; gx++) {
      const px = (gx - cx) / scale;
      if (px * px + py2 > boundR2) continue;

      const rLen = Math.hypot(px, py, -camZ);
      const wdx = px / rLen;
      const wdy = py / rLen;
      const wdz = -camZ / rLen;

      const dY1 = wdy * cosX + wdz * sinX;
      const dZ1 = -wdy * sinX + wdz * cosX;
      const rdx = wdx * cosY + dZ1 * sinY;
      const rdy = dY1;
      const rdz = -wdx * sinY + dZ1 * cosY;

      let rayT = 3.15;
      let hit = false;
      let hx = 0;
      let hy = 0;
      let hz = 0;

      for (let iter = 0; iter < 32; iter++) {
        hx = rox + rdx * rayT;
        hy = roy + rdy * rayT;
        hz = roz + rdz * rayT;
        const d = evalSDF(hx, hy, hz);
        if (d < 0.012) {
          hit = true;
          break;
        }
        rayT += d * 0.62;
        if (rayT > 5.85) break;
      }

      if (!hit) continue;

      const nx = evalSDF(hx + eps, hy, hz) - evalSDF(hx - eps, hy, hz);
      const ny = evalSDF(hx, hy + eps, hz) - evalSDF(hx, hy - eps, hz);
      const nz = evalSDF(hx, hy, hz + eps) - evalSDF(hx, hy, hz - eps);
      const nLen = Math.hypot(nx, ny, nz) || 1;
      const rn = rotatePoint(nx / nLen, ny / nLen, nz / nLen, rx, ry);

      const rim = Math.pow(Math.max(0, 1 - Math.abs(rn[2])), 1.8) * 0.18;
      const lum = 0.34 + rn[0] * 0.34 - rn[1] * 0.36 + rn[2] * 0.44 + beat * 0.12 - rim;
      buf[gy * cols + gx] = Math.max(0.16, Math.min(1, lum));
    }
  }
}

function renderSceneToBuffer(
  kind: DitherSceneKind,
  buf: Float32Array,
  zBuf: Float32Array,
  cols: number,
  rows: number,
  t: number,
  mx: number,
  my: number,
  explode = 0,
  cycle = 0,
  colorBuf?: Uint8Array
) {
  buf.fill(0);
  zBuf.fill(-1e9);
  if (colorBuf) colorBuf.fill(0);

  const cx = cols * 0.5;
  const cy = rows * 0.5;
  const baseScale = Math.min(cols, rows) * 0.32;

  if (kind === "abacus") {
    const rx = 0.42 + my * 0.25;
    const ry = Math.sin(t * 0.65) * 0.55 + mx * 0.45;
    const s = baseScale * 0.92;
    // Cornice rettangolare + barra divisoria
    drawLine3D(buf, zBuf, cols, rows, [-1.1, -0.75, 0], [1.1, -0.75, 0], rx, ry, s, cx, cy, 0.95, 1);
    drawLine3D(buf, zBuf, cols, rows, [-1.1, 0.75, 0], [1.1, 0.75, 0], rx, ry, s, cx, cy, 0.95, 1);
    drawLine3D(buf, zBuf, cols, rows, [-1.1, -0.75, 0], [-1.1, 0.75, 0], rx, ry, s, cx, cy, 0.95, 1);
    drawLine3D(buf, zBuf, cols, rows, [1.1, -0.75, 0], [1.1, 0.75, 0], rx, ry, s, cx, cy, 0.95, 1);
    drawLine3D(buf, zBuf, cols, rows, [-1.1, -0.22, 0], [1.1, -0.22, 0], rx, ry, s, cx, cy, 0.9, 1);

    // 7 colonne di grani dell'abaco che scorrono
    for (let c = -3; c <= 3; c++) {
      const bx = c * 0.28;
      drawLine3D(buf, zBuf, cols, rows, [bx, -0.7, 0], [bx, 0.7, 0], rx, ry, s, cx, cy, 0.48, 0);
      const slide = Math.sin(t * 1.6 + c * 0.7) * 0.12;
      const beadPositions = [-0.48 + slide * 0.4, 0.1 + slide, 0.35 + slide * 0.5, 0.56];
      for (const by of beadPositions) {
        const rp = rotatePoint(bx, by, 0, rx, ry);
        const persp = 4.2 / (4.2 - rp[2] * 0.4);
        splatPoint(buf, zBuf, cols, rows, cx + rp[0] * s * persp, cy + rp[1] * s * persp, rp[2], 0.95, 1);
      }
    }
    return;
  }

  if (kind === "matrix") {
    const rx = 0.55 + my * 0.25;
    const ry = t * 0.45 + mx * 0.5;
    const s = baseScale * 0.85;
    // Calcolatrice / Matrice API 3D con griglia di nodi
    drawFilledBox3D(buf, zBuf, cols, rows, [0, 0, 0], [0.85, 1.05, 0.14], rx, ry, s, cx, cy, 14);
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const pulse = Math.sin(t * 3 + r + c) > 0.2 ? 1 : 0.42;
        const rp = rotatePoint(c * 0.28, r * 0.3 + 0.15, 0.18, rx, ry);
        const persp = 4.5 / (4.5 - rp[2] * 0.4);
        splatPoint(buf, zBuf, cols, rows, cx + rp[0] * s * persp, cy + rp[1] * s * persp, rp[2] + 0.2, pulse, 1);
      }
    }
    return;
  }

  if (kind === "laptop") {
    const rx = 0.32 + my * 0.28;
    const ry = -0.45 + Math.sin(t * 0.6) * 0.45 + mx * 0.5;
    const s = baseScale * 0.9;
    // Base tastiera (inclinata)
    drawFilledBox3D(buf, zBuf, cols, rows, [0, 0.48, 0.45], [0.98, 0.05, 0.65], rx, ry, s, cx, cy, 14);
    // Schermo verticale aperto dietro
    drawFilledBox3D(buf, zBuf, cols, rows, [0, -0.18, -0.22], [0.98, 0.62, 0.04], rx, ry, s, cx, cy, 14);
    // Rettangolo interno display luminoso
    drawLine3D(buf, zBuf, cols, rows, [-0.82, -0.66, -0.17], [0.82, -0.66, -0.17], rx, ry, s, cx, cy, 1.0, 0);
    drawLine3D(buf, zBuf, cols, rows, [-0.82, 0.26, -0.17], [0.82, 0.26, -0.17], rx, ry, s, cx, cy, 1.0, 0);
    return;
  }

  if (kind === "skyline") {
    const buildings = [
      { x: 0.04, w: 0.09, h: 0.52 },
      { x: 0.14, w: 0.08, h: 0.38 },
      { x: 0.23, w: 0.11, h: 0.72 },
      { x: 0.35, w: 0.07, h: 0.44 },
      { x: 0.43, w: 0.12, h: 0.86 },
      { x: 0.56, w: 0.09, h: 0.6 },
      { x: 0.66, w: 0.1, h: 0.78 },
      { x: 0.77, w: 0.08, h: 0.48 },
      { x: 0.86, w: 0.1, h: 0.66 },
    ];
    for (let gy = 0; gy < rows; gy++) {
      const ny = 1 - gy / rows;
      for (let gx = 0; gx < cols; gx++) {
        const nx = gx / cols;
        if (gy === rows - 2) {
          buf[gy * cols + gx] = 0.95;
          continue;
        }
        for (let b = 0; b < buildings.length; b++) {
          const bld = buildings[b];
          const animatedH = bld.h * (0.85 + 0.12 * Math.sin(t * 1.4 + b * 0.7));
          if (nx >= bld.x && nx <= bld.x + bld.w && ny <= animatedH) {
            const relX = (nx - bld.x) / bld.w;
            const isBorder = relX < 0.12 || relX > 0.88 || ny > animatedH - 0.04;
            const windowLit = Math.floor(nx * 45) % 2 === 0 && Math.floor(ny * 36) % 2 === 0;
            buf[gy * cols + gx] = isBorder ? 0.96 : windowLit ? 0.72 : 0.28;
          }
        }
      }
    }
    return;
  }

  if (kind === "wave") {
    for (let gy = 0; gy < rows; gy++) {
      const ny = gy / rows;
      for (let gx = 0; gx < cols; gx++) {
        const nx = gx / cols;
        const crestX = 0.48 + Math.sin(t * 1.1) * 0.04;
        const dx = nx - crestX;
        const arch = 0.28 + 0.48 * Math.pow(Math.max(0, 1 - Math.abs(nx - 0.52) * 1.45), 1.4);
        const curl = Math.exp(-((dx + 0.04) * (dx + 0.04) * 18 + (ny - 0.42) * (ny - 0.42) * 24));
        const swirl = 0.5 + 0.5 * Math.sin(nx * 14 - ny * 11 - t * 2.2);
        const waveLine = Math.abs(ny - (1 - arch)) < 0.09 ? 0.95 : ny > 1 - arch ? 0.55 * swirl : 0;
        const foam = curl * 0.85;
        const val = Math.max(waveLine, foam);
        if (val > 0.1) buf[gy * cols + gx] = Math.min(1, val);
      }
    }
    return;
  }

  if (kind === "stairs") {
    const steps = 6;
    for (let gy = 0; gy < rows; gy++) {
      const ny = gy / rows;
      for (let gx = 0; gx < cols; gx++) {
        const nx = gx / cols;
        const stepIdx = Math.floor((1 - ny) * steps + nx * 2.2) - 1;
        const diagY = 1 - nx * 0.78;
        if (ny > diagY - 0.14) {
          const depth = Math.max(0, 1 - Math.abs(ny - diagY) * 2.8);
          const riser = ((Math.floor(ny * steps * 2.2) % 2 === 0) ? 0.85 : 0.35) * (0.65 + 0.35 * Math.sin(t + stepIdx * 0.4));
          buf[gy * cols + gx] = Math.min(1, depth * riser + 0.15);
        }
      }
    }
    return;
  }

  if (kind === "tunnel") {
    const shiftX = (mx - 0) * 0.12;
    const shiftY = (my - 0) * 0.12;
    for (let gy = 0; gy < rows; gy++) {
      const y = (gy / rows - 0.5) * 2 - shiftY;
      for (let gx = 0; gx < cols; gx++) {
        const x = (gx / cols - 0.5) * 2 * (cols / rows) - shiftX;
        // Distanza ottagonale L_inf / Chebyshev combinata
        const dist = Math.max(Math.abs(x), Math.abs(y), (Math.abs(x) + Math.abs(y)) * 0.707);
        if (dist < 0.18) continue;
        const pulse = Math.sin(1 / (dist + 0.08) * 1.9 - t * 3.4);
        const vignette = Math.min(1, (dist - 0.18) * 1.15);
        const lum = vignette * (0.48 + 0.52 * Math.max(0, pulse));
        if (lum > 0.1) buf[gy * cols + gx] = lum;
      }
    }
    return;
  }

  if (kind === "cube") {
    const rx = 0.48 + my * 0.4 + Math.sin(t * 0.7) * 0.18;
    const ry = t * 0.65 + mx * 0.6;
    drawFilledBox3D(
      buf,
      zBuf,
      cols,
      rows,
      [0, 0, 0],
      [0.76, 0.76, 0.76],
      rx,
      ry,
      baseScale,
      cx,
      cy,
      14,
      explode * 0.42
    );
    return;
  }

  if (kind === "exploitCube") {
    // Cubo già esploso identico al modello di Fase 01 (DECONSTRUCT) ma viola:
    // - Pezzo bianco (tassello) già staccato fuori dal cubo
    // - Animazione continua del tassello bianco che entra al centro -> apre un buco netto
    // - Flusso di dati cibernetici bianchi+viola che fuoriesce in 3D dal buco nello stesso stile Bayer
    const ease = (v: number) => {
      const c = Math.max(0, Math.min(1, v));
      return c * c * (3 - 2 * c);
    };
    const act = Math.max(0, Math.min(1, explode));
    const p = act > 0.02 ? cycle : 0;

    // Angolazione 3/4 identica al cubo esploso di Fase 01, mantenendo la faccia frontale (+Z) leggibile
    const rx = 0.44 + my * 0.34 + Math.sin(t * 0.7) * 0.14;
    const ry = -0.56 + Math.sin(t * 0.56) * 0.24 + mx * 0.48;

    const cubeCx = cols * 0.42;
    const cubeCy = cy;
    const cubeScale = baseScale * 0.88;

    // Il cubo è GIÀ QUELLO ESPLOSO fin dall'inizio (explodeOffset = 0.42 come Fase 01)
    const h = 0.76;
    const exp = 0.42;
    const wallDist = h + exp; // 1.18

    // Apertura del buco centrale dopo inserimento del tassello bianco (p: 0.40..0.54 aperto, 0.88..0.98 richiude)
    const openIn = p >= 0.4 ? ease((p - 0.4) / 0.12) : 0;
    const closeOut = p >= 0.88 ? ease((p - 0.88) / 0.1) : 0;
    const holeOpen = Math.max(0, openIn * (1 - closeOut)) * act;
    const holeHalf = 0.43 * holeOpen;

    // 1. Cinque pareti del cubo esploso in viola Bayer identiche al reticolo arioso di Fase 01
    const outerFaces: Array<{ normal: Vec3; u: Vec3; v: Vec3; fixed: Vec3; light: number }> = [
      { normal: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0], fixed: [0, 0, -wallDist], light: 0.38 },
      { normal: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], fixed: [wallDist, 0, 0], light: 0.76 },
      { normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], fixed: [-wallDist, 0, 0], light: 0.3 },
      { normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], fixed: [0, -wallDist, 0], light: 0.86 },
      { normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1], fixed: [0, wallDist, 0], light: 0.24 },
    ];
    for (const face of outerFaces) {
      const rn = rotatePoint(face.normal[0], face.normal[1], face.normal[2], rx, ry);
      const lDot = Math.max(0.18, Math.abs(rn[0] * 0.45 - rn[1] * 0.55 + rn[2] * 0.72));
      const val = Math.min(0.84, face.light * 0.42 + lDot * 0.52);
      const steps = 11; // 12x12 punti come drawFilledBox3D(..., density=14) in Fase 01!
      for (let iu = 0; iu <= steps; iu++) {
        const fu = -1 + (2 * iu) / steps;
        for (let iv = 0; iv <= steps; iv++) {
          const fv = -1 + (2 * iv) / steps;
          const ox = face.fixed[0] + face.u[0] * h * fu + face.v[0] * h * fv;
          const oy = face.fixed[1] + face.u[1] * h * fu + face.v[1] * h * fv;
          const oz = face.fixed[2] + face.u[2] * h * fu + face.v[2] * h * fv;
          const rp = rotatePoint(ox, oy, oz, rx, ry);
          const persp = 4.5 / (4.5 - Math.min(3.4, rp[2]) * 0.4);
          const sx = cubeCx + rp[0] * cubeScale * persp;
          const sy = cubeCy + rp[1] * cubeScale * persp;
          const isEdge = iu === 0 || iu === steps || iv === 0 || iv === steps;
          splatPoint(
            buf,
            zBuf,
            cols,
            rows,
            sx,
            sy,
            rp[2],
            isEdge ? Math.min(0.98, val + 0.16) : val,
            0,
            colorBuf,
            0,
            true
          );
        }
      }
    }

    // 2. Maschera cavità nera del buco aperto: pulisce i pixel di sfondo dietro al foro centrale
    if (holeHalf > 0.05) {
      const clearLimit = Math.max(0.02, holeHalf - 0.04);
      const maskSteps = 22;
      for (let ix = 0; ix <= maskSteps; ix++) {
        const x = -clearLimit + (2 * clearLimit * ix) / maskSteps;
        for (let iy = 0; iy <= maskSteps; iy++) {
          const y = -clearLimit + (2 * clearLimit * iy) / maskSteps;
          const rp = rotatePoint(x, y, wallDist - 0.02, rx, ry);
          const persp = 4.5 / (4.5 - Math.min(3.4, rp[2]) * 0.4);
          const gx = Math.round(cubeCx + rp[0] * cubeScale * persp);
          const gy = Math.round(cubeCy + rp[1] * cubeScale * persp);
          if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
            const idx = gy * cols + gx;
            if (zBuf[idx] < rp[2] + 0.08) {
              buf[idx] = 0;
              zBuf[idx] = -0.35;
              if (colorBuf) colorBuf[idx] = 0;
            }
          }
        }
      }
    }

    // 3. Parete frontale (+Z): dithering viola Bayer pulito con buco centrale quando aperto
    const frontVal = 0.68; // Livello 0.68 => trama Bayer a croci/quadrati netti (non blocco piatto)
    if (holeHalf < 0.03) {
      drawQuadZ3D(buf, zBuf, cols, rows, -h, h, -h, h, wallDist, rx, ry, cubeScale, cubeCx, cubeCy, frontVal, 0.24, 15, colorBuf, 0);
    } else {
      drawQuadZ3D(buf, zBuf, cols, rows, -h, h, -h, -holeHalf, wallDist, rx, ry, cubeScale, cubeCx, cubeCy, frontVal, 0.24, 15, colorBuf, 0);
      drawQuadZ3D(buf, zBuf, cols, rows, -h, h, holeHalf, h, wallDist, rx, ry, cubeScale, cubeCx, cubeCy, frontVal, 0.24, 15, colorBuf, 0);
      drawQuadZ3D(buf, zBuf, cols, rows, -h, -holeHalf, -holeHalf, holeHalf, wallDist, rx, ry, cubeScale, cubeCx, cubeCy, frontVal, 0.24, 15, colorBuf, 0);
      drawQuadZ3D(buf, zBuf, cols, rows, holeHalf, h, -holeHalf, holeHalf, wallDist, rx, ry, cubeScale, cubeCx, cubeCy, frontVal, 0.24, 15, colorBuf, 0);

      // Bordo luminoso del buco + spessore 3D interno della parete forata
      const rimZ0 = wallDist - 0.12;
      const rimPts: Vec3[] = [
        [-holeHalf, -holeHalf, wallDist + 0.02],
        [holeHalf, -holeHalf, wallDist + 0.02],
        [holeHalf, holeHalf, wallDist + 0.02],
        [-holeHalf, holeHalf, wallDist + 0.02],
      ];
      for (let i = 0; i < 4; i++) {
        const a = rimPts[i];
        const b = rimPts[(i + 1) & 3];
        drawLine3D(buf, zBuf, cols, rows, a, b, rx, ry, cubeScale, cubeCx, cubeCy, 0.98, 0, colorBuf, 0, true);
        drawLine3D(
          buf,
          zBuf,
          cols,
          rows,
          [a[0], a[1], wallDist + 0.01],
          [a[0], a[1], rimZ0],
          rx,
          ry,
          cubeScale,
          cubeCx,
          cubeCy,
          0.74,
          0,
          colorBuf,
          0,
          true
        );
        drawLine3D(
          buf,
          zBuf,
          cols,
          rows,
          [a[0], a[1], rimZ0],
          [b[0], b[1], rimZ0],
          rx,
          ry,
          cubeScale,
          cubeCx,
          cubeCy,
          0.55,
          0,
          colorBuf,
          0,
          true
        );
      }
    }

    // Slot mirino centrale prima che entri il pezzo bianco
    if (act > 0.05 && p >= 0.08 && p < 0.4 && holeHalf < 0.05) {
      const ts = 0.22;
      const slotLum = 0.68 + 0.28 * Math.sin(t * 9);
      const tz = wallDist + 0.03;
      drawLine3D(buf, zBuf, cols, rows, [-ts, -ts, tz], [ts, -ts, tz], rx, ry, cubeScale, cubeCx, cubeCy, slotLum, 0, colorBuf, 1, true);
      drawLine3D(buf, zBuf, cols, rows, [ts, -ts, tz], [ts, ts, tz], rx, ry, cubeScale, cubeCx, cubeCy, slotLum, 0, colorBuf, 1, true);
      drawLine3D(buf, zBuf, cols, rows, [ts, ts, tz], [-ts, ts, tz], rx, ry, cubeScale, cubeCx, cubeCy, slotLum, 0, colorBuf, 1, true);
      drawLine3D(buf, zBuf, cols, rows, [-ts, ts, tz], [-ts, -ts, tz], rx, ry, cubeScale, cubeCx, cubeCy, slotLum, 0, colorBuf, 1, true);
    }

    // Impulso bianco d'inserimento quando il tassello colpisce il centro (p: 0.36..0.52)
    if (act > 0.05 && p >= 0.36 && p <= 0.52) {
      const shockT = (p - 0.36) / 0.16;
      const sr = 0.2 + ease(shockT) * 0.58;
      const sLum = (1 - shockT) * 0.98;
      const sz = wallDist + 0.04;
      drawLine3D(buf, zBuf, cols, rows, [-sr, -sr, sz], [sr, -sr, sz], rx, ry, cubeScale, cubeCx, cubeCy, sLum, 0, colorBuf, 1, true);
      drawLine3D(buf, zBuf, cols, rows, [sr, -sr, sz], [sr, sr, sz], rx, ry, cubeScale, cubeCx, cubeCy, sLum, 0, colorBuf, 1, true);
      drawLine3D(buf, zBuf, cols, rows, [sr, sr, sz], [-sr, sr, sz], rx, ry, cubeScale, cubeCx, cubeCy, sLum, 0, colorBuf, 1, true);
      drawLine3D(buf, zBuf, cols, rows, [-sr, sr, sz], [-sr, -sr, sz], rx, ry, cubeScale, cubeCx, cubeCy, sLum, 0, colorBuf, 1, true);
    }

    // 4. Pezzo BIANCO (tassello): flottante fuori dal cubo esploso -> si inserisce nel mezzo -> sblocca il buco
    let showTile = true;
    let tx = 1.06;
    let ty = -0.44 + Math.sin(t * 2.0) * 0.05;
    let tz = wallDist + 0.34;
    let tRx = 0.2 + t * 0.6;
    let tRy = t * 0.85;
    let tileScale = 1.0;

    if (act <= 0.02) {
      // A riposo: pezzo bianco già staccato e ben visibile fuori dal cubo viola esploso
      tx = 1.06;
      ty = -0.44 + Math.sin(t * 2.0) * 0.06;
      tz = wallDist + 0.32;
    } else if (p < 0.14) {
      const u = ease(p / 0.14);
      tx = 1.06 + (0.94 - 1.06) * u;
      ty = -0.44 + (-0.34 + 0.44) * u;
      tz = wallDist + 0.34 + 0.26 * u;
    } else if (p < 0.32) {
      // Arco fluido davanti al centro della faccia frontale
      const u = ease((p - 0.14) / 0.18);
      tx = 0.94 * (1 - u);
      ty = -0.34 * (1 - u);
      tz = wallDist + 0.6 + Math.sin(u * Math.PI) * 0.24;
      tRx = (0.2 + t * 0.6) * (1 - u);
      tRy = (t * 0.85) * (1 - u);
      drawLine3D(buf, zBuf, cols, rows, [tx, ty, tz], [0, 0, wallDist + 0.04], rx, ry, cubeScale, cubeCx, cubeCy, 0.48, 0, colorBuf, 1, true);
    } else if (p < 0.43) {
      // Inserimento netto nel mezzo (con breve sosta visibile al centro)
      const u = ease(Math.min(1, (p - 0.32) / 0.07));
      tx = 0;
      ty = 0;
      tz = wallDist + 0.6 - u * 0.56;
      tRx = 0;
      tRy = 0;
    } else if (p < 0.51) {
      // Spinge dentro il nucleo mentre il buco si apre
      const u = ease((p - 0.43) / 0.08);
      tx = 0;
      ty = 0;
      tz = wallDist + 0.04 - u * 0.55;
      tRx = u * 0.9;
      tRy = u * 1.1;
      tileScale = Math.max(0.24, 1 - u * 0.72);
    } else if (p >= 0.91) {
      const u = ease((p - 0.91) / 0.09);
      tx = 1.06;
      ty = -0.44;
      tz = wallDist + 0.34;
      tileScale = u;
    } else {
      showTile = false;
    }

    if (showTile && tileScale > 0.18) {
      drawRotatedBox3D(
        buf,
        zBuf,
        cols,
        rows,
        [tx, ty, tz],
        [0.19 * tileScale, 0.19 * tileScale, 0.06 * tileScale],
        tRx,
        tRy,
        rx,
        ry,
        cubeScale,
        cubeCx,
        cubeCy,
        16,
        0.16,
        colorBuf,
        1, // BIANCO!
        true
      );
    }

    // 5. Nucleo interno + Flusso di dati cibernetici (bianco + viola) fuori dal buco aperto
    if (holeOpen > 0.08) {
      const streamEnv = Math.min(1, holeOpen * 1.15);

      // Nucleo pulsante dentro la cavità nera del buco
      const coreSize = (0.18 + 0.04 * Math.sin(t * 9)) * streamEnv;
      drawRotatedBox3D(
        buf,
        zBuf,
        cols,
        rows,
        [0, 0, -0.05],
        [coreSize, coreSize, coreSize],
        t * 1.9,
        t * 1.4,
        rx,
        ry,
        cubeScale,
        cubeCx,
        cubeCy,
        14,
        0.2,
        colorBuf,
        1,
        true
      );

      // 6 corsie di flusso dati cibernetici in uscita dal buco centrale verso destra (+Z + +X)
      const laneOffsets: Array<[number, number, number]> = [
        [0.0, 0.0, 0.0],
        [-0.14, -0.1, 0.95],
        [0.14, -0.11, 2.05],
        [-0.13, 0.13, 3.15],
        [0.13, 0.11, 4.25],
        [0.02, -0.16, 5.2],
      ];

      const zStart = 0.05;
      const zLen = 2.85;

      for (let lIdx = 0; lIdx < laneOffsets.length; lIdx++) {
        const [ox0, oy0, phaseSeed] = laneOffsets[lIdx];

        // Scia continua halftone viola che esce dal foro e piega verso la zona libera a destra
        const trailSteps = 38;
        for (let si = 0; si <= trailSteps; si++) {
          const u = si / trailSteps;
          const lz = zStart + u * zLen;
          const postHole = Math.max(0, (lz - (wallDist + 0.02)) / (zLen + zStart - wallDist));
          const spread = 1 + postHole * 2.1;
          const waveX = Math.sin(u * 8.0 - t * 6.8 + phaseSeed) * 0.09 * (0.2 + postHole);
          const waveY = Math.cos(u * 6.5 - t * 6.0 + phaseSeed) * 0.07 * (0.2 + postHole);
          const lx = ox0 * spread + postHole * 1.15 + waveX;
          const ly = oy0 * spread - postHole * 0.08 + waveY;

          const rp = rotatePoint(lx, ly, lz, rx, ry);
          const persp = 4.5 / (4.5 - Math.min(3.4, rp[2]) * 0.4);
          const sx = cubeCx + rp[0] * cubeScale * persp;
          const sy = cubeCy + rp[1] * cubeScale * persp;

          const pulseWave = 0.5 + 0.5 * Math.sin(u * 15 - t * 10 + phaseSeed);
          const tailFade = u > 0.72 ? Math.max(0, 1 - (u - 0.72) / 0.28) : 1;
          const carrierLum = (0.34 + 0.42 * pulseWave) * streamEnv * tailFade;
          if (carrierLum > 0.16) {
            splatPoint(buf, zBuf, cols, rows, sx, sy, rp[2] + 0.25, carrierLum, 0, colorBuf, 0, true);
          }
        }

        // Pacchetti 3D bianchi + scie bit che schizzano fuori dal buco
        for (let pkt = 0; pkt < 3; pkt++) {
          const u = (t * 0.92 + phaseSeed * 0.19 + pkt * 0.333) % 1;
          const lz = zStart + u * zLen;
          const postHole = Math.max(0, (lz - (wallDist + 0.02)) / (zLen + zStart - wallDist));
          const spread = 1 + postHole * 2.1;
          const waveX = Math.sin(u * 8.0 - t * 6.8 + phaseSeed) * 0.09 * (0.2 + postHole);
          const waveY = Math.cos(u * 6.5 - t * 6.0 + phaseSeed) * 0.07 * (0.2 + postHole);
          const lx = ox0 * spread + postHole * 1.15 + waveX;
          const ly = oy0 * spread - postHole * 0.08 + waveY;

          const fadeTail = u > 0.74 ? Math.max(0, 1 - (u - 0.74) / 0.26) : 1;
          const pktLum = Math.min(1, (0.98 * fadeTail + 0.16) * streamEnv);
          if (pktLum < 0.18) continue;

          if (lIdx % 2 === 0 && pkt === 0 && u > 0.15 && u < 0.88) {
            const ps = (0.075 - postHole * 0.015) * streamEnv;
            drawRotatedBox3D(
              buf,
              zBuf,
              cols,
              rows,
              [lx, ly, lz],
              [ps, ps * 0.85, ps * 1.4],
              t * 2.4 + phaseSeed,
              t * 1.9 + pkt,
              rx,
              ry,
              cubeScale,
              cubeCx,
              cubeCy,
              14,
              0.22,
              colorBuf,
              1,
              true
            );
          } else {
            const rpHead = rotatePoint(lx, ly, lz, rx, ry);
            const pHead = 4.5 / (4.5 - Math.min(3.4, rpHead[2]) * 0.4);
            splatPoint(
              buf,
              zBuf,
              cols,
              rows,
              cubeCx + rpHead[0] * cubeScale * pHead,
              cubeCy + rpHead[1] * cubeScale * pHead,
              rpHead[2] + 0.35,
              pktLum,
              u < 0.72 ? 1 : 0,
              colorBuf,
              1,
              true
            );
            for (let tr = 1; tr <= 3; tr++) {
              const ut = Math.max(0, u - tr * 0.028);
              const lzt = zStart + ut * zLen;
              const postT = Math.max(0, (lzt - (wallDist + 0.02)) / (zLen + zStart - wallDist));
              const spreadT = 1 + postT * 2.1;
              const lxt = ox0 * spreadT + postT * 1.15 + Math.sin(ut * 8.0 - t * 6.8 + phaseSeed) * 0.09 * (0.2 + postT);
              const lyt = oy0 * spreadT - postT * 0.08 + Math.cos(ut * 6.5 - t * 6.0 + phaseSeed) * 0.07 * (0.2 + postT);
              const rpt = rotatePoint(lxt, lyt, lzt, rx, ry);
              const ptPersp = 4.5 / (4.5 - Math.min(3.4, rpt[2]) * 0.4);
              splatPoint(
                buf,
                zBuf,
                cols,
                rows,
                cubeCx + rpt[0] * cubeScale * ptPersp,
                cubeCy + rpt[1] * cubeScale * ptPersp,
                rpt[2] + 0.3,
                pktLum * (1 - tr * 0.22),
                0,
                colorBuf,
                tr === 1 ? 1 : 0,
                true
              );
            }
          }
        }
      }
    }
    return;
  }

  if (kind === "maze") {
    const rx = 0.68 + my * 0.25;
    const ry = 0.78 + t * 0.35 + mx * 0.45;
    const s = baseScale * 0.88;
    // Griglia labirinto isometrica tipo wireframe/blocchi 3D
    const blocks: Array<[Vec3, Vec3]> = [
      [[0, 0.25, 0], [0.95, 0.06, 0.95]],
      [[-0.55, 0, -0.55], [0.28, 0.24, 0.1]],
      [[0.15, 0, -0.6], [0.35, 0.24, 0.1]],
      [[-0.65, 0, 0.15], [0.1, 0.26, 0.48]],
      [[0.0, 0, 0.0], [0.28, 0.3, 0.28]],
      [[0.62, 0, 0.1], [0.1, 0.24, 0.52]],
      [[-0.2, 0, 0.62], [0.46, 0.22, 0.1]],
      [[0.48, 0, -0.2], [0.22, 0.32, 0.12]],
    ];
    for (const [c, h] of blocks) {
      drawFilledBox3D(buf, zBuf, cols, rows, c, h, rx, ry, s, cx, cy, 10);
    }
    return;
  }

  if (kind === "cluster") {
    const rx = 0.42 + my * 0.32;
    const ry = t * 0.55 + mx * 0.55;
    const s = baseScale * 0.88;
    const voxels: Array<[Vec3, Vec3]> = [
      [[0, 0, 0], [0.42, 0.42, 0.42]],
      [[0.48, -0.35, 0.2], [0.26, 0.26, 0.26]],
      [[-0.45, 0.3, -0.15], [0.3, 0.28, 0.24]],
      [[-0.28, -0.45, 0.38], [0.22, 0.32, 0.22]],
      [[0.32, 0.44, -0.34], [0.24, 0.24, 0.28]],
      [[0.0, -0.56, -0.25], [0.2, 0.22, 0.22]],
    ];
    for (const [c, h] of voxels) {
      drawFilledBox3D(buf, zBuf, cols, rows, c, h, rx, ry, s, cx, cy, 11);
    }
    return;
  }

  if (kind === "dome" || kind === "sunDome") {
    const isBottomRising = kind === "sunDome";
    const radius = isBottomRising ? 0.85 : 0.72;
    const centerY = isBottomRising ? 1.0 : 0.88;
    for (let gy = 0; gy < rows; gy++) {
      const ny = gy / rows;
      for (let gx = 0; gx < cols; gx++) {
        const nx = (gx / cols - 0.5) * (cols / rows) * 1.3;
        const dy = centerY - ny;
        if (dy < 0) continue;
        const r = Math.hypot(nx, dy);
        if (r > radius) continue;
        // Illuminazione sferica verso il centro basso
        const z = Math.sqrt(Math.max(0, radius * radius - r * r));
        const light = Math.max(0.08, (z / radius) * 0.88 + Math.sin(t * 0.8) * 0.06);
        buf[gy * cols + gx] = Math.min(1, light);
      }
    }
    return;
  }

  if (kind === "torus") {
    const rx = 0.78 + my * 0.35;
    const ry = t * 0.65 + mx * 0.5;
    const R = 0.74;
    const r = 0.28;
    const s = baseScale * 1.05;
    const stepsU = 56;
    const stepsV = 26;
    for (let iu = 0; iu < stepsU; iu++) {
      const u = (iu / stepsU) * Math.PI * 2;
      const cu = Math.cos(u);
      const su = Math.sin(u);
      for (let iv = 0; iv < stepsV; iv++) {
        const v = (iv / stepsV) * Math.PI * 2;
        const cv = Math.cos(v);
        const sv = Math.sin(v);
        const ox = (R + r * cv) * cu;
        const oy = (R + r * cv) * su;
        const oz = r * sv;
        const rp = rotatePoint(ox, oy, oz, rx, ry);
        const nx = cv * cu;
        const ny = cv * su;
        const nz = sv;
        const rn = rotatePoint(nx, ny, nz, rx, ry);
        if (rn[2] < -0.1) continue;
        const persp = 4.4 / (4.4 - rp[2] * 0.4);
        const sx = cx + rp[0] * s * persp;
        const sy = cy + rp[1] * s * persp;
        const lum = Math.max(0.18, 0.35 + rn[0] * 0.35 - rn[1] * 0.38 + rn[2] * 0.45);
        splatPoint(buf, zBuf, cols, rows, sx, sy, rp[2], Math.min(1, lum), 1);
      }
    }
    return;
  }

  if (kind === "star") {
    const rx = 0.32 + my * 0.35;
    const ry = Math.sin(t * 0.75) * 0.45 + mx * 0.45;
    const rz = t * 0.3;
    const cz = Math.cos(rz);
    const sz = Math.sin(rz);
    const s = baseScale * 1.05;
    // Stella 3D a 4 punte concave
    for (let iy = -34; iy <= 34; iy++) {
      const y = (iy / 34) * 1.05;
      for (let ix = -34; ix <= 34; ix++) {
        const x = (ix / 34) * 1.05;
        const xR = x * cz - y * sz;
        const yR = x * sz + y * cz;
        const ax = Math.abs(xR);
        const ay = Math.abs(yR);
        // Equazione ipocicloide / stella a 4 punte
        const d = Math.pow(ax, 0.58) + Math.pow(ay, 0.58);
        if (d > 1.02) continue;
        const thickness = (1.02 - d) * 0.38;
        for (const sign of [-1, 1]) {
          const rp = rotatePoint(x, y, sign * thickness, rx, ry);
          const persp = 4.4 / (4.4 - rp[2] * 0.4);
          const sx = cx + rp[0] * s * persp;
          const sy = cy + rp[1] * s * persp;
          const lum = Math.max(0.22, 0.88 - ax * 0.32 - (sign < 0 ? 0.35 : 0));
          splatPoint(buf, zBuf, cols, rows, sx, sy, rp[2], lum, 0);
        }
      }
    }
    return;
  }

  if (kind === "hollowCube") {
    const rx = 0.52 + my * 0.35;
    const ry = t * 0.58 + mx * 0.5;
    const s = baseScale * 0.92;
    // 12 travi spesse di un cubo cavo geometrico (come frame 1:27 EVOLVE)
    const d = 0.72;
    const thick = 0.14;
    const beams: Array<[Vec3, Vec3]> = [
      [[0, -d, -d], [d, thick, thick]],
      [[0, d, -d], [d, thick, thick]],
      [[0, -d, d], [d, thick, thick]],
      [[0, d, d], [d, thick, thick]],
      [[-d, 0, -d], [thick, d, thick]],
      [[d, 0, -d], [thick, d, thick]],
      [[-d, 0, d], [thick, d, thick]],
      [[d, 0, d], [thick, d, thick]],
      [[-d, -d, 0], [thick, thick, d]],
      [[d, -d, 0], [thick, thick, d]],
      [[-d, d, 0], [thick, thick, d]],
      [[d, d, 0], [thick, thick, d]],
    ];
    for (const [c, h] of beams) {
      drawFilledBox3D(buf, zBuf, cols, rows, c, h, rx, ry, s, cx, cy, 8);
    }
    return;
  }

  if (kind === "structureRetool") {
    drawEvolvingStructure3D(0, buf, zBuf, cols, rows, t, mx, my, baseScale, cx, cy);
    return;
  }

  if (kind === "structureAdapt") {
    drawEvolvingStructure3D(1, buf, zBuf, cols, rows, t, mx, my, baseScale, cx, cy);
    return;
  }

  if (kind === "structureEvolve") {
    drawEvolvingStructure3D(2, buf, zBuf, cols, rows, t, mx, my, baseScale, cx, cy);
    return;
  }

  if (kind === "mutant") {
    drawMutantMorph3D(buf, cols, rows, t, mx, my, baseScale, cx, cy);
  }
}

export function PixelDitherCanvas({
  kind,
  color,
  bgColor = "transparent",
  width = 480,
  height = 360,
  cellSize = 6,
  interactive = true,
  explode = 0,
  className = "",
  style,
}: PixelDitherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const explodeTargetRef = useRef(explode);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    explodeTargetRef.current = explode;
  }, [explode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const cols = Math.max(12, Math.floor(width / cellSize));
    const rows = Math.max(12, Math.floor(height / cellSize));
    const buf = new Float32Array(cols * rows);
    const zBuf = new Float32Array(cols * rows);
    const colorBuf = new Uint8Array(cols * rows);

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rafId = 0;
    let time = 0.6;
    let currentExplode = explodeTargetRef.current;
    let exploitCycle = reducedMotion ? 0.66 : 0;
    let lastTs = performance.now();

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      if (!reducedMotion) {
        time += dt;
      }

      const p = pointerRef.current;
      p.x += (p.tx - p.x) * 0.08;
      p.y += (p.ty - p.y) * 0.08;
      if (kind === "exploitCube") {
        const target = explodeTargetRef.current;
        currentExplode += (target - currentExplode) * (target > currentExplode ? 0.12 : 0.08);
        if (target > 0.5) {
          if (!reducedMotion) {
            exploitCycle = (exploitCycle + dt / 6.0) % 1;
          } else {
            exploitCycle = 0.66;
          }
        } else {
          exploitCycle *= Math.max(0, 1 - dt * 4);
        }
      } else {
        currentExplode += (explodeTargetRef.current - currentExplode) * 0.08;
      }

      renderSceneToBuffer(kind, buf, zBuf, cols, rows, time, p.x, p.y, currentExplode, exploitCycle, colorBuf);

      if (bgColor === "transparent") {
        ctx.clearRect(0, 0, width, height);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
      }

      let activeColor = color;
      ctx.fillStyle = activeColor;
      const gapUnit = Math.max(1, Math.floor(cellSize / 6));

      for (let gy = 0; gy < rows; gy++) {
        const y = gy * cellSize;
        const bRow = BAYER_8X8[gy & 7];
        for (let gx = 0; gx < cols; gx++) {
          const cellIdx = gy * cols + gx;
          const lum = buf[cellIdx];
          if (lum < 0.08) continue;

          const bayerVal = bRow[gx & 7] / 64;
          const level = lum + (bayerVal - 0.5) * 0.22;
          if (level < 0.08) continue;

          const nextColor = colorBuf[cellIdx] === 1 ? "#F4F3FA" : color;
          if (nextColor !== activeColor) {
            activeColor = nextColor;
            ctx.fillStyle = activeColor;
          }
          const x = gx * cellSize;

          if (level < 0.24) {
            // Micro punto centrale 2x2
            const s = Math.max(1, Math.round(cellSize * 0.33));
            const off = Math.floor((cellSize - s) * 0.5);
            ctx.fillRect(x + off, y + off, s, s);
          } else if (level < 0.44) {
            // Quadrato medio 3x3
            const s = Math.max(2, Math.round(cellSize * 0.5));
            const off = Math.floor((cellSize - s) * 0.5);
            ctx.fillRect(x + off, y + off, s, s);
          } else if (level < 0.66) {
            // Firma del Reel: croce halftone (+ e × alternate a scacchiera)
            const parity = (gx + gy) & 1;
            const s = cellSize - gapUnit;
            const mid = Math.floor(cellSize * 0.5);
            if (parity === 0) {
              ctx.fillRect(x, y + mid - Math.floor(gapUnit * 0.5), s, gapUnit);
              ctx.fillRect(x + mid - Math.floor(gapUnit * 0.5), y, gapUnit, s);
            } else {
              const q = Math.max(1, gapUnit);
              ctx.fillRect(x + q, y + q, s - q * 2, s - q * 2);
              ctx.fillRect(x, y, q, q);
              ctx.fillRect(x + s - q, y + s - q, q, q);
            }
          } else if (level < 0.86) {
            // Quadrato denso con gap netto da 1px
            ctx.fillRect(x, y, cellSize - gapUnit, cellSize - gapUnit);
          } else {
            // Blocco solido pieno
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }

      if (!reducedMotion && isVisibleRef.current) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !reducedMotion) {
          cancelAnimationFrame(rafId);
          lastTs = performance.now();
          rafId = requestAnimationFrame(drawFrame);
        } else if (!entry.isIntersecting) {
          cancelAnimationFrame(rafId);
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(canvas);
    drawFrame(performance.now());

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [kind, color, bgColor, width, height, cellSize]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      pointerRef.current.tx = nx;
      pointerRef.current.ty = ny;
    },
    [interactive]
  );

  const handlePointerLeave = useCallback(() => {
    pointerRef.current.tx = 0;
    pointerRef.current.ty = 0;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={className}
      style={{
        display: "block",
        imageRendering: "pixelated",
        borderRadius: 0,
        ...style,
      }}
    />
  );
}


/* ============================================================================
 * MICRO-ANIMAZIONI TIPOGRAFICHE FEDELI AL REEL
 * ========================================================================== */

/** 1. PixelDissolveBadge: dissolvenza pixel 5px in entrata e uscita */
function PixelDissolveBadge({
  text,
  bg = PALETTE.blue,
  fg = PALETTE.bg,
  triggerKey,
  scrambleOnEnter = false,
  dissolveMode = "enter",
  animateOnMount = true,
  fontSize = "clamp(2rem, 5vw, 4.2rem)",
  padding = "0.08em 0.28em",
  lineHeight = 0.92,
  whiteSpace,
}: {
  text: string;
  bg?: string;
  fg?: string;
  triggerKey?: string | number;
  scrambleOnEnter?: boolean;
  dissolveMode?: "enter" | "exit";
  animateOnMount?: boolean;
  fontSize?: string;
  padding?: string;
  lineHeight?: number;
  whiteSpace?: React.CSSProperties["whiteSpace"];
}) {
  const [dissolving, setDissolving] = useState(false);
  const [exited, setExited] = useState(false);
  const [displayText, setDisplayText] = useState(text);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let animInterval: ReturnType<typeof setInterval> | undefined;
    let scrambleInterval: ReturnType<typeof setInterval> | undefined;

    if (!animateOnMount) {
      const resetTimer = setTimeout(() => {
        setDissolving(false);
        setExited(false);
        setDisplayText(text);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(() => {
      setExited(false);
      setDissolving(true);
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) {
        setDissolving(false);
        setDisplayText(text);
        return;
      }

      const w = Math.max(80, Math.round(wrap.offsetWidth));
      const h = Math.max(36, Math.round(wrap.offsetHeight));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const cell = 5;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      let step = 0;
      const maxSteps = 11;
      const isExit = dissolveMode === "exit";

      // Decodifica rapida in entrata o corruzione in uscita con caratteri glitch
      const glyphs = "01#$*&%<>[]_~!?";
      const scrambleString = (locked: number) =>
        text
          .split("")
          .map((c, i) => (i < locked ? c : glyphs[Math.floor(Math.random() * glyphs.length)]))
          .join("");

      if (isExit) {
        let scrambleTick = 0;
        const totalScrambleTicks = 5;
        setDisplayText(text);
        scrambleInterval = setInterval(() => {
          scrambleTick++;
          if (scrambleTick >= totalScrambleTicks) {
            setDisplayText(scrambleString(0));
            if (scrambleInterval) clearInterval(scrambleInterval);
          } else {
            const locked = Math.max(
              0,
              text.length - Math.ceil((scrambleTick / totalScrambleTicks) * text.length)
            );
            setDisplayText(scrambleString(locked));
          }
        }, 34);
      } else if (scrambleOnEnter) {
        let scrambleTick = 0;
        const totalScrambleTicks = 8;
        setDisplayText(scrambleString(0));
        scrambleInterval = setInterval(() => {
          scrambleTick++;
          if (scrambleTick >= totalScrambleTicks) {
            setDisplayText(text);
            if (scrambleInterval) clearInterval(scrambleInterval);
          } else {
            const locked = Math.floor((scrambleTick / totalScrambleTicks) * text.length);
            setDisplayText(scrambleString(locked));
          }
        }, 42);
      } else {
        setDisplayText(text);
      }

      const primaryPixel = bg === "transparent" ? fg : bg;
      const secondaryPixel = bg === "transparent" ? "#F4F3FA" : PALETTE.ink;

      animInterval = setInterval(() => {
        step++;
        ctx.clearRect(0, 0, w, h);
        if (isExit && step >= 5) {
          setExited(true);
        }
        const density = step <= 4 ? 0.35 + step * 0.14 : Math.max(0, 1 - (step - 4) * 0.18);
        for (let gy = 0; gy < rows; gy++) {
          for (let gx = 0; gx < cols; gx++) {
            const hash = ((gx * 73856093) ^ (gy * 19349663) ^ (step * 83492791)) & 255;
            if (hash / 255 < density) {
              ctx.fillStyle = hash % 5 === 0 ? secondaryPixel : primaryPixel;
              ctx.fillRect(gx * cell, gy * cell, cell - 1, cell - 1);
            }
          }
        }
        if (step >= maxSteps) {
          if (animInterval) clearInterval(animInterval);
          ctx.clearRect(0, 0, w, h);
          setDissolving(false);
          if (!isExit) {
            setDisplayText(text);
          }
        }
      }, 34);
    }, 0);

    return () => {
      clearTimeout(timer);
      if (animInterval) clearInterval(animInterval);
      if (scrambleInterval) clearInterval(scrambleInterval);
    };
  }, [text, triggerKey, bg, fg, scrambleOnEnter, dissolveMode, animateOnMount]);

  return (
    <span
      ref={wrapRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        background: exited ? "transparent" : bg,
        color: fg,
        fontFamily: DISPLAY_FONT,
        fontWeight: 700,
        fontSize,
        lineHeight,
        letterSpacing: "-0.02em",
        textTransform: "uppercase",
        whiteSpace,
        padding,
        borderRadius: 0,
        userSelect: "none",
      }}
    >
      <span style={{ opacity: exited ? 0 : dissolving ? 0.35 : 1, transition: "opacity 80ms linear" }}>
        {displayText}
      </span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          imageRendering: "pixelated",
        }}
      />
    </span>
  );
}


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
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    window.addEventListener("resize", measure);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
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
  const rightColOffset = metrics.evolveW + Math.max(12, Math.round(metrics.evolveW * 0.065));

  return (
    <h1
      onClick={onReplay}
      title="Clicca per rivedere l'animazione"
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
          fontSize: "clamp(2.35rem, 7.6vw, 7.4rem)",
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
          fontSize="clamp(2.45rem, 9vw, 9.2rem)"
          padding="0.08em 0.28em"
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
            fontSize="clamp(2.35rem, 7.6vw, 7.4rem)"
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
            fontSize="clamp(2.35rem, 7.6vw, 7.4rem)"
            lineHeight={0.94}
            whiteSpace="nowrap"
            padding="0"
          />
        </span>
      </div>
    </h1>
  );
}


/* ============================================================================
 * DATI STRATEGICI CYBERSEC PER I TARGET (Imprenditori e PMI, Startup, Multi)
 * ========================================================================== */
type BuyerSegmentKey = "pmi" | "startup" | "enterprise";

const BUYER_SEGMENTS: Record<
  BuyerSegmentKey,
  {
    code: string;
    badgeColor: string;
    label: string;
    headline: string;
    intro: string[];
    statement: string;
    approach: string;
    cta: string;
  }
> = {
  pmi: {
    code: "01",
    badgeColor: PALETTE.red,
    label: "Imprenditori e PMI",
    headline: "Se domani il tuo gestionale si fermasse, cosa succederebbe?",
    intro: [
      "Quante attività della tua giornata dipendono da un software, da un account o da un fornitore informatico?",
      "Spesso ci rendiamo conto di quanto siano importanti soltanto quando qualcosa smette di funzionare.",
    ],
    statement:
      "Non devi diventare un esperto di cybersecurity. Devi poter capire quali rischi riguardano la tua attività e quali decisioni è importante prendere.",
    approach:
      "Attraverso verifiche mirate possiamo individuare le criticità di sistemi e accessi, distinguere ciò che è urgente da ciò che può aspettare e costruire una base concreta per gli interventi successivi.",
    cta: "Parliamo della tua attività",
  },
  startup: {
    code: "02",
    badgeColor: PALETTE.blue,
    label: "Startup e software house",
    headline: "Il tuo prodotto funziona. Ma hai verificato cosa succede quando qualcuno prova ad abusarne?",
    intro: [
      "Hai investito tempo per svilupparlo, lanciarlo e portarlo sul mercato.",
      "Ogni nuova funzionalità, integrazione o sistema di accesso introduce però comportamenti che devono essere verificati.",
      "Una vulnerabilità può mettere a rischio i dati degli utenti, creare interruzioni o compromettere la fiducia di clienti e partner.",
    ],
    statement:
      "Non significa rallentare l'innovazione. Significa evitare che un problema trascurato comprometta il lavoro già fatto.",
    approach:
      "Con test mirati possiamo verificare le parti più sensibili del prodotto e fornire evidenze e indicazioni tecniche utilizzabili dal team di sviluppo.",
    cta: "Parliamo del tuo software",
  },
  enterprise: {
    code: "03",
    badgeColor: PALETTE.ink,
    label: "Multinazionali e grandi organizzazioni",
    headline: "Avere molti controlli non significa aver verificato ogni punto critico.",
    intro: [
      "Applicazioni, sedi, fornitori e team condividono dati e sistemi.",
      "In un'organizzazione complessa, alcune debolezze possono emergere proprio nelle interazioni tra componenti che, considerate singolarmente, sembrano funzionare correttamente.",
    ],
    statement:
      "Il valore di una verifica mirata non è sostituire ciò che già esiste. È approfondire ciò che potrebbe non essere ancora stato osservato.",
    approach:
      "L'obiettivo è fornire evidenze tecniche su sistemi e percorsi specifici, aiutando i team responsabili a comprendere meglio i rischi individuati.",
    cta: "Confrontiamoci su un sistema",
  },
};

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
      "Quello che funzionava cinque anni fa potrebbe non essere più sufficiente oggi.",
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
      "Accessi concessi senza controllo, aggiornamenti rimandati e responsabilità poco chiare possono compromettere anche sistemi moderni.",
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
      "Le minacce evolvono. Le tecnologie cambiano. Gli obblighi normativi possono cambiare.",
      "Per questo la sicurezza non dovrebbe essere una questione affrontata una volta sola e poi dimenticata.",
    ],
    statement:
      "Evolvere significa imparare a riconoscere quando è il momento di verificare, aggiornare e migliorare ciò su cui si basa la tua attività.",
  },
];

/**
 * Confronto interattivo tra scanner automatico e pentest manuale ("Cosa vede lo scanner" vs "Cosa trova il pentest manuale").
 * Conservato esportato ma attualmente non renderizzato in pagina per uso futuro.
 */
export function ScannerVsManualComparison() {
  const [scanMode, setScanMode] = useState<"scanner" | "manual">("manual");

  return (
    <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setScanMode("scanner")}
          style={{
            padding: "10px 16px",
            fontFamily: MONO_FONT,
            fontSize: "12px",
            textTransform: "uppercase",
            background: scanMode === "scanner" ? PALETTE.dim : "transparent",
            color: scanMode === "scanner" ? PALETTE.bg : PALETTE.dim,
            border: `1px solid ${PALETTE.dim}`,
            borderRadius: 0,
            cursor: "pointer",
          }}
        >
          [01] COSA VEDE LO SCANNER AUTOMATICO
        </button>
        <button
          type="button"
          onClick={() => setScanMode("manual")}
          style={{
            padding: "10px 16px",
            fontFamily: MONO_FONT,
            fontSize: "12px",
            textTransform: "uppercase",
            background: scanMode === "manual" ? PALETTE.red : "transparent",
            color: scanMode === "manual" ? "#ffffff" : PALETTE.red,
            border: `1px solid ${PALETTE.red}`,
            borderRadius: 0,
            cursor: "pointer",
          }}
        >
          [02] COSA TROVA IL PENTEST MANUALE (GO DEEPER)
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1px",
          background: "#262428",
          border: "1px solid #262428",
        }}
      >
        {(scanMode === "scanner"
          ? [
              {
                k: "RUMORE",
                v: "184 Avvisi Bassa Priorità",
                d: "Header mancanti, versioni libreria informative e cookie flag che intasano il backlog senza rischio reale.",
              },
              {
                k: "LOGICA APPLICATIVA",
                v: "0% Copertura",
                d: "Non capisce se l'utente A sta scaricando la fattura dell'utente B cambiando un UUID.",
              },
              {
                k: "DELIVERABLE",
                v: "PDF da 210 Pagine",
                d: "Nessuna prova reale di sfruttamento, decine di falsi positivi e zero codice di remediation.",
              },
            ]
          : [
              {
                k: "PRECISIONE",
                v: "Zero Falsi Positivi",
                d: "Solo vulnerabilità verificate a mano e sfruttabili in un contesto reale contro la tua infrastruttura.",
              },
              {
                k: "BUSINESS LOGIC",
                v: "Exploit Chains Complete",
                d: "Test su BOLA/IDOR, bypass MFA/RBAC, SSRF verso cloud IAM e prompt injection su agenti AI.",
              },
              {
                k: "DELIVERABLE",
                v: "PoC + Patch + Re-Test",
                d: "Passi esatti di riproduzione, fix pronte nel tuo stack e re-test finale per certificare la chiusura.",
              },
            ]
        ).map((cell) => (
          <div key={cell.k} style={{ background: PALETTE.bg, padding: "24px" }}>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "0.09em",
                color: scanMode === "manual" ? PALETTE.red : PALETTE.dim,
                marginBottom: "8px",
              }}
            >
              {cell.k}
            </div>
            <div
              style={{
                fontFamily: DISPLAY_FONT,
                fontSize: "2rem",
                textTransform: "uppercase",
                color: PALETTE.ink,
                marginBottom: "8px",
              }}
            >
              {cell.v}
            </div>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.55, color: "#9c999b" }}>
              {cell.d}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
 * COMPONENTE PRINCIPALE: SITO CYBERSEC IN STILE LARACON AU 26
 * ========================================================================== */
export function LaraconCybersecSite() {
  const [replayNonce, setReplayNonce] = useState(0);
  const [cubeExploded, setCubeExploded] = useState(false);
  const [exploitActive, setExploitActive] = useState(false);
  const pillar0Ref = useRef<HTMLDivElement | null>(null);
  const pillar1Ref = useRef<HTMLDivElement | null>(null);
  const [activeBuyer, setActiveBuyer] = useState<BuyerSegmentKey>("pmi");

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
       * 01 — HERO ("THE THREATS" -> "EVOLVE YOUR BUSINESS")
       * =================================================================== */}
      <section
        id="hero"
        aria-label="Il cambiamento digitale"
        style={{
          minHeight: "88vh",
          borderBottom: `1px solid ${PALETTE.slate}`,
          display: "flex",
          flexDirection: "column",
          padding: "clamp(28px, 5vw, 56px) clamp(20px, 4vw, 48px) 14px clamp(20px, 4vw, 48px)",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            textAlign: "left",
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              flex: 1,
              width: "100%",
              display: "flex",
              alignItems: "center",
              paddingBottom: "clamp(24px, 4vh, 48px)",
            }}
          >
            <HeroEvolveTitle
              replayKey={replayNonce}
              onReplay={() => setReplayNonce((n) => n + 1)}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "14px",
              marginTop: "auto",
            }}
          >
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
              <Link
                href="/prenota"
                style={{
                  padding: "14px 24px",
                  background: PALETTE.red,
                  color: "#ffffff",
                  fontFamily: DISPLAY_FONT,
                  fontSize: "1.25rem",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 0,
                }}
              >
                Parliamo della tua azienda →
              </Link>
              <a
                href="#go-deeper"
                style={{
                  padding: "14px 20px",
                  background: "transparent",
                  color: PALETTE.ink,
                  border: `1px solid ${PALETTE.ink}`,
                  fontFamily: MONO_FONT,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 0,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Scopri cosa è cambiato ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 02 — GO DEEPER ("FUNZIONA. MA È DAVVERO SICURO?")
       * =================================================================== */}
      <section
        id="go-deeper"
        aria-label="La consapevolezza: funziona ma è sicuro?"
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
                fontSize: "clamp(3rem, 8.2vw, 6.6rem)",
                lineHeight: 0.9,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                color: PALETTE.ink,
              }}
            >
              FUNZIONA.
              <br />
              <span style={{ color: "#F4F3FA" }}>MA È DAVVERO SICURO?</span>
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
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: PALETTE.ink }}>
                Il gestionale si apre. Le email arrivano. Il sito è online. Tutto sembra funzionare.
              </p>
              <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.55, fontWeight: 700, color: "#F4F3FA" }}>
                Ma funzionare non significa essere al sicuro.
              </p>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: "#B8B6BA" }}>
                Un software non aggiornato, un accesso dimenticato o una configurazione sbagliata possono lasciare aperta una porta che nessuno sta controllando.
              </p>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: "#B8B6BA" }}>
                E non sono soltanto le minacce a cambiare. Anche le normative impongono, alle imprese a cui si applicano, responsabilità e misure di sicurezza che non possono essere ignorate.
              </p>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: "#B8B6BA" }}>
                Il problema è che molte vulnerabilità non si vedono durante il normale lavoro quotidiano.
              </p>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "15px",
                  lineHeight: 1.55,
                  fontWeight: 700,
                  color: "#F4F3FA",
                  borderLeft: `3px solid ${PALETTE.red}`,
                  paddingLeft: "14px",
                }}
              >
                Ed è proprio ciò che non vedi che merita di essere verificato.
              </p>
              <p
                style={{
                  margin: "8px 0 0 0",
                  paddingTop: "14px",
                  borderTop: "1px solid #262428",
                  fontSize: "13.5px",
                  lineHeight: 1.6,
                  fontStyle: "italic",
                  color: PALETTE.ink,
                }}
              >
                Prima di decidere cosa cambiare, bisogna sapere dove guardare.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * 03 — IL METODO ("NON PUOI PROTEGGERE CIÒ CHE NON CONOSCI.")
       * =================================================================== */}
      <section
        id="metodo"
        aria-label="Il metodo: Deconstruct, Exploit, Remediate"
        style={{
          borderBottom: `1px solid ${PALETTE.slate}`,
          padding: "clamp(64px, 8vw, 112px) clamp(20px, 4vw, 48px)",
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
          {/* Intestazione Sezione 03 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "68ch" }}>
            <h2
              style={{
                margin: 0,
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                fontSize: "clamp(2.8rem, 6.2vw, 5.4rem)",
                lineHeight: 0.92,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                color: PALETTE.ink,
              }}
            >
              NON PUOI PROTEGGERE
              <br />
              CIÒ CHE NON CONOSCI.
            </h2>
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
                  <h3
                    style={{
                      margin: "6px 0 0 0",
                      fontSize: "clamp(1.05rem, 1.45vw, 1.25rem)",
                      lineHeight: 1.4,
                      fontWeight: 700,
                      color: "#F4F3FA",
                    }}
                  >
                    {item.title}
                  </h3>
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

          <p
            style={{
              margin: 0,
              paddingTop: "16px",
              borderTop: `1px solid ${PALETTE.slate}`,
              fontSize: "14px",
              lineHeight: 1.6,
              fontStyle: "italic",
              color: PALETTE.ink,
            }}
          >
            La consapevolezza, da sola, non basta. Deve portare a una decisione.
          </p>
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
            padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px) clamp(40px, 5vw, 64px)",
            borderBottom: `2px solid ${PALETTE.bg}`,
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2
              style={{
                margin: 0,
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                fontSize: "clamp(2.8rem, 6.2vw, 5.4rem)",
                lineHeight: 0.92,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                color: PALETTE.ink,
              }}
            >
              IL MONDO CAMBIA.
              <br />
              RESTARE FERMI È UNA SCELTA.
            </h2>
            <div style={{ maxWidth: "64ch", display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: "#B8B6BA" }}>
                Non significa inseguire ogni novità o sostituire continuamente ciò che già funziona.
              </p>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: PALETTE.ink }}>
                Significa capire quando una tecnologia, un&apos;abitudine o una misura di protezione non è più adeguata.
              </p>
            </div>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                fontSize: "clamp(2.6rem, 6vw, 5.2rem)",
                lineHeight: 0.92,
                letterSpacing: "-0.025em",
                textTransform: "uppercase",
                color: PALETTE.ink,
              }}
            >
              IL RISCHIO NON GUARDA
              <br />
              LE DIMENSIONI DELLA TUA AZIENDA.
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
                  onClick={() => setActiveBuyer(key)}
                  style={{
                    padding: "20px",
                    textAlign: "left",
                    background: isSelected ? seg.badgeColor : "#08080a",
                    color: isSelected ? selectedInk : PALETTE.ink,
                    border: `1px solid ${isSelected ? seg.badgeColor : "#2b292e"}`,
                    borderRadius: 0,
                    cursor: "pointer",
                    fontFamily: MONO_FONT,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontSize: "11px", opacity: 0.8, letterSpacing: "0.08em" }}>
                    {seg.code}
                  </div>
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

          {/* Approfondimento completo per la realtà selezionata */}
          <div
            role="tabpanel"
            style={{
              border: `1px solid ${buyer.badgeColor}`,
              background: "rgba(1, 1, 1, 0.94)",
              padding: "clamp(24px, 4vw, 40px)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ borderBottom: "1px solid #262428", paddingBottom: "16px" }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: DISPLAY_FONT,
                  fontSize: "clamp(1.7rem, 3.2vw, 2.5rem)",
                  lineHeight: 1.05,
                  textTransform: "uppercase",
                  color: "#F4F3FA",
                }}
              >
                {buyer.headline}
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "68ch" }}>
              {buyer.intro.map((paragraph) => (
                <p key={paragraph} style={{ margin: 0, fontSize: "14px", lineHeight: 1.68, color: PALETTE.ink }}>
                  {paragraph}
                </p>
              ))}
              <p
                style={{
                  margin: "6px 0",
                  paddingLeft: "16px",
                  borderLeft: `3px solid ${buyer.badgeColor}`,
                  fontSize: "15px",
                  lineHeight: 1.6,
                  fontWeight: 700,
                  color: "#F4F3FA",
                }}
              >
                {buyer.statement}
              </p>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.68, color: "#B8B6BA" }}>
                {buyer.approach}
              </p>
            </div>

            <div style={{ paddingTop: "8px" }}>
              <Link
                href="/prenota"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "14px 24px",
                  background: buyer.badgeColor,
                  color: buyer.badgeColor === PALETTE.ink ? PALETTE.bg : "#ffffff",
                  fontFamily: DISPLAY_FONT,
                  fontSize: "1.25rem",
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 0,
                }}
              >
                {buyer.cta} →
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
          minHeight: "86vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "clamp(56px, 7vw, 96px) clamp(20px, 4vw, 48px) 0 clamp(20px, 4vw, 48px)",
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
              fontFamily: DISPLAY_FONT,
              fontWeight: 700,
              fontSize: "clamp(3rem, 8.8vw, 7rem)",
              lineHeight: 0.9,
              letterSpacing: "-0.025em",
              textTransform: "uppercase",
              color: PALETTE.bg,
            }}
          >
            IL PROSSIMO ATTACCO
            <br />
            NON TI AVVISERÀ.
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              maxWidth: "60ch",
              marginTop: "6px",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: "#1B1A1D" }}>
              Ma questo non significa che tu debba aspettarlo per iniziare a porti le domande giuste.
            </p>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.65, color: "#1B1A1D" }}>
              Sai quali tecnologie sostengono davvero la tua attività? Sai quando sono state verificate l&apos;ultima volta? Sai quali responsabilità di sicurezza e conformità riguardano la tua impresa?
            </p>
            <p style={{ margin: "4px 0", fontSize: "15.5px", lineHeight: 1.55, fontWeight: 700, color: PALETTE.bg }}>
              Non devi conoscere tutte le risposte oggi. Devi sapere da dove iniziare a cercarle.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", marginTop: "8px" }}>
            <Link
              href="/prenota"
              style={{
                padding: "16px 28px",
                background: PALETTE.bg,
                color: PALETTE.ink,
                fontFamily: DISPLAY_FONT,
                fontSize: "1.35rem",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: 0,
              }}
            >
              Prenota un primo confronto →
            </Link>
            <a
              href={PHONE_NUMBER}
              style={{
                padding: "16px 24px",
                background: "transparent",
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

        {/* Sole / Semisfera rossa dithered che sorge dal basso */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "min(640px, 100%)",
            margin: "28px auto 0 auto",
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
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      </section>
    </div>
  );
}

