"use client";

/**
 * SmoothScroll — momentum wheel scrolling for desktop pointer devices.
 *
 * CSS `scroll-behavior: smooth` only smooths anchor jumps and programmatic
 * scrollTo — it does nothing for mouse-wheel input, so on a laptop the page
 * scrolls in steppy jumps while touch devices feel smooth (native momentum).
 * This adds a gentle rAF-eased wheel glide for fine-pointer devices.
 *
 * Deliberately conservative so it never feels worse than native:
 *  - only fine-pointer (mouse/trackpad) devices; touch keeps native momentum
 *  - only smooths discrete mouse-wheel notches; trackpad/precision deltas pass
 *    through so Mac/precision momentum isn't double-smoothed
 *  - yields to any nested scroll container that can still scroll, and to
 *    open modals (body.modal-open)
 *  - honours prefers-reduced-motion (does nothing)
 */

import { useEffect } from "react";

export default function SmoothScroll() {
  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduced) return;

    const EASE = 0.13; // lerp factor per frame → ~300ms glide
    let target = window.scrollY;
    let current = window.scrollY;
    let rafId: number | null = null;
    let animating = false;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const tick = () => {
      current += (target - current) * EASE;
      if (Math.abs(target - current) < 0.5) {
        current = target;
        window.scrollTo(0, current);
        rafId = null;
        animating = false;
        return;
      }
      window.scrollTo(0, current);
      rafId = requestAnimationFrame(tick);
    };

    // Walk up from the wheel target: if an inner scroll container can still
    // move in the wheel's direction, let the browser handle it natively.
    const innerCanScroll = (node: EventTarget | null, dir: number): boolean => {
      let el = node as HTMLElement | null;
      const root = document.documentElement;
      while (el && el !== document.body && el !== root) {
        if (el.scrollHeight > el.clientHeight) {
          const oy = getComputedStyle(el).overflowY;
          if (oy === "auto" || oy === "scroll") {
            const atTop = el.scrollTop <= 0;
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
            if (dir < 0 && !atTop) return true;
            if (dir > 0 && !atBottom) return true;
          }
        }
        el = el.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      // pinch-zoom or a modal owns scrolling → leave it alone
      if (e.ctrlKey || document.body.classList.contains("modal-open")) return;
      // precision/trackpad deltas (small, pixel mode) keep native momentum
      const isMouseWheel = e.deltaMode !== 0 || Math.abs(e.deltaY) >= 50;
      if (!isMouseWheel) {
        if (!animating) { target = current = window.scrollY; }
        return;
      }
      // a nested scrollable still has room → don't hijack it
      if (innerCanScroll(e.target, e.deltaY)) return;

      e.preventDefault();
      if (!animating) { current = window.scrollY; target = window.scrollY; }
      // deltaMode 1 = lines; approximate a line as 16px
      target += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      target = Math.max(0, Math.min(target, maxScroll()));
      animating = true;
      if (rafId === null) rafId = requestAnimationFrame(tick);
    };

    // When the page is scrolled by anything else (keyboard, scrollbar, anchor
    // jump, programmatic scrollTo), resync so the next wheel starts correctly.
    const onScroll = () => {
      if (!animating) { target = current = window.scrollY; }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
