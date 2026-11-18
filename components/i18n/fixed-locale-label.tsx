"use client";

export function FixedLocaleLabel({
  values,
  active,
  align = "center",
  className,
  activeClassName,
}: {
  values: readonly string[];
  active: string;
  align?: "start" | "center" | "end";
  className?: string;
  activeClassName?: string;
}) {
  return (
    <span
      className={className ? `cyber-fixed-slot ${className}` : "cyber-fixed-slot"}
      data-align={align}
    >
      {values.map((val, idx) => (
        <span key={idx} className="cyber-fixed-sizer" aria-hidden="true">
          {val}
        </span>
      ))}
      <span
        className={
          activeClassName ? `cyber-fixed-active ${activeClassName}` : "cyber-fixed-active"
        }
      >
        {active}
      </span>
    </span>
  );
}
