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
          return (
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
