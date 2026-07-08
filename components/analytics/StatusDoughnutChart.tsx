"use client";

import { memo, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import AnimatedNumber from "./AnimatedNumber";
import { chartTooltipStyle, STATUS_COLORS } from "./chartTheme";
import { useLanguage } from "@/components/LanguageProvider";

interface StatusSlice {
  key: string;
  name: string;
  value: number;
  color: string;
}

interface StatusDoughnutChartProps {
  ok: number;
  warn: number;
  pend: number;
  rate: number;
}

function StatusDoughnutChart({ ok, warn, pend, rate }: StatusDoughnutChartProps) {
  const { t } = useLanguage();

  const data: StatusSlice[] = useMemo(
    () => [
      { key: "ok", name: t("status.ok"), value: ok, color: STATUS_COLORS.ok },
      { key: "warn", name: t("analytics.in_progress"), value: warn, color: STATUS_COLORS.warn },
      { key: "pend", name: t("analytics.registered"), value: pend, color: STATUS_COLORS.pend },
    ],
    [ok, pend, warn, t]
  );

  const filtered = data.filter((d) => d.value > 0);
  const total = ok + warn + pend;

  if (total === 0) {
    return (
      <p className="analytics-chart-empty" role="status">
        {t("chart.status_empty")}
      </p>
    );
  }

  return (
    <div
      className="analytics-donut-layout analytics-chart-reveal"
      role="img"
      aria-label={t("chart.status_aria")}
    >
      <div className="analytics-donut-chart">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={filtered.length ? filtered : data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={98}
              paddingAngle={2}
              animationDuration={900}
            >
              {(filtered.length ? filtered : data).map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const row = payload[0].payload as StatusSlice;
                const pct = total ? Math.round((row.value / total) * 100) : 0;
                return (
                  <div style={chartTooltipStyle as React.CSSProperties}>
                    <strong>{row.name}</strong>
                    <div>
                      {row.value} ({pct}%)
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="analytics-donut-center">
          <b>
            <AnimatedNumber value={rate} suffix="%" />
          </b>
          <span>{t("analytics.resolution_rate")}</span>
        </div>
      </div>
      <ul className="analytics-donut-legend" aria-label={t("chart.status_legend_aria")}>
        {data.map((item) => (
          <li key={item.key}>
            <i style={{ background: item.color }} aria-hidden="true" />
            <span className="lname">{item.name}</span>
            <span className="lval">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default memo(StatusDoughnutChart);
