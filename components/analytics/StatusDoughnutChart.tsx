"use client";

import { memo, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import AnimatedNumber from "./AnimatedNumber";
import { chartTooltipStyle, STATUS_COLORS } from "./chartTheme";

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
  const data: StatusSlice[] = useMemo(
    () => [
      { key: "ok", name: "தீர்க்கப்பட்டது", value: ok, color: STATUS_COLORS.ok },
      { key: "warn", name: "நடவடிக்கையில்", value: warn, color: STATUS_COLORS.warn },
      { key: "pend", name: "பதிவில்", value: pend, color: STATUS_COLORS.pend },
    ],
    [ok, pend, warn]
  );

  const filtered = data.filter((d) => d.value > 0);
  const total = ok + warn + pend;

  if (total === 0) {
    return (
      <p className="analytics-chart-empty" role="status">
        நிலை தரவு இல்லை
      </p>
    );
  }

  return (
    <div
      className="analytics-donut-layout analytics-chart-reveal"
      role="img"
      aria-label="தீர்வு நிலை doughnut chart"
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
          <span>தீர்வு விகிதம்</span>
        </div>
      </div>
      <ul className="analytics-donut-legend" aria-label="நிலை விளக்கம்">
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
