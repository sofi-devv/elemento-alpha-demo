"use client";

import * as React from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import { ASSET_ALLOCATION, type AssetAllocation } from "@/lib/portfolio/portfolioData";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const PALETTE = [
  "#6abf1a",
  "#BBE795",
  "#4a7c59",
  "#7dd83a",
  "#9fdb6c",
  "#c8eea8",
  "#5cb85c",
  "#8fbc8f",
];

interface AllocationDiff {
  asset: string;
  shortName: string;
  benchmark: number;
  portfolio32: number;
  diff: number;
  percentChange: number;
}

function computeDiffs(): AllocationDiff[] {
  return ASSET_ALLOCATION
    .filter((a) => a.bmkActual > 0 || a.portfolio32 > 0)
    .map((a) => {
      const diff = a.portfolio32 - a.bmkActual;
      const percentChange = a.bmkActual > 0 ? (diff / a.bmkActual) * 100 : (a.portfolio32 > 0 ? 100 : 0);
      return {
        asset: a.asset,
        shortName: a.asset.length > 20 ? a.asset.slice(0, 18) + "…" : a.asset,
        benchmark: a.bmkActual,
        portfolio32: a.portfolio32,
        diff,
        percentChange,
      };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

function buildSlices(allocations: AssetAllocation[], variant: "benchmark" | "portfolio32") {
  const key = variant === "benchmark" ? "bmkActual" : "portfolio32";
  return allocations
    .filter((a) => (a[key as keyof AssetAllocation] as number) > 0)
    .map((a) => ({
      name: a.asset.length > 20 ? `${a.asset.slice(0, 18)}…` : a.asset,
      fullName: a.asset,
      value: Math.round((a[key as keyof AssetAllocation] as number) * 100) / 100,
    }));
}

function MiniPieChart({ variant, animate }: { variant: "benchmark" | "portfolio32"; animate: boolean }) {
  const slices = React.useMemo(() => buildSlices(ASSET_ALLOCATION, variant), [variant]);

  const chartConfig = React.useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    slices.forEach((s, i) => {
      cfg[`slice_${i}`] = { label: s.fullName, color: PALETTE[i % PALETTE.length] };
    });
    return cfg;
  }, [slices]);

  const data = slices.map((s, i) => ({ ...s, fillKey: `slice_${i}` }));

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[200px] w-full">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground text-xs">{item.payload.fullName}</span>
                  <span className="tabular-nums font-mono text-xs">{Number(value).toFixed(2)}%</span>
                </div>
              )}
              hideIndicator
            />
          }
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={2}
          strokeWidth={2}
          stroke="#fff"
          label={false}
          isAnimationActive={animate}
          animationDuration={800}
          animationBegin={0}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

export interface AllocationComparisonProps {
  active: boolean;
}

export function AllocationComparison({ active }: AllocationComparisonProps) {
  const diffs = React.useMemo(() => computeDiffs(), []);
  const [visibleCards, setVisibleCards] = React.useState(0);

  React.useEffect(() => {
    if (!active) {
      setVisibleCards(0);
      return;
    }

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleCards(count);
      if (count >= diffs.length) {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [active, diffs.length]);

  return (
    <div className="space-y-6">
      {/* Gráficos lado a lado con flecha */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex-1 max-w-[220px]">
          <p className="text-center text-xs font-semibold text-gray-500 mb-2">Benchmark</p>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <MiniPieChart variant="benchmark" animate={active} />
          </div>
        </div>

        <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${active ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
          <ArrowRight className="h-8 w-8 text-[#6abf1a]" />
          <span className="text-[10px] font-semibold text-[#6abf1a] uppercase tracking-wider">Rebalanceo</span>
        </div>

        <div className="flex-1 max-w-[220px]">
          <p className="text-center text-xs font-semibold text-[#6abf1a] mb-2">Portfolio 32</p>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#BBE795]/50">
            <MiniPieChart variant="portfolio32" animate={active} />
          </div>
        </div>
      </div>

      {/* Tarjetas de diferencias animadas */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cambios en la asignación</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {diffs.map((d, idx) => {
            const isVisible = idx < visibleCards;
            const isIncrease = d.diff > 0.01;
            const isDecrease = d.diff < -0.01;

            return (
              <div
                key={d.asset}
                className={`
                  flex items-center gap-3 rounded-xl p-3 ring-1 transition-all duration-300
                  ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
                  ${isIncrease ? "bg-[#F0FEE6] ring-[#BBE795]/50" : isDecrease ? "bg-red-50 ring-red-200/50" : "bg-gray-50 ring-gray-200/50"}
                `}
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                <div className={`
                  flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                  ${isIncrease ? "bg-[#BBE795]/50" : isDecrease ? "bg-red-100" : "bg-gray-100"}
                `}>
                  {isIncrease ? (
                    <TrendingUp className="h-4 w-4 text-[#4a7c59]" />
                  ) : isDecrease ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1a1a1a] truncate">{d.shortName}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{d.benchmark.toFixed(1)}%</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className={isIncrease ? "text-[#4a7c59] font-semibold" : isDecrease ? "text-red-500 font-semibold" : ""}>
                      {d.portfolio32.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className={`
                  text-right text-xs font-bold tabular-nums
                  ${isIncrease ? "text-[#4a7c59]" : isDecrease ? "text-red-500" : "text-gray-400"}
                `}>
                  {d.diff > 0 ? "+" : ""}{d.diff.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen rápido */}
      <div className={`
        flex flex-wrap gap-3 justify-center transition-all duration-500
        ${visibleCards >= diffs.length ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}>
        <div className="flex items-center gap-2 rounded-full bg-[#F0FEE6] px-3 py-1.5 ring-1 ring-[#BBE795]/40">
          <TrendingUp className="h-3.5 w-3.5 text-[#4a7c59]" />
          <span className="text-xs font-semibold text-[#4a7c59]">
            {diffs.filter((d) => d.diff > 0.01).length} aumentan
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 ring-1 ring-red-200/40">
          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          <span className="text-xs font-semibold text-red-500">
            {diffs.filter((d) => d.diff < -0.01).length} disminuyen
          </span>
        </div>
      </div>
    </div>
  );
}
