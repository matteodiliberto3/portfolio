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

          /* The mask clips its own overflow, so the stroke lives beside it. */
          return (
            <span className="h-word-slot" key={index} style={{ ["--w" as string]: index }}>
              {mask}
              <InkStroke />
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

/**
 * Hand-drawn stroke that draws itself once the word it sits under has risen.
 * `pathLength="1"` lets the dash animation ignore the real path length.
 */
function InkStroke() {
  return (
    <svg className="h-ink" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden focusable="false">
      <path
        className="h-ink-line"
        pathLength="1"
        vectorEffect="non-scaling-stroke"
        d="M3 26C32 12 54 30 91 20c37-10 66 9 106-5"
      />
      <path
        className="h-ink-flick"
        pathLength="1"
        vectorEffect="non-scaling-stroke"
        d="M26 36c38-6 104 2 152-6"
      />
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
