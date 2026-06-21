/** TVK-West palette for Recharts — matches analytics.css tokens */

export const TVK = {
  red: "#A00000",
  redSoft: "rgba(160,0,0,0.12)",
  gold: "#FECB02",
  ok: "#3F8F4A",
  warn: "#D08A00",
  pend: "#9A5B12",
  ink: "#2A1108",
  inkSoft: "#6B4F3C",
  cream: "#FAF1DC",
  line: "rgba(160,0,0,0.16)",
  grid: "rgba(160,0,0,0.08)",
} as const;

export const SECTOR_COLORS: Record<string, string> = {
  road: "#A00000",
  water: "#1F7A8C",
  power: "#E08600",
  light: "#C7A008",
  drain: "#5E8C3A",
  health: "#B5322B",
  edu: "#7A5BA6",
  civic: "#9A5B12",
};

export const STATUS_COLORS = {
  ok: TVK.ok,
  warn: TVK.warn,
  pend: TVK.pend,
} as const;

export const chartTooltipStyle = {
  background: "rgba(255,255,255,0.96)",
  border: `1px solid ${TVK.line}`,
  borderRadius: "12px",
  boxShadow: "0 12px 32px -12px rgba(74,8,14,0.25)",
  fontFamily: "'Hind Madurai', sans-serif",
  fontSize: "13px",
  color: TVK.ink,
};

export const chartAxisStyle = {
  fontSize: 12,
  fill: TVK.inkSoft,
  fontFamily: "'Hind Madurai', sans-serif",
};
