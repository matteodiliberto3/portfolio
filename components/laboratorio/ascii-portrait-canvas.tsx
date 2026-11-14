"use client";

import React, { useEffect, useRef, useState } from "react";

interface AsciiPortraitCanvasProps {
  src: string;
  alt: string;
  logicalSize?: number;
  cols?: number;
  rows?: number;
  bgColor?: string;
  accentColors?: readonly [string, string, string];
  className?: string;
  style?: React.CSSProperties;
}

interface AsciiCell {
  cx: number;
  cy: number;
  gx: number;
  gy: number;
  glyph: string;
  fontWeight: 500 | 700 | 800;
  color: string;
  revealOrder: number;
}

// Optical ink-density ASCII ramps ordered strictly for uniform cap-height rendering on #010101.
const PURE_ASCII_RAMP = "..::--==++*7132546908$#B@";
const SUIT_ASCII_RAMP = "..:;~=7132546908#";
const CIPHER_GLYPHS = "01#<>*+=/:;[]~";
const DEFAULT_ACCENTS = ["#3E3EE0", "#C50B3F", "#F4F3FA"] as const;

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Estimates per-row background plaster RGB from the outer left and right border strips,
 * then smooths vertically to suppress compression noise.
 */
function estimatePerimeterWall(
  data: Uint8ClampedArray,
  segW: number,
  segH: number
): { leftBg: Float32Array; rightBg: Float32Array } {
  const rawLeft = new Float32Array(segH * 3);
  const rawRight = new Float32Array(segH * 3);
  const marginCols = Math.max(6, Math.min(32, Math.floor(segW * 0.04)));

  for (let y = 0; y < segH; y++) {
    let lr = 0;
    let lg = 0;
    let lb = 0;
    let rr = 0;
    let rg = 0;
    let rb = 0;
    for (let x = 1; x <= marginCols; x++) {
      const li = (y * segW + x) * 4;
      lr += data[li];
      lg += data[li + 1];
      lb += data[li + 2];

      const rx = segW - 1 - x;
      const ri = (y * segW + rx) * 4;
      rr += data[ri];
      rg += data[ri + 1];
      rb += data[ri + 2];
    }
    const base = y * 3;
    rawLeft[base] = lr / marginCols;
    rawLeft[base + 1] = lg / marginCols;
    rawLeft[base + 2] = lb / marginCols;
    rawRight[base] = rr / marginCols;
    rawRight[base + 1] = rg / marginCols;
    rawRight[base + 2] = rb / marginCols;
  }

  const leftBg = new Float32Array(segH * 3);
  const rightBg = new Float32Array(segH * 3);
  const win = Math.max(8, Math.round(segH * 0.017));
  for (let y = 0; y < segH; y++) {
    const y0 = Math.max(0, y - win);
    const y1 = Math.min(segH - 1, y + win);
    const count = y1 - y0 + 1;
    let slr = 0;
    let slg = 0;
    let slb = 0;
    let srr = 0;
    let srg = 0;
    let srb = 0;
    for (let k = y0; k <= y1; k++) {
      const kb = k * 3;
      slr += rawLeft[kb];
      slg += rawLeft[kb + 1];
      slb += rawLeft[kb + 2];
      srr += rawRight[kb];
      srg += rawRight[kb + 1];
      srb += rawRight[kb + 2];
    }
    const base = y * 3;
    leftBg[base] = slr / count;
    leftBg[base + 1] = slg / count;
    leftBg[base + 2] = slb / count;
    rightBg[base] = srr / count;
    rightBg[base + 1] = srg / count;
    rightBg[base + 2] = srb / count;
  }

  return { leftBg, rightBg };
}

/**
 * Edge-seeded flood-fill background segmentation tuned for warm-stone studio plaster:
 * allows natural warm beige shadows on the right wall while blocking peach/red skin chroma,
 * dark hair, navy jacket, and sharp contour gradients, plus rim halo de-fringing.
 */
function buildForegroundMask(
  data: Uint8ClampedArray,
  segW: number,
  segH: number
): { alphaMask: Float32Array; cleanedRgb: Uint8ClampedArray } {
  const total = segW * segH;
  const { leftBg, rightBg } = estimatePerimeterWall(data, segW, segH);
  const bgVisited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isWallAt = (idx: number, prevIdx: number): boolean => {
    const p4 = idx * 4;
    const r = data[p4];
    const g = data[p4 + 1];
    const b = data[p4 + 2];

    const y = Math.floor(idx / segW);
    const x = idx - y * segW;
    const tx = x / Math.max(1, segW - 1);
    const rbIdx = y * 3;
    const br = leftBg[rbIdx] + (rightBg[rbIdx] - leftBg[rbIdx]) * tx;
    const bg = leftBg[rbIdx + 1] + (rightBg[rbIdx + 1] - leftBg[rbIdx + 1]) * tx;
    const bb = leftBg[rbIdx + 2] + (rightBg[rbIdx + 2] - leftBg[rbIdx + 2]) * tx;

    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const bgLuma = 0.299 * br + 0.587 * bg + 0.114 * bb;
    if (luma < 118 || luma < bgLuma - 68) return false;

    // Exclude dark/midtone cool navy clothing fringes while allowing bright cool-lit wall shadows.
    if (b - r > 18 && luma < 155) return false;

    // Smooth plaster drifts gradually across the wall; skin jumps sharply relative to local perimeter tone.
    const redGreen = r - g;
    const bgRedGreen = br - bg;
    const rgDelta = redGreen - bgRedGreen;
    const warmthDelta = r - b - (br - bb);
    if ((redGreen > 31 && r - b > 54) || rgDelta > 13 || warmthDelta > 22) return false;

    const dist = Math.hypot(r - br, g - bg, b - bb);
    if (dist > 70) return false;

    if (prevIdx >= 0) {
      const pp4 = prevIdx * 4;
      const stepDiff = Math.hypot(r - data[pp4], g - data[pp4 + 1], b - data[pp4 + 2]);
      if (stepDiff > 21) return false;
    }

    return true;
  };

  const trySeed = (x: number, y: number) => {
    const idx = y * segW + x;
    if (bgVisited[idx]) return;
    if (isWallAt(idx, -1)) {
      bgVisited[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < segW; x++) {
    trySeed(x, 0);
    trySeed(x, 1);
  }
  for (let y = 0; y < segH; y++) {
    trySeed(0, y);
    trySeed(1, y);
    trySeed(segW - 1, y);
    trySeed(segW - 2, y);
  }
  const bottomMargin = Math.floor(segW * 0.09);
  for (let x = 0; x < bottomMargin; x++) {
    trySeed(x, segH - 1);
    trySeed(segW - 1 - x, segH - 1);
  }

  while (head < tail) {
    const idx = queue[head++];
    const y = Math.floor(idx / segW);
    const x = idx - y * segW;

    if (x > 0) {
      const n = idx - 1;
      if (!bgVisited[n] && isWallAt(n, idx)) {
        bgVisited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (x < segW - 1) {
      const n = idx + 1;
      if (!bgVisited[n] && isWallAt(n, idx)) {
        bgVisited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (y > 0) {
      const n = idx - segW;
      if (!bgVisited[n] && isWallAt(n, idx)) {
        bgVisited[n] = 1;
        queue[tail++] = n;
      }
    }
    if (y < segH - 1) {
      const n = idx + segW;
      if (!bgVisited[n] && isWallAt(n, idx)) {
        bgVisited[n] = 1;
        queue[tail++] = n;
      }
    }
  }

  const alphaMask = new Float32Array(total);
  const cleanedRgb = new Uint8ClampedArray(data);

  for (let i = 0; i < total; i++) {
    alphaMask[i] = bgVisited[i] ? 0 : 1;
  }

  // Strip extreme outer ~0.4% JPEG border rows so no detached 1px bottom line can linger.
  const borderRows = Math.max(2, Math.round(segH * 0.004));
  const haloRadius = Math.max(2, Math.round(segW * 0.004));
  for (let x = 0; x < segW; x++) {
    alphaMask[x] = 0;
    for (let b = 1; b <= borderRows; b++) {
      alphaMask[(segH - b) * segW + x] = 0;
    }
  }

  // Feather perimeter transitions without clipping the lower cuff buttons or bottom-right suit hem,
  // preserve fine hair tips, strip isolated dust, and pull interior dark hue onto light wall-halo rims.
  for (let y = 1; y < segH - borderRows; y++) {
    for (let x = 1; x < segW - 1; x++) {
      const idx = y * segW + x;
      if (bgVisited[idx]) {
        alphaMask[idx] = 0;
        continue;
      }

      const bgNeighbors =
        bgVisited[idx - 1] +
        bgVisited[idx + 1] +
        bgVisited[idx - segW] +
        bgVisited[idx + segW];

      if (bgNeighbors === 4) {
        alphaMask[idx] = 0;
        continue;
      }

      if (bgNeighbors > 0) {
        const p4 = idx * 4;
        const r = data[p4];
        const g = data[p4 + 1];
        const b = data[p4 + 2];
        const redGreen = r - g;
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;

        if (bgNeighbors === 3 && luma >= 105) {
          alphaMask[idx] = 0;
          continue;
        }

        if (redGreen < 14 && luma > 112) {
          let sumR = 0;
          let sumG = 0;
          let sumB = 0;
          let count = 0;
          for (let dy = -haloRadius; dy <= haloRadius; dy++) {
            const yy = y + dy;
            if (yy < 0 || yy >= segH) continue;
            for (let dx = -haloRadius; dx <= haloRadius; dx++) {
              const xx = x + dx;
              if (xx < 0 || xx >= segW) continue;
              const ni = yy * segW + xx;
              if (bgVisited[ni]) continue;
              const np4 = ni * 4;
              const nluma = 0.299 * data[np4] + 0.587 * data[np4 + 1] + 0.114 * data[np4 + 2];
              if (nluma < 116) {
                sumR += data[np4];
                sumG += data[np4 + 1];
                sumB += data[np4 + 2];
                count++;
              }
            }
          }
          if (count > 0) {
            cleanedRgb[p4] = clampByte(sumR / count);
            cleanedRgb[p4 + 1] = clampByte(sumG / count);
            cleanedRgb[p4 + 2] = clampByte(sumB / count);
          }
        }

        alphaMask[idx] = Math.max(0.26, 1 - bgNeighbors * 0.23);
      } else {
        alphaMask[idx] = 1;
      }
    }
  }

  return { alphaMask, cleanedRgb };
}

function buildAsciiCells(
  img: HTMLImageElement,
  cols: number,
  rows: number,
  logicalSize: number
): AsciiCell[] {
  const segW = 800;
  const segH = 800;

  const offscreen = document.createElement("canvas");
  offscreen.width = segW;
  offscreen.height = segH;
  const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!offCtx) return [];

  offCtx.imageSmoothingEnabled = true;
  offCtx.imageSmoothingQuality = "high";
  offCtx.drawImage(img, 0, 0, segW, segH);

  const imgData = offCtx.getImageData(0, 0, segW, segH).data;
  const { alphaMask, cleanedRgb } = buildForegroundMask(imgData, segW, segH);

  const cellCount = cols * rows;
  const gridR = new Float32Array(cellCount);
  const gridG = new Float32Array(cellCount);
  const gridB = new Float32Array(cellCount);
  const gridA = new Float32Array(cellCount);
  const gridLum = new Float32Array(cellCount);

  for (let gy = 0; gy < rows; gy++) {
    const sy0 = Math.floor((gy / rows) * segH);
    const sy1 = Math.max(sy0 + 1, Math.floor(((gy + 1) / rows) * segH));
    for (let gx = 0; gx < cols; gx++) {
      const sx0 = Math.floor((gx / cols) * segW);
      const sx1 = Math.max(sx0 + 1, Math.floor(((gx + 1) / cols) * segW));

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      let samples = 0;

      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const si = sy * segW + sx;
          const a = alphaMask[si];
          sumA += a;
          if (a > 0.05) {
            const p4 = si * 4;
            sumR += cleanedRgb[p4] * a;
            sumG += cleanedRgb[p4 + 1] * a;
            sumB += cleanedRgb[p4 + 2] * a;
          }
          samples++;
        }
      }

      const idx = gy * cols + gx;
      const avgA = sumA / Math.max(1, samples);
      gridA[idx] = avgA;
      if (sumA > 0.05) {
        const r = sumR / sumA;
        const g = sumG / sumA;
        const b = sumB / sumA;
        gridR[idx] = r;
        gridG[idx] = g;
        gridB[idx] = b;
        gridLum[idx] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      }
    }
  }

  const cellW = logicalSize / cols;
  const cellH = logicalSize / rows;
  const cells: AsciiCell[] = [];

  const MAT_NONE = 0;
  const MAT_SUIT = 1;
  const MAT_SHIRT = 2;
  const MAT_HAIR = 3;
  const MAT_SKIN = 4;

  const gridMat = new Uint8Array(cellCount);
  const gridDetail = new Float32Array(cellCount);
  const gridSobelX = new Float32Array(cellCount);
  const gridSobelY = new Float32Array(cellCount);
  const gridEdgeMag = new Float32Array(cellCount);

  for (let gy = 0; gy < rows; gy++) {
    const ny = gy / Math.max(1, rows - 1);
    for (let gx = 0; gx < cols; gx++) {
      const idx = gy * cols + gx;
      if (gridA[idx] < 0.16) continue;

      const nx = gx / Math.max(1, cols - 1);
      const r = gridR[idx];
      const g = gridG[idx];
      const b = gridB[idx];
      const lum = gridLum[idx];
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      const warmDiff = r - b;
      const rgDiff = r - g;
      const blueDiff = b - r;

      let lumSum = 0;
      let lumN = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = gy + dy;
        if (yy < 0 || yy >= rows) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = gx + dx;
          if (xx < 0 || xx >= cols) continue;
          const ni = yy * cols + xx;
          if (gridA[ni] > 0.16) {
            lumSum += gridLum[ni];
            lumN++;
          }
        }
      }
      const blurLum = lumN > 0 ? lumSum / lumN : lum;
      gridDetail[idx] = lum - blurLum;

      // Classify garment and anatomical regions accurately.
      const isShirt =
        ny >= 0.365 &&
        nx >= 0.36 &&
        nx <= 0.76 &&
        ((lum >= 0.44 && blueDiff < 20) || (lum >= 0.34 && blueDiff <= 6)) &&
        rgDiff < 16 &&
        warmDiff < 38 &&
        chroma < 48;

      if (isShirt) {
        gridMat[idx] = MAT_SHIRT;
        continue;
      }

      const isFaceOrHeadSkin =
        ny < 0.39 && warmDiff >= 12 && (lum >= 0.14 || rgDiff >= 4);
      const isNeckSkin =
        ny >= 0.33 &&
        ny <= 0.45 &&
        nx >= 0.37 &&
        nx <= 0.565 &&
        warmDiff >= 13 &&
        lum >= 0.12;
      const isHandSkin = ny >= 0.58 && warmDiff >= 15 && rgDiff >= 5;

      if (isFaceOrHeadSkin || isNeckSkin || isHandSkin) {
        gridMat[idx] = MAT_SKIN;
      } else if (ny < 0.415 && lum < 0.27) {
        gridMat[idx] = MAT_HAIR;
      } else if (ny >= 0.365 && lum < 0.44) {
        gridMat[idx] = MAT_SUIT;
      }
    }
  }

  // Pass 2: 3x3 Sobel structural gradient strictly inside solid foreground (no outer wall rim artifacts).
  for (let gy = 1; gy < rows - 1; gy++) {
    for (let gx = 1; gx < cols - 1; gx++) {
      const idx = gy * cols + gx;
      if (gridA[idx] < 0.55) continue;

      let interior = true;
      for (let dy = -1; dy <= 1 && interior; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (gridA[(gy + dy) * cols + (gx + dx)] < 0.45) {
            interior = false;
            break;
          }
        }
      }
      if (!interior) continue;

      const tl = gridLum[(gy - 1) * cols + (gx - 1)];
      const tc = gridLum[(gy - 1) * cols + gx];
      const tr = gridLum[(gy - 1) * cols + (gx + 1)];
      const ml = gridLum[gy * cols + (gx - 1)];
      const mr = gridLum[gy * cols + (gx + 1)];
      const bl = gridLum[(gy + 1) * cols + (gx - 1)];
      const bc = gridLum[(gy + 1) * cols + gx];
      const br = gridLum[(gy + 1) * cols + (gx + 1)];

      const sx = tr + 2 * mr + br - (tl + 2 * ml + bl);
      const sy = bl + 2 * bc + br - (tl + 2 * tc + tr);
      gridSobelX[idx] = sx;
      gridSobelY[idx] = sy;
      gridEdgeMag[idx] = Math.hypot(sx, sy);
    }
  }

  for (let gy = 0; gy < rows; gy++) {
    const ny = gy / Math.max(1, rows - 1);
    const bRow = BAYER_4X4[gy & 3];

    for (let gx = 0; gx < cols; gx++) {
      const idx = gy * cols + gx;
      const alpha = gridA[idx];
      if (alpha < 0.16) continue;

      const nx = gx / Math.max(1, cols - 1);
      const rawR = gridR[idx];
      const rawG = gridG[idx];
      const rawB = gridB[idx];
      const lum = gridLum[idx];
      const detail = gridDetail[idx];
      const edgeMag = gridEdgeMag[idx];
      const mat = gridMat[idx];

      const cellHash = ((gx * 73856093) ^ (gy * 19349663)) >>> 0;
      const distCenter = Math.hypot((nx - 0.5) * 1.15, ny - 0.42);
      const revealOrder = clamp01(ny * 0.46 + distCenter * 0.36 + ((cellHash % 1000) / 1000) * 0.18);

      const isSuit = mat === MAT_SUIT;
      const isHair = mat === MAT_HAIR;
      const isShirt = mat === MAT_SHIRT;
      const isSkin = mat === MAT_SKIN;

      // Compensate black character spacing on dark #010101 canvas cleanly with zero binary cliffs.
      let rOut = 0;
      let gOut = 0;
      let bOut = 0;

      if (isSuit) {
        const blueDiff = rawB - rawR;
        const lapelMix = 1 - smoothstep(3, 12, blueDiff);
        const foldGain = smoothstep(0.02, 0.28, lum);
        const edgeBoost = Math.min(1, edgeMag * 1.1 + Math.abs(detail) * 10);

        const blueR = Math.max(26, clampByte(rawR * 1.18 + 14 + foldGain * 14 + edgeBoost * 16));
        const blueG = Math.max(46, clampByte(rawG * 1.28 + 26 + foldGain * 22 + edgeBoost * 22));
        const blueB = Math.max(96, clampByte(rawB * 1.44 + 54 + foldGain * 34 + edgeBoost * 34));

        const lapelBase = lum * 255;
        const lapelR = Math.max(38, clampByte(lapelBase * 1.18 + 22 + edgeBoost * 18));
        const lapelG = Math.max(46, clampByte(lapelBase * 1.24 + 28 + edgeBoost * 20));
        const lapelB = Math.max(68, clampByte(lapelBase * 1.38 + 44 + edgeBoost * 26));

        rOut = clampByte(blueR + (lapelR - blueR) * lapelMix + detail * 16);
        gOut = clampByte(blueG + (lapelG - blueG) * lapelMix + detail * 18);
        bOut = clampByte(blueB + (lapelB - blueB) * lapelMix + detail * 22);
      } else {
        const shadowBlend = 1 - smoothstep(0.04, 0.26, lum);
        const exp = isShirt ? 0.82 : isHair ? 0.86 + shadowBlend * 0.08 : 0.82 + shadowBlend * 0.16;
        const gain = isShirt ? 1.16 : isHair ? 1.24 : 1.17;
        const hairLift = isHair ? (1 - smoothstep(0.0, 0.22, lum)) * 22 : 0;
        const detailShift = detail * (isShirt ? 44 : isHair ? 34 : 36);

        const liftCh = (ch: number) =>
          clampByte(Math.pow(clamp01(ch / 255), exp) * 255 * gain + detailShift + hairLift);

        rOut = liftCh(rawR);
        gOut = liftCh(rawG);
        bOut = liftCh(rawB);

        // Keep dark eyes/pupils and eyebrows grounded with subtle charcoal presence.
        if (isSkin && lum < 0.11 && ny >= 0.17 && ny <= 0.275) {
          rOut = Math.max(20, rOut);
          gOut = Math.max(15, gOut);
          bOut = Math.max(14, bOut);
        }
      }

      const ditherLum = clamp01(lum + (bRow[gx & 3] / 16 - 0.5) * 0.065);
      const sharpLum = clamp01(ditherLum + detail * (isShirt ? 1.85 : isHair ? 1.35 : 1.45));

      // Determine pure ASCII character: crisp directional strokes strictly on strong suit seams/pocket lines,
      // and micro-sharpened full-height optical density glyphs everywhere else so skin & shirt stay seamless.
      let glyph: string;
      if (isSuit && edgeMag >= 0.78 && lum >= 0.06) {
        const sx = gridSobelX[idx];
        const sy = gridSobelY[idx];
        const absX = Math.abs(sx);
        const absY = Math.abs(sy);
        if (absY > absX * 1.85) {
          glyph = edgeMag > 1.05 ? "=" : "-";
        } else if (absX > absY * 1.85) {
          glyph = "|";
        } else if (sx * sy > 0) {
          glyph = "/";
        } else {
          glyph = "\\";
        }
      } else if (isSuit) {
        const sTone = clamp01(ditherLum * 2.55 + Math.abs(detail) * 1.9);
        const sIdx = Math.min(
          SUIT_ASCII_RAMP.length - 1,
          Math.max(0, Math.floor(sTone * (SUIT_ASCII_RAMP.length - 0.01)))
        );
        glyph = SUIT_ASCII_RAMP[sIdx];
      } else if (isSkin && lum < 0.11 && ny >= 0.17 && ny <= 0.275) {
        // Dense dark glyph for pupils/iris and brows so eyes read solidly next to sclera.
        glyph = cellHash % 2 === 0 ? "#" : "8";
      } else {
        const tone = isShirt
          ? clamp01(0.32 + sharpLum * 0.68)
          : isHair
            ? clamp01(0.16 + ditherLum * 2.05 + detail * 1.35)
            : clamp01(Math.pow(sharpLum, 0.84) * 0.94 + 0.06);
        const pIdx = Math.min(
          PURE_ASCII_RAMP.length - 1,
          Math.max(0, Math.floor(tone * (PURE_ASCII_RAMP.length - 0.01)))
        );
        glyph = PURE_ASCII_RAMP[pIdx];
      }

      let fontWeight: 500 | 700 | 800;
      if (isSuit) {
        fontWeight = lum > 0.20 || edgeMag >= 0.74 ? 700 : 500;
      } else if (lum >= 0.52) {
        fontWeight = 800;
      } else if (lum >= 0.14) {
        fontWeight = 700;
      } else {
        fontWeight = 500;
      }

      const color =
        alpha >= 0.98
          ? `rgb(${rOut}, ${gOut}, ${bOut})`
          : `rgba(${rOut}, ${gOut}, ${bOut}, ${alpha.toFixed(2)})`;

      cells.push({
        cx: (gx + 0.5) * cellW,
        cy: (gy + 0.5) * cellH,
        gx,
        gy,
        glyph,
        fontWeight,
        color,
        revealOrder,
      });
    }
  }

  return cells;
}

/**
 * 100% pure-ASCII portrait renderer with studio-wall segmentation,
 * Sobel directional contours, ink-density luminance compensation, and cipher reveal.
 */
export function AsciiPortraitCanvas({
  src,
  alt,
  logicalSize = 960,
  cols = 188,
  rows = 162,
  bgColor = "#010101",
  accentColors = DEFAULT_ACCENTS,
  className = "",
  style,
}: AsciiPortraitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isVisibleRef = useRef(true);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let cancelled = false;
    let rafId = 0;
    let cells: AsciiCell[] = [];
    let settledBuffer: HTMLCanvasElement | null = null;
    let resolvedFont = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const backingSize = Math.round(logicalSize * dpr);
    canvas.width = backingSize;
    canvas.height = backingSize;

    const cellH = logicalSize / rows;
    const fontPx = Number((cellH * 1.35).toFixed(2));
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;

    let animStart = 0;
    let revealDone = false;
    const revealDurationMs = 900;

    const buildSettledBuffer = () => {
      if (cells.length === 0) return;
      const buf = document.createElement("canvas");
      buf.width = backingSize;
      buf.height = backingSize;
      const bCtx = buf.getContext("2d", { alpha: true });
      if (!bCtx) return;

      bCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (bgColor === "transparent") {
        bCtx.clearRect(0, 0, logicalSize, logicalSize);
      } else {
        bCtx.fillStyle = bgColor;
        bCtx.fillRect(0, 0, logicalSize, logicalSize);
      }

      bCtx.textAlign = "center";
      bCtx.textBaseline = "middle";

      const weights: readonly (500 | 700 | 800)[] = [500, 700, 800];
      for (let w = 0; w < weights.length; w++) {
        const targetWeight = weights[w];
        bCtx.font = `${targetWeight} ${fontPx}px ${resolvedFont}`;
        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];
          if (cell.fontWeight !== targetWeight) continue;
          bCtx.fillStyle = cell.color;
          bCtx.fillText(cell.glyph, cell.cx, cell.cy);
        }
      }

      settledBuffer = buf;
    };

    const drawSettled = () => {
      if (cancelled || cells.length === 0) return;
      if (!settledBuffer) buildSettledBuffer();
      if (!settledBuffer) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalSize, logicalSize);
      ctx.drawImage(settledBuffer, 0, 0, logicalSize, logicalSize);
    };

    const drawAnimatedFrame = (now: number) => {
      if (cancelled || cells.length === 0) return;
      if (reducedMotion || revealDone) {
        drawSettled();
        rafId = 0;
        return;
      }

      if (animStart === 0) animStart = now;
      const elapsed = now - animStart;
      const revealProgress = clamp01(elapsed / revealDurationMs);

      if (revealProgress >= 1) {
        revealDone = true;
        rafId = 0;
        drawSettled();
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tickBucket = Math.floor(now / 52);

      if (bgColor === "transparent") {
        ctx.clearRect(0, 0, logicalSize, logicalSize);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, logicalSize, logicalSize);
      }

      let currentWeight = 700;
      ctx.font = `700 ${fontPx}px ${resolvedFont}`;

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const gate = cell.revealOrder * 0.72;
        if (revealProgress < gate) continue;

        const localProgress = clamp01((revealProgress - gate) / 0.28);
        if (localProgress < 0.82) {
          if (currentWeight !== 700) {
            currentWeight = 700;
            ctx.font = `700 ${fontPx}px ${resolvedFont}`;
          }
          const cHash = ((cell.gx * 97 + cell.gy * 193 + tickBucket * 31) >>> 0);
          const scrambleChar = CIPHER_GLYPHS[cHash % CIPHER_GLYPHS.length];
          ctx.fillStyle = accentColors[cHash % accentColors.length];
          ctx.fillText(scrambleChar, cell.cx, cell.cy);
        } else {
          if (currentWeight !== cell.fontWeight) {
            currentWeight = cell.fontWeight;
            ctx.font = `${currentWeight} ${fontPx}px ${resolvedFont}`;
          }
          ctx.fillStyle = cell.color;
          ctx.fillText(cell.glyph, cell.cx, cell.cy);
        }
      }

      if (isVisibleRef.current) {
        rafId = requestAnimationFrame(drawAnimatedFrame);
      } else {
        rafId = 0;
      }
    };

    const startOrWakeLoop = () => {
      if (cancelled || cells.length === 0) return;
      if (reducedMotion || revealDone) {
        drawSettled();
        return;
      }
      if (!rafId && isVisibleRef.current) {
        rafId = requestAnimationFrame(drawAnimatedFrame);
      }
    };

    const img = new Image();
    img.decoding = "async";

    img.onload = () => {
      if (cancelled) return;

      const finalizeBuild = () => {
        if (cancelled) return;
        const computedFont = window.getComputedStyle(canvas).fontFamily;
        if (computedFont && computedFont.indexOf("var(") === -1) {
          resolvedFont = computedFont;
        }
        cells = buildAsciiCells(img, cols, rows, logicalSize);
        buildSettledBuffer();
        animStart = performance.now();
        setStatus("ready");
        if (reducedMotion) {
          drawSettled();
        } else if (isVisibleRef.current) {
          rafId = requestAnimationFrame(drawAnimatedFrame);
        } else {
          drawSettled();
        }
      };

      if (typeof document !== "undefined" && document.fonts?.ready) {
        document.fonts.ready.then(finalizeBuild).catch(finalizeBuild);
      } else {
        finalizeBuild();
      }
    };

    img.onerror = () => {
      if (!cancelled) setStatus("error");
    };

    img.src = src;

    const handleMotionChange = () => {
      reducedMotion = motionQuery.matches;
      cancelAnimationFrame(rafId);
      rafId = 0;
      drawSettled();
    };

    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", handleMotionChange);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isVisibleRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        } else {
          startOrWakeLoop();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      observer.disconnect();
      if (typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", handleMotionChange);
      }
    };
  }, [src, logicalSize, cols, rows, bgColor, accentColors]);

  if (status === "error") {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        aspectRatio: "1 / 1",
        background: bgColor,
        fontFamily: "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace",
        opacity: status === "ready" ? 1 : 0,
        transition: "opacity 280ms ease",
        userSelect: "none",
        ...style,
      }}
    />
  );
}
