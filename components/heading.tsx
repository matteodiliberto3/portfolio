import type { ReactNode } from "react";
import { Reveal } from "./reveal";

type HeadingProps = {
  /** e.g. "01" */
  number: string;
  /** e.g. "Chi sono" */
  label: string;
  /** Plain sentence. Each word rises out of its own mask. */
  children: string;
  id: string;
  className?: string;
  accentFrom?: number;
  /** Index of the word that gets the ink stroke drawn under it. */
  inkAt?: number;
  /** Hide the "( 0n ) — label" line above the sentence. */
  hideEyebrow?: boolean;
};

/**
 * Chapter heading: eyebrow first (number + label + rule), then words rising
 * one after another out of a clipped line. All driven by the same reveal-once
 * observer used everywhere else, so it stays interruptible and scroll-bound.
 */
export function Heading({
  number,
  label,
  children,
  id,
  className,
  accentFrom,
  inkAt,
  hideEyebrow,
}: HeadingProps) {
  const words = children.split(" ");
  let cursor = 0;

  const lines: ReactNode[] = [];
  const wordsByLine = splitLines(words);

  wordsByLine.forEach((lineWords, lineIndex) => {
    lines.push(
      <span className="h-line" key={lineIndex}>
        {lineWords.map((word) => {
          const index = cursor++;
          const accent = accentFrom !== undefined && index >= accentFrom;
          const mask = (
            <span className="h-word-mask" key={index}>
              <span
                className="h-word"
                data-accent={accent ? "true" : undefined}
                style={{ ["--w" as string]: index }}
              >
                {word}
              </span>
            </span>
          );

          if (index !== inkAt) return mask;

          /* The mask clips its own overflow, so the splat lives beside it. */
          return (
            <span className="h-word-slot" key={index} style={{ ["--w" as string]: index }}>
              {mask}
              <InkSplat />
            </span>
          );
        })}
      </span>,
    );
  });

  return (
    <Reveal as="div" className={`heading ${className ?? ""}`}>
      {hideEyebrow ? null : (
        <p className="eyebrow h-eyebrow" aria-hidden>
          <span className="h-num">( {number} )</span>
          <span className="h-rule" />
          <span className="h-label">{label}</span>
        </p>
      )}
      <h2 id={id} className="act-heading h-text">
        <span className="sr-only">
          {label}. {children}
        </span>
        <span aria-hidden>{lines}</span>
      </h2>
    </Reveal>
  );
}

/** Teardrops still attached to the mass: the direction of the flick. */
const TAILS = [
  "M61.1 38.6Q74.3 28.6 82.9 17.2Q69.1 20.9 54.9 29.4A5.5 5.5 0 0 1 61.1 38.6Z",
  "M63.4 62.5Q76.5 63.6 87.8 61.3Q77.6 56.1 64.6 53.5A4.5 4.5 0 0 1 63.4 62.5Z",
  "M52.7 75.0Q61.7 81.3 70.8 84.3Q65.6 76.3 57.3 69.0A3.8 3.8 0 0 1 52.7 75.0Z",
];

/** Blobs torn off the main mass, in the order they land. */
const BLOTS = [
  "M91.0 28.0C91.2 30.2 89.2 33.3 87.5 35.1C85.8 36.9 83.6 37.7 80.9 38.8C78.2 39.8 73.1 42.7 71.2 41.5C69.4 40.3 69.7 34.1 69.8 31.4C69.8 28.7 70.8 27.2 71.5 25.3C72.3 23.4 72.7 21.1 74.3 19.8C75.8 18.4 78.9 16.8 80.9 17.1C82.9 17.5 84.5 20.2 86.2 22.0C87.8 23.8 90.8 25.8 91.0 28.0Z",
  "M80.3 74.0C80.5 75.5 79.9 77.9 78.9 79.0C77.9 80.1 75.7 80.5 74.2 80.6C72.6 80.7 71.4 80.3 69.7 79.7C68.1 79.1 64.7 78.5 64.2 77.2C63.7 75.9 65.9 73.5 66.7 71.7C67.4 69.9 67.4 67.4 68.7 66.6C70.0 65.7 72.8 66.0 74.3 66.6C75.8 67.2 76.5 69.0 77.5 70.2C78.5 71.5 80.0 72.5 80.3 74.0Z",
  "M104.2 51.0C104.3 52.1 103.5 53.6 102.7 54.7C101.8 55.7 100.4 57.3 99.0 57.5C97.6 57.7 94.9 56.9 94.2 55.8C93.4 54.8 94.3 52.3 94.6 51.0C94.9 49.7 95.3 49.1 96.0 48.0C96.7 46.9 98.0 44.5 99.0 44.5C100.0 44.4 101.3 46.8 102.1 47.9C103.0 49.0 104.1 49.9 104.2 51.0Z",
];

/** Fine spray: the last thing to arrive, and the furthest out. */
const DROPS = [
  { cx: 97, cy: 34, r: 2.4, fx: -14, fy: 8 },
  { cx: 88, cy: 88, r: 2, fx: -11, fy: -12 },
  { cx: 112, cy: 67, r: 1.7, fx: -17, fy: -8 },
  { cx: 108, cy: 22, r: 1.4, fx: -18, fy: 12 },
  { cx: 117, cy: 40, r: 1.1, fx: -20, fy: 5 },
  { cx: 100, cy: 72, r: 1.3, fx: -14, fy: -9 },
];

/**
 * Brush splat flicked off the end of the word: the mass lands first, then
 * the blots it tore off, then the spray, each one further to the right.
 */
function InkSplat() {
  return (
    <svg className="h-ink" viewBox="0 0 120 100" aria-hidden focusable="false">
      <path
        className="h-ink-mass"
        d="M69.3 52.0C68.9 55.6 60.7 57.8 59.3 62.3C57.8 66.9 63.3 76.7 60.5 79.1C57.7 81.4 47.5 76.9 42.6 76.4C37.7 75.8 35.0 76.0 31.3 75.6C27.6 75.1 23.5 75.3 20.4 73.7C17.2 72.2 14.3 69.2 12.6 66.3C10.9 63.5 11.5 60.0 10.2 56.6C9.0 53.3 4.6 49.4 5.1 46.3C5.6 43.3 10.8 40.6 13.5 38.3C16.3 36.0 18.8 34.7 21.7 32.3C24.6 30.0 27.2 25.7 30.8 24.3C34.5 23.0 39.3 23.8 43.7 24.5C48.1 25.1 54.2 25.6 57.2 28.3C60.2 31.0 59.5 36.8 61.5 40.7C63.5 44.7 69.7 48.4 69.3 52.0Z"
      />
      {TAILS.map((d, i) => (
        <path className="h-ink-tail" key={d.slice(0, 12)} d={d} style={{ ["--d" as string]: i }} />
      ))}
      {BLOTS.map((d, i) => (
        <path className="h-ink-blot" key={d.slice(0, 12)} d={d} style={{ ["--d" as string]: i }} />
      ))}
      {DROPS.map((d, i) => (
        <circle
          className="h-ink-drop"
          key={d.cx}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          style={{ ["--d" as string]: i, ["--fx" as string]: `${d.fx}px`, ["--fy" as string]: `${d.fy}px` }}
        />
      ))}
    </svg>
  );
}

/** Breaks on an explicit "/" token so line breaks are authored, not guessed. */
function splitLines(words: string[]) {
  const lines: string[][] = [[]];
  for (const w of words) {
    if (w === "/") {
      lines.push([]);
      continue;
    }
    lines[lines.length - 1].push(w);
  }
  return lines;
}
