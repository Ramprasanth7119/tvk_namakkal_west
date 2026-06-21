"use client";

import type { ReactNode } from "react";
import AnimatedNumber from "./AnimatedNumber";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  accent?: string;
  accentBg?: string;
  icon: ReactNode;
  dataClabel?: string;
  loading?: boolean;
}

export default function KpiCard({
  label,
  value,
  suffix = "",
  accent = "var(--red)",
  accentBg = "rgba(160,0,0,.1)",
  icon,
  dataClabel,
  loading,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className="kpi analytics-skeleton-kpi" aria-hidden="true">
        <div className="analytics-shimmer analytics-skeleton-icon" />
        <div className="analytics-shimmer analytics-skeleton-value" />
        <div className="analytics-shimmer analytics-skeleton-label" />
      </div>
    );
  }

  return (
    <div
      className="kpi analytics-kpi-card"
      style={{ "--accent": accent, "--accent-bg": accentBg } as React.CSSProperties}
      data-clabel={dataClabel}
      tabIndex={0}
      role="group"
      aria-label={`${label}: ${value}${suffix}`}
    >
      <div className="kpi-ic">{icon}</div>
      <b>
        <AnimatedNumber value={value} suffix={suffix} />
      </b>
      <span>{label}</span>
      <span className="kpi-status-dot" aria-hidden="true" />
    </div>
  );
}
