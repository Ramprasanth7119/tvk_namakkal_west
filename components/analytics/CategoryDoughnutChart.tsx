"use client";

import { memo, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import AnimatedNumber from "./AnimatedNumber";
import { chartTooltipStyle, SECTOR_COLORS, TVK } from "./chartTheme";

export interface CategoryChartSlice {
  key: string;
  name: string;
  value: number;
  resolved: number;
  color: string;
}

interface CategoryDoughnutChartProps {
  data: CategoryChartSlice[];
  areaLabel?: string;
}

function CategoryDoughnutChart({ data, areaLabel }: CategoryDoughnutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const filtered = useMemo(() => data.filter((d) => d.value > 0), [data]);
  const total = useMemo(() => filtered.reduce((s, d) => s + d.value, 0), [filtered]);

  if (total === 0) {
    return (
      <p className="analytics-chart-empty" role="status">
        துறை வாரியான புகார்கள் இல்லை
      </p>
    );
  }

  const active = activeIndex !== undefined ? filtered[activeIndex] : null;

  return (
    <div
      className="analytics-donut-layout analytics-chart-reveal"
      role="img"
      aria-label="துறை வாரியான புகார் doughnut chart"
    >
      <div className="analytics-donut-chart">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={filtered}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={98}
              paddingAngle={2}
              animationDuration={900}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
            >
              {filtered.map((entry) => (
                <Cell key={entry.key} fill={entry.color || SECTOR_COLORS[entry.key] || TVK.red} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const row = payload[0].payload as CategoryChartSlice;
                const pct = total ? Math.round((row.value / total) * 100) : 0;
                return (
                  <div style={chartTooltipStyle as React.CSSProperties}>
                    <strong>{row.name}</strong>
                    <div>
                      மொத்தம்: {row.value} ({pct}%)
                    </div>
                    <div>தீர்க்கப்பட்டது: {row.resolved}</div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="analytics-donut-center">
          {active ? (
            <>
              <b>{Math.round((active.value / total) * 100)}%</b>
              <span>{active.name}</span>
            </>
          ) : (
            <>
              <b>
                <AnimatedNumber value={total} />
              </b>
              <span>மொத்த புகார்கள்</span>
            </>
          )}
        </div>
      </div>
      <ul className="analytics-donut-legend" aria-label="துறை விளக்கம்">
        {filtered.map((item) => {
          const pct = Math.round((item.value / total) * 100);
          return (
            <li key={item.key}>
              <i style={{ background: item.color }} aria-hidden="true" />
              <span className="lname">{item.name}</span>
              <span className="lval">
                {item.value} · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
      {areaLabel && <p className="analytics-chart-subtag">{areaLabel}</p>}
    </div>
  );
}

export default memo(CategoryDoughnutChart);
