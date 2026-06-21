/** Shared whistle cursor physics — single source for easing and transform updates. */

export const WHISTLE_BASE_EASING = 0.12;

export const WHISTLE_HOVER_SELECTORS =
  "a,button,input,select,textarea," +
  ".fchip,.uchip,.hot,.spot,.kpi,.insight-card,.const-stat-card,.timeline-item,.tfilt," +
  "td,tr,.card,.analytics-kpi-card,.analytics-chart-card,.analytics-performance-card," +
  ".complaint-card,.rep-card,.off-card,.news-card,.tb-back,.verify-btn,.submit-btn," +
  ".modal-close-btn,.admin-modal-cancel,.analytics-empty-retry";

export type WhistleCursorState = {
  mx: number;
  my: number;
  cx: number;
  cy: number;
  pvx: number;
};

export function createWhistleCursorState(): WhistleCursorState {
  const mx = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  const my = typeof window !== "undefined" ? window.innerHeight / 2 : 0;
  return { mx, my, cx: mx, cy: my, pvx: 0 };
}

export function isWhistleCursorSupported(): boolean {
  if (typeof window === "undefined") return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePtr = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  return finePtr && !reduced;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Slower follow + less tilt on narrow viewports. */
export function getWhistleEasing(): number {
  const w = window.innerWidth;
  if (w < 360) return WHISTLE_BASE_EASING * 0.55;
  if (w < 480) return WHISTLE_BASE_EASING * 0.7;
  if (w < 768) return WHISTLE_BASE_EASING * 0.85;
  return WHISTLE_BASE_EASING;
}

function getRotationFactor(): number {
  const w = window.innerWidth;
  if (w < 360) return 1.2;
  if (w < 480) return 1.5;
  if (w < 768) return 1.9;
  return 2.4;
}

/** Advance cursor position and apply GPU-friendly transform. Returns false when settled. */
export function tickWhistleCursor(
  wcur: HTMLElement,
  state: WhistleCursorState,
  cursorOn: boolean
): boolean {
  if (!cursorOn) return false;

  const easing = getWhistleEasing();
  const ox = state.cx;
  state.cx += (state.mx - state.cx) * easing;
  state.cy += (state.my - state.cy) * easing;
  state.pvx = state.pvx * 0.85 + (state.cx - ox) * 0.15;

  const rot = clamp(state.pvx * getRotationFactor(), -22, 22);
  wcur.style.transform = `translate3d(${state.cx}px,${state.cy}px,0) rotate(${rot}deg)`;

  const dx = Math.abs(state.mx - state.cx);
  const dy = Math.abs(state.my - state.cy);
  return dx > 0.4 || dy > 0.4 || Math.abs(state.pvx) > 0.05;
}

export function updateWhistleHoverLabel(target: EventTarget | null): void {
  const clabel = document.getElementById("clabel");
  if (!clabel) return;

  const t = (target as HTMLElement | null)?.closest(
    WHISTLE_HOVER_SELECTORS
  ) as HTMLElement | null;

  document.body.classList.toggle("chover", !!t);

  if (t) {
    clabel.textContent =
      t.dataset.clabel ||
      t.closest("[data-clabel]")?.getAttribute("data-clabel") ||
      "தொடு";
  }
}
