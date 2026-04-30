"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import type { PortfolioTimeSeriesPoint } from "@/lib/portfolio/portfolioHistory";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format } from "date-fns";

const chartConfig = {
  provided: {
    label: "Tu portafolio actual",
    color: "#6abf1a",
  },
} satisfies Record<string, { label: string; color: string }>;

export interface AnimatedHistoryChartProps {
  data: PortfolioTimeSeriesPoint[];
  /** Sample ~ every N points for performance (default 14 ~ weekly from daily) */
  sampleEvery?: number;
  /** Reset animation key when changed */
  animateKey?: number;
}

function sampleSeries(
  points: PortfolioTimeSeriesPoint[],
  every: number
): PortfolioTimeSeriesPoint[] {
  if (every <= 1 || points.length <= 2) return points;
  const out: PortfolioTimeSeriesPoint[] = [points[0]];
  for (let i = every; i < points.length - 1; i += every) {
    out.push(points[i]);
  }
  out.push(points[points.length - 1]);
  return out;
}

export function AnimatedHistoryChart({
  data,
  sampleEvery = 14,
  animateKey = 0,
}: AnimatedHistoryChartProps) {
  const series = React.useMemo(
    () => sampleSeries(data, sampleEvery),
    [data, sampleEvery]
  );

  const chartData = React.useMemo(
    () =>
      series.map((p) => ({
        date: p.date,
        index: p.provided,
        labelShort: format(new Date(p.date + "T12:00:00"), "MMM yy"),
      })),
    [series]
  );

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{ left: 8, right: 12, top: 12, bottom: 4 }}
      >
        <defs>
          <linearGradient id="fillProvided" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#BBE795" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#BBE795" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
        <XAxis
          dataKey="labelShort"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={28}
          className="text-muted-foreground text-[10px]"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={["dataMin - 2", "dataMax + 2"]}
          tickFormatter={(v) => `${Number(v).toFixed(0)}`}
          className="text-muted-foreground text-[10px]"
          width={44}
        />
        <ChartTooltip
          cursor={{ stroke: "#BBE795", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as { date?: string } | undefined;
                return row?.date ?? "";
              }}
              formatter={(value) => [
                `${Number(value).toFixed(2)}`,
                "Índice base 100",
              ]}
            />
          }
        />
        <Area
          key={animateKey}
          type="monotone"
          dataKey="index"
          name="provided"
          stroke="#6abf1a"
          strokeWidth={2}
          fill="url(#fillProvided)"
          dot={false}
          activeDot={{ r: 4, fill: "#4a7c59", stroke: "#fff", strokeWidth: 2 }}
          isAnimationActive
          animationDuration={2200}
          animationBegin={150}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ChartContainer>
  );
}
