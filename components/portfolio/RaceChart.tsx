"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import type { PortfolioTimeSeriesPoint } from "@/lib/portfolio/portfolioHistory";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format } from "date-fns";

const chartConfig = {
  provided: {
    label: "Tu portafolio actual",
    color: "#94a3b8",
  },
  portfolio32: {
    label: "Sugerido",
    color: "#6abf1a",
  },
} as const;

export interface RaceChartProps {
  fullSeries: PortfolioTimeSeriesPoint[];
  /** Points per animation tick */
  step?: number;
  /** Ms between ticks */
  intervalMs?: number;
  /** Subsample source for smoother animation length */
  sampleEvery?: number;
  /** Called when animation reaches end */
  onComplete?: () => void;
  /** Start animation when true */
  active: boolean;
}

function subsample(points: PortfolioTimeSeriesPoint[], every: number): PortfolioTimeSeriesPoint[] {
  if (every <= 1 || points.length <= 2) return points;
  const out: PortfolioTimeSeriesPoint[] = [points[0]];
  for (let i = every; i < points.length - 1; i += every) {
    out.push(points[i]);
  }
  out.push(points[points.length - 1]);
  return out;
}

export function RaceChart({
  fullSeries,
  step = 3,
  intervalMs = 45,
  sampleEvery = 10,
  onComplete,
  active,
}: RaceChartProps) {
  const series = React.useMemo(
    () => subsample(fullSeries, sampleEvery),
    [fullSeries, sampleEvery]
  );

  const fullChartData = React.useMemo(
    () =>
      series.map((p) => ({
        date: p.date,
        provided: p.provided,
        portfolio32: p.portfolio32,
        labelShort: format(new Date(p.date + "T12:00:00"), "MMM yy"),
      })),
    [series]
  );

  const [visibleCount, setVisibleCount] = React.useState(0);
  const completedRef = React.useRef(false);

  React.useEffect(() => {
    completedRef.current = false;
    setVisibleCount(0);
  }, [active, fullChartData.length]);

  React.useEffect(() => {
    if (!active || fullChartData.length === 0) return;

    const id = window.setInterval(() => {
      setVisibleCount((c) => {
        const next = Math.min(c + step, fullChartData.length);
        if (next >= fullChartData.length && !completedRef.current) {
          completedRef.current = true;
          window.setTimeout(() => onComplete?.(), 0);
        }
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [active, fullChartData.length, intervalMs, step, onComplete]);

  const visibleData = React.useMemo(() => {
    if (!active) return [];
    const end = Math.max(1, visibleCount);
    return fullChartData.slice(0, Math.min(end, fullChartData.length));
  }, [active, fullChartData, visibleCount]);

  const last = visibleData[visibleData.length - 1];

  return (
    <div className="space-y-3">
      {last && (
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-gray-100 shadow-sm">
            <span className="text-gray-400">Fecha</span>
            <p className="font-semibold text-[#1a1a1a]">{last.date}</p>
          </div>
          <div className="rounded-xl bg-[#F0FEE6] px-3 py-2 ring-1 ring-[#BBE795]/40 shadow-sm">
            <span className="text-[#6abf1a]">Tu portafolio actual</span>
            <p className="font-mono font-bold text-[#1a1a1a]">{last.provided.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-[#BBE795]/50 shadow-sm">
            <span className="text-[#4a7c59]">Sugerido</span>
            <p className="font-mono font-bold text-[#1a1a1a]">{last.portfolio32.toFixed(2)}</p>
          </div>
        </div>
      )}

      <ChartContainer config={chartConfig} className="h-[320px] w-full">
        <LineChart
          accessibilityLayer
          data={visibleData}
          margin={{ left: 8, right: 12, top: 12, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
          <XAxis
            dataKey="labelShort"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={24}
            className="text-muted-foreground text-[10px]"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            domain={["dataMin - 3", "dataMax + 3"]}
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
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="provided"
            name="Tu portafolio actual"
            stroke="var(--color-provided)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="portfolio32"
            name="Sugerido"
            stroke="var(--color-portfolio32)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
