"use client";

import { memo } from "react";
import { Cell, PolarGrid, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip } from "recharts";
import AnimatedNumber from "./AnimatedNumber";
import { chartTooltipStyle, TVK } from "./chartTheme";

export interface RadialMetric {
  key: string;
  name: string;
  value: number;
  fill: string;
}

interface ResolutionRadialChartsProps {
  metrics: RadialMetric[];
}

function ResolutionRadialCharts({ metrics }: ResolutionRadialChartsProps) {
  const chartData = metrics.map((m) => ({
    ...m,
    full: 100,
  }));

  return (
    <div
      className="analytics-radial-grid analytics-chart-reveal"
      role="group"
      aria-label="தீர்வு செயல்திறன் radial charts"
    >
      {metrics.map((metric) => (
        <div key={metric.key} className="analytics-radial-card">
          <div className="analytics-radial-chart">
            <ResponsiveContainer width="100%" height={140}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="68%"
                outerRadius="100%"
                barSize={12}
                data={[chartData.find((d) => d.key === metric.key)!]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarGrid gridType="circle" radialLines={false} stroke="none" />
                <RadialBar
                  background={{ fill: "rgba(160,0,0,0.08)" }}
                  dataKey="value"
                  cornerRadius={8}
                  animationDuration={1000}
                >
                  <Cell fill={metric.fill} />
                </RadialBar>
                <Tooltip
                  content={() => (
                    <div style={chartTooltipStyle as React.CSSProperties}>
                      <strong>{metric.name}</strong>
                      <div>{metric.value}%</div>
                    </div>
                  )}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="analytics-radial-value">
              <AnimatedNumber value={metric.value} suffix="%" />
            </div>
          </div>
          <span className="analytics-radial-label">{metric.name}</span>
        </div>
      ))}
    </div>
  );
}

export default memo(ResolutionRadialCharts);

export function buildRadialMetrics(stats: {
  total: number;
  ok: number;
  warn: number;
  pend: number;
  rate: number;
}): RadialMetric[] {
  const { total, ok, warn, rate } = stats;
  const responseRate = total ? Math.round(((ok + warn) / total) * 100) : 0;
  const activeHandled = ok + warn > 0 ? Math.round((ok / (ok + warn)) * 100) : 0;

  return [
    { key: "resolution", name: "தீர்வு விகிதம்", value: rate, fill: TVK.ok },
    { key: "response", name: "பதிலளிப்பு விகிதம்", value: responseRate, fill: TVK.gold },
    {
      key: "verification",
      name: "சரிபார்ப்பு விகிதம்",
      value: activeHandled,
      fill: TVK.red,
    },
  ];
}
