"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const EDGE_ENTER_PX = 42;
const EDGE_EXIT_PX = 56;
const SCROLL_IDLE_MS = 900;
const EDGE_LEAVE_DELAY_MS = 140;
const TRACK_INSET_Y = 6;
const MIN_THUMB_PX = 44;

type VisibilityMode = "idle" | "scroll" | "edge" | "drag";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getDocumentHeight(): number {
  const doc = document.documentElement;
  const body = document.body;
  return Math.max(doc.scrollHeight, body ? body.scrollHeight : 0);
}

export function CustomScrollbar() {
  const pathname = usePathname();
  const railRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  const [scrollable, setScrollable] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isNearEdge, setIsNearEdge] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [accentColor, setAccentColor] = useState<string | null>(null);

  const scrollTimerRef = useRef<number | null>(null);
  const edgeLeaveTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const lastScrollYRef = useRef<number>(0);
  const ignoreScrollUntilRef = useRef<number>(0);
  const lastPointerXRef = useRef<number>(-1);
  const nearEdgeRef = useRef<boolean>(false);
  const draggingRef = useRef<boolean>(false);
  const grabOffsetRef = useRef<number>(0);
  const prevInlineScrollBehaviorRef = useRef<string>("");
  const metricsRef = useRef({
    maxScroll: 0,
    trackH: 0,
    thumbH: MIN_THUMB_PX,
    maxThumbY: 0,
    thumbY: 0,
  });

  const clearScrollTimer = useCallback(() => {
    if (scrollTimerRef.current !== null) {
      window.clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }
  }, []);

  const clearEdgeLeaveTimer = useCallback(() => {
    if (edgeLeaveTimerRef.current !== null) {
      window.clearTimeout(edgeLeaveTimerRef.current);
      edgeLeaveTimerRef.current = null;
    }
  }, []);

  const syncMetrics = useCallback(() => {
    const viewH = window.innerHeight;
    const docH = getDocumentHeight();
    const maxScroll = Math.max(0, docH - viewH);
    const nextScrollable = maxScroll > 2;

    setScrollable((prev) => (prev === nextScrollable ? prev : nextScrollable));

    const trackH = Math.max(0, viewH - TRACK_INSET_Y * 2);
    const thumbH = nextScrollable
      ? Math.min(trackH, Math.max(MIN_THUMB_PX, (viewH / docH) * trackH))
      : 0;
    const maxThumbY = Math.max(0, trackH - thumbH);
    const progress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
    const thumbY = progress * maxThumbY;

    metricsRef.current = {
      maxScroll,
      trackH,
      thumbH,
      maxThumbY,
      thumbY,
    };

    const thumbEl = thumbRef.current;
    if (thumbEl && nextScrollable) {
      thumbEl.style.height = `${thumbH.toFixed(2)}px`;
      thumbEl.style.transform = `translate3d(0, ${thumbY.toFixed(2)}px, 0)`;
    }

    const cards = document.querySelectorAll<HTMLElement>("[data-scroll-accent]");
    let nextAccent: string | null = null;
    if (cards.length > 0) {
      const thresholdY = viewH * 0.58;
      for (let i = cards.length - 1; i >= 0; i--) {
        const rect = cards[i].getBoundingClientRect();
        if (rect.top <= thresholdY && rect.bottom > 80) {
          nextAccent = cards[i].dataset.scrollAccent || null;
          break;
        }
      }
    }
    setAccentColor((prev) => (prev === nextAccent ? prev : nextAccent));
  }, []);

  const scheduleSync = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      syncMetrics();
    });
  }, [syncMetrics]);

  // Re-measure on route changes and clear stale scroll indicators.
  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    ignoreScrollUntilRef.current = performance.now() + 80;
    clearScrollTimer();
    const raf = window.requestAnimationFrame(() => {
      setIsScrolling(false);
      syncMetrics();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pathname, clearScrollTimer, syncMetrics]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    scheduleSync();

    const handleScroll = () => {
      const currentY = window.scrollY;
      const moved = Math.abs(currentY - lastScrollYRef.current) > 0.5;
      lastScrollYRef.current = currentY;
      scheduleSync();

      if (performance.now() < ignoreScrollUntilRef.current && !draggingRef.current) {
        return;
      }
      if (!moved && !draggingRef.current) return;

      setIsScrolling(true);
      clearScrollTimer();
      scrollTimerRef.current = window.setTimeout(() => {
        scrollTimerRef.current = null;
        setIsScrolling(false);
      }, SCROLL_IDLE_MS);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;

      lastPointerXRef.current = e.clientX;
      const distFromRight = window.innerWidth - e.clientX;

      if (draggingRef.current) {
        const rail = railRef.current;
        if (!rail) return;
        const railRect = rail.getBoundingClientRect();
        const { maxThumbY, maxScroll } = metricsRef.current;
        const targetThumbY = clamp(
          e.clientY - railRect.top - grabOffsetRef.current,
          0,
          maxThumbY,
        );
        const nextScrollY = maxThumbY > 0 ? (targetThumbY / maxThumbY) * maxScroll : 0;
        window.scrollTo({ top: nextScrollY, behavior: "instant" });
        scheduleSync();
        return;
      }

      const threshold = nearEdgeRef.current ? EDGE_EXIT_PX : EDGE_ENTER_PX;
      const insideZone = distFromRight >= 0 && distFromRight <= threshold;

      if (insideZone) {
        clearEdgeLeaveTimer();
        if (!nearEdgeRef.current) {
          nearEdgeRef.current = true;
          setIsNearEdge(true);
        }
      } else if (nearEdgeRef.current && edgeLeaveTimerRef.current === null) {
        edgeLeaveTimerRef.current = window.setTimeout(() => {
          edgeLeaveTimerRef.current = null;
          nearEdgeRef.current = false;
          setIsNearEdge(false);
        }, EDGE_LEAVE_DELAY_MS);
      }
    };

    const handlePointerLeaveWindow = () => {
      if (draggingRef.current) return;
      clearEdgeLeaveTimer();
      lastPointerXRef.current = -1;
      if (nearEdgeRef.current) {
        nearEdgeRef.current = false;
        setIsNearEdge(false);
      }
    };

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            scheduleSync();
          })
        : null;

    if (ro) {
      ro.observe(document.documentElement);
      if (document.body) ro.observe(document.body);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", scheduleSync, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handlePointerLeaveWindow);
    window.addEventListener("blur", handlePointerLeaveWindow);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      clearScrollTimer();
      clearEdgeLeaveTimer();
      ro?.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("mouseleave", handlePointerLeaveWindow);
      window.removeEventListener("blur", handlePointerLeaveWindow);
    };
  }, [clearEdgeLeaveTimer, clearScrollTimer, scheduleSync, syncMetrics]);

  const finishDrag = useCallback(
    (pointerId?: number, target?: HTMLDivElement | null) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);

      document.documentElement.style.scrollBehavior = prevInlineScrollBehaviorRef.current;

      if (target && pointerId !== undefined) {
        try {
          if (target.hasPointerCapture(pointerId)) {
            target.releasePointerCapture(pointerId);
          }
        } catch {
          // Ignore if capture was already released.
        }
      }

      const x = lastPointerXRef.current;
      const stillNear = x >= 0 && window.innerWidth - x <= EDGE_EXIT_PX;
      nearEdgeRef.current = stillNear;
      setIsNearEdge(stillNear);
    },
    [],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || e.pointerType === "touch" || !scrollable) return;
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!rail || !thumb) return;

    e.preventDefault();

    const railRect = rail.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const { thumbH, maxThumbY, maxScroll } = metricsRef.current;

    prevInlineScrollBehaviorRef.current = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    const clickedOnThumb =
      e.clientY >= thumbRect.top && e.clientY <= thumbRect.bottom;

    if (clickedOnThumb) {
      grabOffsetRef.current = e.clientY - thumbRect.top;
    } else {
      grabOffsetRef.current = thumbH * 0.5;
      const targetThumbY = clamp(
        e.clientY - railRect.top - grabOffsetRef.current,
        0,
        maxThumbY,
      );
      const nextScrollY = maxThumbY > 0 ? (targetThumbY / maxThumbY) * maxScroll : 0;
      window.scrollTo({ top: nextScrollY, behavior: "instant" });
      scheduleSync();
    }

    draggingRef.current = true;
    setIsDragging(true);
    clearEdgeLeaveTimer();
    nearEdgeRef.current = true;
    setIsNearEdge(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unavailable.
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    finishDrag(e.pointerId, e.currentTarget);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    finishDrag(e.pointerId, e.currentTarget);
  };

  const handleLostPointerCapture = () => {
    finishDrag();
  };

  const mode: VisibilityMode = isDragging
    ? "drag"
    : isNearEdge
      ? "edge"
      : isScrolling
        ? "scroll"
        : "idle";

  const visible = scrollable && mode !== "idle";
  const surface = pathname === "/note" ? "light" : "dark";

  return (
    <div
      aria-hidden="true"
      className="cyber-scrollbar"
      data-visible={visible ? "true" : "false"}
      data-mode={mode}
      data-surface={surface}
      data-accented={accentColor ? "true" : "false"}
      style={
        accentColor
          ? ({ ["--sb-accent" as string]: accentColor } as CSSProperties)
          : undefined
      }
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
    >
      <div ref={railRef} className="cyber-scrollbar-rail">
        <div ref={thumbRef} className="cyber-scrollbar-thumb" />
      </div>
    </div>
  );
}
