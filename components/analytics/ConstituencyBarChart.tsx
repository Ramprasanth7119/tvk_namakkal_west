"use client";

import { memo, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartAxisStyle, chartTooltipStyle, TVK } from "./chartTheme";
import { useLanguage } from "@/components/LanguageProvider";

export interface ConstituencyChartRow {
  name: string;
  shortName: string;
  total: number;
  ok: number;
  warn: number;
  pend: number;
  rate: number;
}

interface ConstituencyBarChartProps {
  data: ConstituencyChartRow[];
  loading?: boolean;
}

function shortenName(name: string): string {
  if (name.length <= 10) return name;
  return name.replace(" ", "\n");
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="analytics-chart-tooltip" style={chartTooltipStyle as React.CSSProperties}>
      <strong>{label}</strong>
      <ul>
        {payload.map((entry) => (
          <li key={entry.name} style={{ color: entry.color }}>
            {entry.name}: <b>{entry.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
};

function ConstituencyBarChart({ data, loading }: ConstituencyBarChartProps) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const { t } = useLanguage();

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        shortName: shortenName(d.name),
      })),
    [data]
  );

  const hasData = chartData.some((d) => d.total > 0);

  if (!loading && !hasData) {
    return (
      <p className="analytics-chart-empty" role="status">
        {t("chart.constituency_empty")}
      </p>
    );
  }

  const toggleSeries = (key: string) => {
    setHidden((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className="analytics-chart-host analytics-chart-reveal"
      role="img"
      aria-label={t("chart.constituency_aria")}
    >
      <div className="analytics-chart-scroll">
        <ResponsiveContainer width="100%" height={320} minWidth={280}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
            barCategoryGap="18%"
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={TVK.grid} vertical={false} />
            <XAxis
              dataKey="shortName"
              tick={chartAxisStyle}
              interval={0}
              height={56}
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
            <Tooltip content={<CustomTooltip />} cursor={{ fill: TVK.redSoft }} />
            <Legend
              wrapperStyle={{ fontFamily: chartAxisStyle.fontFamily, fontSize: 12, paddingTop: 8 }}
              onClick={(e) => toggleSeries(String(e.dataKey))}
              formatter={(value) => (
                <span style={{ opacity: hidden[String(value)] ? 0.4 : 1 }}>{value}</span>
              )}
            />
            {!hidden.total && (
              <Bar
                dataKey="total"
                name={t("chart.total")}
                fill={TVK.red}
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                label={{ position: "top", fontSize: 11, fill: TVK.inkSoft }}
              />
            )}
            {!hidden.ok && (
              <Bar
                dataKey="ok"
                name={t("status.ok")}
                fill={TVK.ok}
                radius={[6, 6, 0, 0]}
                animationDuration={900}
              />
            )}
            {!hidden.warn && (
              <Bar
                dataKey="warn"
                name={t("analytics.in_progress")}
                fill={TVK.warn}
                radius={[6, 6, 0, 0]}
                animationDuration={1000}
              />
            )}
            {!hidden.pend && (
              <Bar
                dataKey="pend"
                name={t("analytics.registered")}
                fill={TVK.pend}
                radius={[6, 6, 0, 0]}
                animationDuration={1100}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default memo(ConstituencyBarChart);
