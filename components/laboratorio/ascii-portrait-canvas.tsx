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
  color: string;
  revealOrder: number;
}

// Monospace density ramp ordered strictly by visual pixel coverage on #010101.
const ASCII_RAMP = ".:;-~=+*x0%#8@";
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
  const marginCols = Math.max(5, Math.min(12, Math.floor(segW * 0.04)));

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
  const win = 8;
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
    if (luma < 132 || luma < bgLuma - 56) return false;

    // Exclude cool navy clothing fringes.
    if (b - r > 6) return false;

    // Neutral/beige plaster keeps red close to green; human skin jumps sharply in (r - g).
    const redGreen = r - g;
    const bgRedGreen = br - bg;
    const rgDelta = redGreen - bgRedGreen;
    const warmthDelta = r - b - (br - bb);
    if (redGreen > 22 || rgDelta > 12 || warmthDelta > 20) return false;

    const dist = Math.hypot(r - br, g - bg, b - bb);
    if (dist > 56) return false;

    if (prevIdx >= 0) {
      const pp4 = prevIdx * 4;
      const stepDiff = Math.hypot(r - data[pp4], g - data[pp4 + 1], b - data[pp4 + 2]);
      if (stepDiff > 22) return false;
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
  }
  for (let y = 0; y < segH; y++) {
    trySeed(0, y);
    trySeed(segW - 1, y);
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

  // Feather perimeter transitions, strip 1px isolated dust, and pull interior dark hue onto rim halos.
  for (let y = 1; y < segH - 1; y++) {
    const ny = y / (segH - 1);
    const bottomFade = 1 - smoothstep(0.91, 0.992, ny);

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

      if (bgNeighbors >= 3) {
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

        if (redGreen < 18 && luma > 102) {
          let sumR = 0;
          let sumG = 0;
          let sumB = 0;
          let count = 0;
          for (let dy = -2; dy <= 2; dy++) {
            const yy = y + dy;
            if (yy < 0 || yy >= segH) continue;
            for (let dx = -2; dx <= 2; dx++) {
              const xx = x + dx;
              if (xx < 0 || xx >= segW) continue;
              const ni = yy * segW + xx;
              if (bgVisited[ni]) continue;
              const np4 = ni * 4;
              const nluma = 0.299 * data[np4] + 0.587 * data[np4 + 1] + 0.114 * data[np4 + 2];
              if (nluma < 118) {
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

        alphaMask[idx] = Math.max(0.32, 1 - bgNeighbors * 0.25) * bottomFade;
      } else {
        alphaMask[idx] = bottomFade;
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
  const segW = 320;
  const segH = 320;

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

  for (let gy = 0; gy < rows; gy++) {
    const ny = gy / Math.max(1, rows - 1);
    const bRow = BAYER_4X4[gy & 3];

    for (let gx = 0; gx < cols; gx++) {
      const idx = gy * cols + gx;
      const alpha = gridA[idx];
      if (alpha < 0.16) continue;

      const lum = gridLum[idx];

      // Gentle 3x3 detail pass keeps pupils, eyebrows, mouth, and finger gaps crisp without blotching skin.
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
      const detail = lum - blurLum;
      const sharpLum = clamp01(lum + detail * 0.34);

      // Compensate glyph-vs-void brightness loss on #010101 while keeping dark facial creases expressive.
      const isFineDarkCrease = detail < -0.05 && ny < 0.78;
      const rawR = gridR[idx];
      const rawG = gridG[idx];
      const rawB = gridB[idx];

      const liftGamma = (channel: number, suitBias: number) => {
        const lifted = Math.pow(clamp01(channel / 255), 0.78) * 255;
        const suitBoost = isFineDarkCrease ? 4 : Math.pow(Math.max(0, 1 - lum), 1.7) * suitBias;
        return clampByte(lifted + suitBoost);
      };

      const rComp = liftGamma(rawR, 34);
      const gComp = liftGamma(rawG, 40);
      const bComp = liftGamma(rawB, 56);

      const bayerOffset = (bRow[gx & 3] / 16 - 0.5) * 0.065;
      const minFloor = isFineDarkCrease ? 0.02 : 0.13;
      const tone = clamp01(Math.max(minFloor, sharpLum * 0.96 + 0.06) + bayerOffset);

      const rampIdx = Math.min(
        ASCII_RAMP.length - 1,
        Math.max(0, Math.floor(tone * (ASCII_RAMP.length - 0.01)))
      );
      const glyph = ASCII_RAMP[rampIdx];

      const color =
        alpha >= 0.98
          ? `rgb(${rComp}, ${gComp}, ${bComp})`
          : `rgba(${rComp}, ${gComp}, ${bComp}, ${alpha.toFixed(2)})`;

      const nx = gx / Math.max(1, cols - 1);
      const distCenter = Math.hypot((nx - 0.5) * 1.15, ny - 0.42);
      const hash = (((gx * 73856093) ^ (gy * 19349663)) >>> 0) % 1000;
      const revealOrder = clamp01(ny * 0.46 + distCenter * 0.36 + (hash / 1000) * 0.18);

      cells.push({
        cx: (gx + 0.5) * cellW,
        cy: (gy + 0.5) * cellH,
        gx,
        gy,
        glyph,
        color,
        revealOrder,
      });
    }
  }

  return cells;
}

/**
 * Pixel-sampled colored ASCII portrait renderer with studio-wall segmentation,
 * HiDPI crisp monospace rendering, entrance cipher reveal, and hover decode ripple.
 */
export function AsciiPortraitCanvas({
  src,
  alt,
  logicalSize = 560,
  cols = 160,
  rows = 132,
  bgColor = "#010101",
  accentColors = DEFAULT_ACCENTS,
  className = "",
  style,
}: AsciiPortraitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, lastMoveTs: 0 });
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

    const cellW = logicalSize / cols;
    const cellH = logicalSize / rows;
    const fontPx = Number((cellH * 1.16).toFixed(2));
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;

    let animStart = 0;
    const revealDurationMs = 900;
    const hoverRadius = logicalSize * 0.075;
    const hoverDecayMs = 650;

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

      bCtx.font = `600 ${fontPx}px ${resolvedFont}`;
      bCtx.textAlign = "center";
      bCtx.textBaseline = "middle";

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        bCtx.fillStyle = cell.color;
        bCtx.fillText(cell.glyph, cell.cx, cell.cy);
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
      if (reducedMotion) {
        drawSettled();
        rafId = 0;
        return;
      }

      if (animStart === 0) animStart = now;
      const elapsed = now - animStart;
      const revealProgress = clamp01(elapsed / revealDurationMs);

      const ptr = pointerRef.current;
      const timeSinceMove = now - ptr.lastMoveTs;
      const hoverActive = ptr.lastMoveTs > 0 && timeSinceMove < hoverDecayMs;
      const hoverStrength = hoverActive ? clamp01(1 - timeSinceMove / hoverDecayMs) : 0;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `600 ${fontPx}px ${resolvedFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tickBucket = Math.floor(now / 52);

      // Fast path after entrance reveal: copy settled GPU buffer and redraw only cells inside pointer ripple.
      if (revealProgress >= 1 && settledBuffer) {
        ctx.clearRect(0, 0, logicalSize, logicalSize);
        ctx.drawImage(settledBuffer, 0, 0, logicalSize, logicalSize);

        if (hoverStrength > 0.02) {
          const effectiveRadius = hoverRadius * (0.45 + 0.55 * hoverStrength);
          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const dist = Math.hypot(cell.cx - ptr.x, cell.cy - ptr.y);
            if (dist >= effectiveRadius) continue;

            const pHash = ((cell.gx * 53 + cell.gy * 127 + tickBucket * 17) >>> 0);
            if ((pHash % 100) / 100 < hoverStrength * (1 - dist / effectiveRadius) * 0.9) {
              if (bgColor === "transparent") {
                ctx.clearRect(cell.cx - cellW * 0.5, cell.cy - cellH * 0.5, cellW, cellH);
              } else {
                ctx.fillStyle = bgColor;
                ctx.fillRect(cell.cx - cellW * 0.5, cell.cy - cellH * 0.5, cellW, cellH);
              }
              const scrambleChar = CIPHER_GLYPHS[pHash % CIPHER_GLYPHS.length];
              ctx.fillStyle = pHash % 3 === 0 ? accentColors[0] : cell.color;
              ctx.fillText(scrambleChar, cell.cx, cell.cy);
            }
          }
        }
      } else {
        if (bgColor === "transparent") {
          ctx.clearRect(0, 0, logicalSize, logicalSize);
        } else {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, logicalSize, logicalSize);
        }

        for (let i = 0; i < cells.length; i++) {
          const cell = cells[i];
          const gate = cell.revealOrder * 0.72;
          if (revealProgress < gate) continue;

          const localProgress = clamp01((revealProgress - gate) / 0.28);
          if (localProgress < 0.82) {
            const cHash = ((cell.gx * 97 + cell.gy * 193 + tickBucket * 31) >>> 0);
            const scrambleChar = CIPHER_GLYPHS[cHash % CIPHER_GLYPHS.length];
            ctx.fillStyle = accentColors[cHash % accentColors.length];
            ctx.fillText(scrambleChar, cell.cx, cell.cy);
          } else {
            ctx.fillStyle = cell.color;
            ctx.fillText(cell.glyph, cell.cx, cell.cy);
          }
        }
      }

      if ((revealProgress < 1 || hoverActive) && isVisibleRef.current) {
        rafId = requestAnimationFrame(drawAnimatedFrame);
      } else {
        rafId = 0;
        if (revealProgress >= 1 && !hoverActive) {
          drawSettled();
        }
      }
    };

    const startOrWakeLoop = () => {
      if (cancelled || cells.length === 0) return;
      if (reducedMotion) {
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

    const handlePointerWake = () => {
      if (!reducedMotion && cells.length > 0 && !rafId && isVisibleRef.current) {
        rafId = requestAnimationFrame(drawAnimatedFrame);
      }
    };
    canvas.addEventListener("pointermove", handlePointerWake, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      observer.disconnect();
      canvas.removeEventListener("pointermove", handlePointerWake);
      if (typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", handleMotionChange);
      }
    };
  }, [src, logicalSize, cols, rows, bgColor, accentColors]);

  const updatePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== "mouse") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * logicalSize;
    pointerRef.current.y = ((e.clientY - rect.top) / rect.height) * logicalSize;
    pointerRef.current.lastMoveTs = performance.now();
  };

  if (status === "error") {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={className}
      onPointerMove={updatePointer}
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
