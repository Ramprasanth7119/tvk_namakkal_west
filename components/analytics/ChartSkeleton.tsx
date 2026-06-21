"use client";

type ChartSkeletonVariant = "kpi" | "bar" | "donut" | "area" | "radial" | "table";

interface ChartSkeletonProps {
  variant?: ChartSkeletonVariant;
  count?: number;
  label?: string;
}

export function KpiSkeletonGrid({ count = 5 }: { count?: number }) {
  return (
    <div className="kpi-grid analytics-skeleton-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="kpi analytics-skeleton-kpi">
          <div className="analytics-shimmer analytics-skeleton-icon" />
          <div className="analytics-shimmer analytics-skeleton-value" />
          <div className="analytics-shimmer analytics-skeleton-label" />
        </div>
      ))}
    </div>
  );
}

export default function ChartSkeleton({
  variant = "bar",
  count = 1,
  label = "வரைபடம் ஏற்றப்படுகிறது",
}: ChartSkeletonProps) {
  if (variant === "kpi") {
    return <KpiSkeletonGrid count={count} />;
  }

  return (
    <div
      className={`analytics-chart-skeleton analytics-chart-skeleton--${variant}`}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <div className="analytics-shimmer analytics-chart-skeleton-inner" />
    </div>
  );
}
