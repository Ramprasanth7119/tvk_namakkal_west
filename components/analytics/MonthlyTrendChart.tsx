"use client";

import { memo, useMemo } from "react";
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartAxisStyle, chartTooltipStyle, TVK } from "./chartTheme";
import { useLanguage } from "@/components/LanguageProvider";

export interface TrendChartPoint {
  label: string;
  registered: number;
  resolved: number;
}

interface MonthlyTrendChartProps {
  data: TrendChartPoint[];
}

function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const hasData = useMemo(() => data.some((d) => d.registered > 0 || d.resolved > 0), [data]);
  const { t } = useLanguage();

  if (!hasData) {
    return (
      <p className="analytics-chart-empty" role="status">
        {t("chart.trend_empty")}
      </p>
    );
  }

  return (
    <div
      className="analytics-chart-host analytics-chart-reveal"
      role="img"
      aria-label={t("chart.trend_aria")}
    >
      <div className="analytics-trend-legend">
        <span>
          <i style={{ background: TVK.red }} aria-hidden="true" /> {t("analytics.registered")}
        </span>
        <span>
          <i style={{ background: TVK.ok }} aria-hidden="true" /> {t("analytics.resolved_items")}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="tvkAreaRegistered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TVK.red} stopOpacity={0.28} />
              <stop offset="100%" stopColor={TVK.red} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={TVK.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={chartAxisStyle}
            tickLine={false}
            axisLine={{ stroke: TVK.line }}
          />
          <YAxis
            tick={chartAxisStyle}
            allowDecimals={false}
            tickLine={false}
            axisLine={{ stroke: TVK.line }}
            width={36}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div style={chartTooltipStyle as React.CSSProperties}>
                  <strong>{label}</strong>
                  {payload.map((p) => (
                    <div key={String(p.name)} style={{ color: p.color }}>
                      {p.name}: <b>{p.value}</b>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: chartAxisStyle.fontFamily }} />
          <Area
            type="monotone"
            dataKey="registered"
            name={t("analytics.registered")}
            stroke={TVK.red}
            fill="url(#tvkAreaRegistered)"
            strokeWidth={2.5}
            animationDuration={1000}
            dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: TVK.red }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="resolved"
            name={t("analytics.resolved_items")}
            stroke={TVK.ok}
            strokeWidth={2.5}
            animationDuration={1100}
            dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: TVK.ok }}
            activeDot={{ r: 6 }}
          />
          {data.length > 4 && (
            <Brush
              dataKey="label"
              height={24}
              stroke={TVK.red}
              fill={TVK.cream}
              travellerWidth={10}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(MonthlyTrendChart);
