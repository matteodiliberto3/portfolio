"use client";

import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

type RevealProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode;
  className?: string;
  /** ms, offsets this element inside its container's entrance */
  delay?: number;
  as?: "div" | "section" | "p" | "h2" | "h3" | "li" | "span" | "figure";
  style?: CSSProperties;
};

/** Enter line: the element must be ~15% up from the bottom edge. */
const ENTER_MARGIN = "0px 0px -15% 0px";
/** Leave line: only once it is fully out, 12% past either edge, so the reset is never seen. */
const LEAVE_MARGIN = "12% 0px 12% 0px";

function alreadyInView(node: HTMLElement) {
  const r = node.getBoundingClientRect();
  const vh = window.innerHeight;
  return r.bottom > 0 && r.top < vh * 0.85 && r.height > 0;
}

/**
 * Replaying reveal wrapper. Content is visible without JS. With JS, the
 * element gets `data-reveal`; `data-in` is added when it enters (either
 * direction) and removed once it has fully left, so the entrance plays
 * again on the way back. Elements already on screen at hydration are
 * marked in synchronously: no flash, and one-shot load intros keep running.
 */
export function Reveal({ children, className, delay = 0, as = "div", style, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (alreadyInView(node)) node.dataset.in = "";
    node.dataset.reveal = "";

    const enter = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) node.dataset.in = "";
        }
      },
      { rootMargin: ENTER_MARGIN, threshold: 0.05 },
    );

    const leave = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) delete node.dataset.in;
        }
      },
      { rootMargin: LEAVE_MARGIN, threshold: 0 },
    );

    enter.observe(node);
    leave.observe(node);
    return () => {
      enter.disconnect();
      leave.disconnect();
    };
  }, []);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
