"use client";

import { useEffect } from "react";
import { WHISTLE_CURSOR_GOLD, WHISTLE_CURSOR_MAROON } from "@/lib/whistleCursorAssets";
import { useLanguage } from "@/components/LanguageProvider";

type WhistleCursorOptions = {
  theme?: "maroon" | "gold";
  enabled?: boolean;
};

export function useWhistleCursor(options: WhistleCursorOptions = {}) {
  const { theme = "maroon", enabled = true } = options;
  const { t } = useLanguage();

  useEffect(() => {
    if (!enabled) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePtr = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    let cursorOn = finePtr && !reduced;

    if (!cursorOn) return;

    document.body.dataset.ctheme = theme;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx;
    let cy = my;
    let pvx = 0;
    let rafId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const handleMouseOver = (e: MouseEvent) => {
      if (document.body.classList.contains("topbar-menu-open") || document.body.classList.contains("nav-menu-open")) {
        document.body.classList.remove("chover");
        return;
      }
      if ((e.target as HTMLElement).closest(".nav, .topbar, .wcur")) {
        document.body.classList.remove("chover");
        return;
      }
      const hoverSel =
        "a,button,input,select,textarea,.fchip,.uchip,.hot,.spot,.kpi,.insight-card,.const-stat-card,.timeline-item,.tfilt,td,tr,.card";
      const hoverEl = (e.target as HTMLElement).closest(hoverSel) as HTMLElement | null;
      document.body.classList.toggle("chover", !!hoverEl);
      const clabel = document.getElementById("clabel");
      if (hoverEl && clabel) {
        clabel.textContent =
          hoverEl.dataset.clabel ||
          hoverEl.closest("[data-clabel]")?.getAttribute("data-clabel") ||
          t("cursor.touch");
      }
    };

    const handleTouchStart = () => {
      cursorOn = false;
      document.body.classList.remove("cursor-on", "chover");
      cancelAnimationFrame(rafId);
    };

    document.body.classList.add("cursor-on");
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { once: true, passive: true });

    const clampVal = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const loop = () => {
      const wcur = document.getElementById("wcur");
      if (cursorOn && wcur) {
        const ox = cx;
        cx += (mx - cx) * 0.18;
        cy += (my - cy) * 0.18;
        pvx = pvx * 0.85 + (cx - ox) * 0.15;
        wcur.style.transform =
          "translate(" + cx + "px," + cy + "px) rotate(" + clampVal(pvx * 2.4, -22, 22) + "deg)";
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove("cursor-on", "chover");
      delete document.body.dataset.ctheme;
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(rafId);
    };
  }, [theme, enabled, t]);
}

export default function WhistleCursor() {
  const { t } = useLanguage();

  return (
    <div className="wcur" id="wcur" aria-hidden="true">
      <img className="wg" src={WHISTLE_CURSOR_GOLD} alt="" />
      <img className="wm" src={WHISTLE_CURSOR_MAROON} alt="" />
      <span className="waves">
        <span />
        <span />
        <span />
      </span>
      <span className="clabel" id="clabel">
        {t("cursor.touch")}
      </span>
    </div>
  );
}
