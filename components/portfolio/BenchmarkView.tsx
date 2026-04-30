"use client";

import { TrendingUp, PieChartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PORTFOLIO_METRICS,
  getActiveAssets,
} from "@/lib/portfolio/portfolioData";
import type { PortfolioTimeSeriesPoint } from "@/lib/portfolio/portfolioHistory";
import { AnimatedHistoryChart } from "@/components/portfolio/AnimatedHistoryChart";
import { AssetAllocationChart } from "@/components/portfolio/AssetAllocationChart";

export interface BenchmarkViewProps {
  timeSeries: PortfolioTimeSeriesPoint[];
  chartAnimateKey: number;
  loading?: boolean;
  onRebalance: () => void;
}

export function BenchmarkView({
  timeSeries,
  chartAnimateKey,
  loading,
  onRebalance,
}: BenchmarkViewProps) {
  const benchmarkAssets = getActiveAssets("benchmark");
  const bm = PORTFOLIO_METRICS.benchmark;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6abf1a]">
          Portafolio actual
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
          Tu portafolio de referencia
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
          Distribución basada en el benchmark institucional y evolución histórica del índice normalizado (base 100).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">TRM referencia</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-[#1a1a1a]">{bm.trm}%</p>
          <p className="mt-2 text-xs text-gray-500">Tasa representativa del mercado</p>
        </div>
        <div className="rounded-2xl bg-[#F0FEE6] p-5 shadow-sm ring-1 ring-[#BBE795]/40">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4a7c59]">Activos en cartera</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-[#1a1a1a]">{benchmarkAssets.length}</p>
          <p className="mt-2 text-xs text-[#4a7c59]/90">Instrumentos con peso mayor a cero</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Último dato serie</p>
          <p className="mt-1 text-lg font-bold text-[#1a1a1a]">
            {timeSeries.length ? timeSeries[timeSeries.length - 1].date : "—"}
          </p>
          <p className="mt-2 text-xs text-gray-500">Histórico desde diciembre 2013</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0FEE6]">
              <PieChartIcon className="h-5 w-5 text-[#6abf1a]" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#1a1a1a]">Asset allocation</p>
              <p className="text-xs text-gray-500">Benchmark — pesos objetivo (%)</p>
            </div>
          </div>
          <AssetAllocationChart allocations={benchmarkAssets} variant="benchmark" />
          <ul className="mt-4 grid max-h-48 gap-2 overflow-auto text-xs">
            {benchmarkAssets.map((a) => (
              <li
                key={a.asset}
                className="flex items-center justify-between rounded-lg bg-[#FAFAFA] px-3 py-2 ring-1 ring-gray-100"
              >
                <span className="truncate font-medium text-[#1a1a1a]">{a.asset}</span>
                <span className="ml-2 shrink-0 font-mono tabular-nums font-semibold text-[#6abf1a]">
                  {a.bmkActual.toFixed(2)}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0FEE6]">
              <TrendingUp className="h-5 w-5 text-[#6abf1a]" />
            </span>
            <div>
              <p className="text-sm font-bold text-[#1a1a1a]">Rendimiento histórico</p>
              <p className="text-xs text-gray-500">Índice normalizado — animación al cargar</p>
            </div>
          </div>
          {loading || timeSeries.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center rounded-xl bg-[#FAFAFA] text-sm text-gray-400">
              Cargando serie histórica…
            </div>
          ) : (
            <AnimatedHistoryChart data={timeSeries} animateKey={chartAnimateKey} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-[#F0FEE6] to-white p-5 ring-1 ring-[#BBE795]/50">
        <div>
          <p className="text-sm font-bold text-[#1a1a1a]">Oportunidad de rebalanceo</p>
          <p className="text-xs text-gray-600">
            Descubre el Portfolio 32 con narración guiada y comparación histórica frente al benchmark.
          </p>
        </div>
        <Button
          type="button"
          onClick={onRebalance}
          className="h-11 shrink-0 rounded-xl bg-[#BBE795] px-6 font-semibold text-[#1a1a1a] shadow-[0_4px_16px_rgba(187,231,149,0.4)] hover:bg-[#8fd94a]"
        >
          Ver oportunidad de rebalanceo
        </Button>
      </div>
    </div>
  );
}
