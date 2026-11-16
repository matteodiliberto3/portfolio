import type { CSSProperties } from "react";

export function ArrowIcon({
  direction = "right",
  variant = "mono",
  className,
  style,
}: {
  direction?: "left" | "right";
  variant?: "display" | "mono" | "icon";
  className?: string;
  style?: CSSProperties;
}) {
  const dims =
    variant === "display"
      ? { width: "0.78em", height: "0.52em", transform: "translateY(-0.05em)" }
      : variant === "icon"
        ? { width: "16px", height: "11px", transform: "none" }
        : { width: "1.18em", height: "0.78em", transform: "translateY(-0.03em)" };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 12"
      fill="none"
      className={className}
      style={{
        display: "block",
        flexShrink: 0,
        ...dims,
        ...style,
      }}
    >
      {direction === "right" ? (
        <path
          d="M1 6H16.2M11.6 1.4L16.2 6L11.6 10.6"
          stroke="currentColor"
          strokeWidth={1.55}
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      ) : (
        <path
          d="M17 6H1.8M6.4 1.4L1.8 6L6.4 10.6"
          stroke="currentColor"
          strokeWidth={1.55}
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      )}
    </svg>
  );
}
