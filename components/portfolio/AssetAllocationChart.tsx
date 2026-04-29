"use client";

import * as React from "react";
import { Cell, Pie, PieChart } from "recharts";
import type { AssetAllocation } from "@/lib/portfolio/portfolioData";
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

export interface AssetAllocationChartProps {
  /** Active allocations only recommended */
  allocations: AssetAllocation[];
  /** Which column to read: benchmark uses bmkActual */
  variant: "benchmark" | "portfolio32";
}

function buildSlices(allocations: AssetAllocation[], variant: AssetAllocationChartProps["variant"]) {
  const key = variant === "benchmark" ? "bmkActual" : "portfolio32";
  return allocations
    .filter((a) => (a[key as keyof AssetAllocation] as number) > 0)
    .map((a) => ({
      name: a.asset.length > 28 ? `${a.asset.slice(0, 26)}…` : a.asset,
      fullName: a.asset,
      value: Math.round((a[key as keyof AssetAllocation] as number) * 100) / 100,
    }));
}

export function AssetAllocationChart({ allocations, variant }: AssetAllocationChartProps) {
  const slices = React.useMemo(
    () => buildSlices(allocations, variant),
    [allocations, variant]
  );

  const chartConfig = React.useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    slices.forEach((s, i) => {
      cfg[`slice_${i}`] = {
        label: s.fullName,
        color: PALETTE[i % PALETTE.length],
      };
    });
    return cfg;
  }, [slices]);

  const data = slices.map((s, i) => ({
    ...s,
    fillKey: `slice_${i}`,
  }));

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[320px] w-full">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{item.payload.fullName}</span>
                  <span className="tabular-nums font-mono">{Number(value).toFixed(2)}%</span>
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
          innerRadius={52}
          outerRadius={92}
          paddingAngle={2}
          strokeWidth={2}
          stroke="#fff"
          label={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
