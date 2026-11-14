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

// Monospace optical density ramp curated for dark #010101 grounds (no spaces inside subject).
const ASCII_RAMP = ".:;-~=+*x#%8@$";
const CIPHER_GLYPHS = "01#<>*+=/:;[]_~";
const DEFAULT_ACCENTS = ["#3E3EE0", "#C50B3F", "#F4F3FA"] as const;

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
  const marginCols = Math.max(4, Math.min(8, Math.floor(segW * 0.04)));

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
  const win = 6;
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
 * Edge-seeded flood-fill background segmentation that respects bright facial highlights
 * using warmth chroma, edge step deltas, and local plaster interpolation, plus halo de-fringing.
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
    if (luma < 160 || luma < bgLuma - 36) return false;

    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const warmthDelta = r - b - (br - bb);
    if (chroma > 34 || warmthDelta > 17) return false;

    const dist = Math.hypot(r - br, g - bg, b - bb);
    if (dist > 34) return false;

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
  const bottomMargin = Math.floor(segW * 0.08);
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

  // Feather perimeter 1px transitions and suppress cream wall halo on dark hair/suit edges.
  for (let y = 1; y < segH - 1; y++) {
    const ny = y / (segH - 1);
    const bottomFade = 1 - smoothstep(0.9, 1.0, ny);

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

      if (bgNeighbors > 0) {
        const p4 = idx * 4;
        const r = data[p4];
        const g = data[p4 + 1];
        const b = data[p4 + 2];
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;

        // If edge pixel carries bright neutral studio-wall spill, pull color toward deep interior neighbors.
        if (chroma < 24 && luma > 105) {
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
              if (nluma < 115) {
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

        alphaMask[idx] = Math.max(0.28, 1 - bgNeighbors * 0.22) * bottomFade;
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
  const segW = 216;
  const segH = 216;

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
    for (let gx = 0; gx < cols; gx++) {
      const idx = gy * cols + gx;
      const alpha = gridA[idx];
      if (alpha < 0.16) continue;

      const lum = gridLum[idx];

      // 3x3 neighborhood luminance average + Sobel gradient for edge contour precision.
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
      const sharpLum = clamp01(lum + detail * 0.88);

      const lAt = (ox: number, oy: number) => {
        const xx = Math.min(cols - 1, Math.max(0, gx + ox));
        const yy = Math.min(rows - 1, Math.max(0, gy + oy));
        const ni = yy * cols + xx;
        return gridA[ni] > 0.16 ? gridLum[ni] : 0;
      };
      const sobelX =
        -lAt(-1, -1) - 2 * lAt(-1, 0) - lAt(-1, 1) + lAt(1, -1) + 2 * lAt(1, 0) + lAt(1, 1);
      const sobelY =
        -lAt(-1, -1) - 2 * lAt(0, -1) - lAt(1, -1) + lAt(-1, 1) + 2 * lAt(0, 1) + lAt(1, 1);
      const grad = Math.hypot(sobelX, sobelY);

      // Keep pupils, eyebrows, mouth crease, and finger crevices crisp while lifting dark matte suit weave off #010101.
      const isFineDarkCrease = detail < -0.04;
      const suitLift = isFineDarkCrease ? 0.02 : Math.pow(Math.max(0, 1 - lum), 1.65) * 0.14;

      const rawR = gridR[idx];
      const rawG = gridG[idx];
      const rawB = gridB[idx];
      const mean = (rawR + rawG + rawB) / 3;
      const satBoost = 1.1;
      const rBoosted = clampByte(mean + (rawR - mean) * satBoost + suitLift * 195);
      const gBoosted = clampByte(mean + (rawG - mean) * satBoost + suitLift * 205);
      const bBoosted = clampByte(mean + (rawB - mean) * satBoost + suitLift * 235);

      const tone = clamp01((sharpLum + suitLift * 0.9 - 0.03) / 0.92);
      const rampIdx = Math.min(
        ASCII_RAMP.length - 1,
        Math.max(0, Math.floor(Math.pow(tone, 0.94) * (ASCII_RAMP.length - 0.01)))
      );
      let glyph = ASCII_RAMP[rampIdx];

      // Use subtle directional strokes along strong garment lapels/collar/silhouette contours, preserving facial glyphs.
      if (grad > 0.36 && alpha > 0.65 && ny > 0.34) {
        const angle = Math.atan2(sobelY, sobelX);
        const deg = ((angle * 180) / Math.PI + 180) % 180;
        if (deg < 22 || deg > 158) {
          glyph = "|";
        } else if (deg >= 68 && deg <= 112) {
          glyph = "-";
        } else if (deg >= 22 && deg < 68) {
          glyph = "/";
        } else {
          glyph = "\\";
        }
      }

      const color =
        alpha >= 0.98
          ? `rgb(${rBoosted}, ${gBoosted}, ${bBoosted})`
          : `rgba(${rBoosted}, ${gBoosted}, ${bBoosted}, ${alpha.toFixed(2)})`;

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
  logicalSize = 540,
  cols = 108,
  rows = 86,
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
    let resolvedFont = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(logicalSize * dpr);
    canvas.height = Math.round(logicalSize * dpr);

    const fontPx = Number(((logicalSize / rows) * 1.18).toFixed(2));
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;

    let animStart = 0;
    const revealDurationMs = 950;
    const hoverRadius = logicalSize * 0.085;
    const hoverDecayMs = 680;

    const drawSettled = () => {
      if (cancelled || cells.length === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (bgColor === "transparent") {
        ctx.clearRect(0, 0, logicalSize, logicalSize);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, logicalSize, logicalSize);
      }

      ctx.font = `600 ${fontPx}px ${resolvedFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        ctx.fillStyle = cell.color;
        ctx.fillText(cell.glyph, cell.cx, cell.cy);
      }
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
      if (bgColor === "transparent") {
        ctx.clearRect(0, 0, logicalSize, logicalSize);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, logicalSize, logicalSize);
      }

      ctx.font = `600 ${fontPx}px ${resolvedFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const tickBucket = Math.floor(now / 52);

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];

        if (revealProgress < 1) {
          const gate = cell.revealOrder * 0.72;
          if (revealProgress < gate) continue;
          const localProgress = clamp01((revealProgress - gate) / 0.28);
          if (localProgress < 0.82) {
            const cHash = ((cell.gx * 97 + cell.gy * 193 + tickBucket * 31) >>> 0);
            const scrambleChar = CIPHER_GLYPHS[cHash % CIPHER_GLYPHS.length];
            ctx.fillStyle = accentColors[cHash % accentColors.length];
            ctx.fillText(scrambleChar, cell.cx, cell.cy);
            continue;
          }
        }

        if (hoverStrength > 0.02) {
          const dist = Math.hypot(cell.cx - ptr.x, cell.cy - ptr.y);
          const effectiveRadius = hoverRadius * (0.45 + 0.55 * hoverStrength);
          if (dist < effectiveRadius) {
            const pHash = ((cell.gx * 53 + cell.gy * 127 + tickBucket * 17) >>> 0);
            if ((pHash % 100) / 100 < hoverStrength * (1 - dist / effectiveRadius) * 0.92) {
              const scrambleChar = CIPHER_GLYPHS[pHash % CIPHER_GLYPHS.length];
              ctx.fillStyle = pHash % 3 === 0 ? accentColors[0] : cell.color;
              ctx.fillText(scrambleChar, cell.cx, cell.cy);
              continue;
            }
          }
        }

        ctx.fillStyle = cell.color;
        ctx.fillText(cell.glyph, cell.cx, cell.cy);
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
