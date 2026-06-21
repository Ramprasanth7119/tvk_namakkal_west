"use client";

import { useCallback, useEffect, type Dispatch, type SetStateAction } from "react";

/**
 * Shared logic for the mobile nav drawer (TvkTopBar + TvkHomeNav).
 *
 * The drawer is shown by CSS below `desktopBreakpoint` (e.g. `@media (max-width: 992px)`).
 * The JS must agree with that exact breakpoint, otherwise the open/closed state desyncs
 * from the rendered layout on some devices. We therefore drive the "is desktop?" check
 * with `matchMedia` — the same engine the CSS media queries use — instead of comparing
 * `window.innerWidth` (which differs from the CSS width by the scrollbar, browser zoom,
 * and sub-pixel rounding, and is the usual cause of cross-device nav glitches).
 */
export function useMobileNav(
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
  bodyClass = "nav-menu-open",
  desktopBreakpoint = 992
) {
  const close = useCallback(() => setOpen(false), [setOpen]);
  const toggle = useCallback(() => setOpen((prev) => !prev), [setOpen]);

  // Lock background scroll while the drawer is open (CSS handles the actual `overflow`).
  useEffect(() => {
    document.body.classList.toggle(bodyClass, open);
    return () => document.body.classList.remove(bodyClass);
  }, [open, bodyClass]);

  // Close on Escape (only while open).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Auto-close the drawer the moment the layout reaches its desktop form.
  // `(min-width: <breakpoint + 1>px)` is the exact complement of the CSS
  // `(max-width: <breakpoint>px)` rule that reveals the drawer.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia(`(min-width: ${desktopBreakpoint + 1}px)`);
    const handleChange = (event: { matches: boolean }) => {
      if (event.matches) close();
    };

    // Sync immediately in case we mount already at desktop width.
    if (mql.matches) close();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    }
    // Legacy Safari (< 14) / older Android browsers.
    mql.addListener(handleChange);
    return () => mql.removeListener(handleChange);
  }, [close, desktopBreakpoint]);

  return { close, toggle };
}
