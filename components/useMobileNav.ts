"use client";

import { useCallback, useEffect, type Dispatch, type SetStateAction } from "react";

export function useMobileNav(
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>,
  bodyClass = "nav-menu-open",
  desktopBreakpoint = 992
) {
  const close = useCallback(() => setOpen(false), [setOpen]);
  const toggle = useCallback(() => setOpen((prev) => !prev), [setOpen]);

  useEffect(() => {
    document.body.classList.toggle(bodyClass, open);
    return () => document.body.classList.remove(bodyClass);
  }, [open, bodyClass]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > desktopBreakpoint) close();
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [close, desktopBreakpoint]);

  return { close, toggle };
}
