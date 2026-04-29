"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPortfolioTimeSeries } from "@/lib/portfolio/portfolioHistory";
import type { PortfolioTimeSeriesPoint } from "@/lib/portfolio/portfolioHistory";
import { BenchmarkView } from "@/components/portfolio/BenchmarkView";
import { RebalanceView } from "@/components/portfolio/RebalanceView";

export default function PortfolioPage() {
  const [mode, setMode] = React.useState<"benchmark" | "rebalance">("benchmark");
  const [series, setSeries] = React.useState<PortfolioTimeSeriesPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [benchmarkChartKey, setBenchmarkChartKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getPortfolioTimeSeries();
        if (!cancelled) setSeries(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#1a1a1a]"
            >
              <ArrowLeft className="h-4 w-4" />
              Inicio
            </Link>
            <div className="h-4 w-px bg-gray-200" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[#1a1a1a]">Elemento</h1>
              <p className="text-xs text-gray-500">Portafolios de inversión · demo</p>
            </div>
          </div>
          <span className="hidden rounded-full bg-[#F0FEE6] px-3 py-1 text-[11px] font-semibold text-[#4a7c59] ring-1 ring-[#BBE795]/40 sm:inline">
            Front Office · Fase 2
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {mode === "benchmark" ? (
          <BenchmarkView
            timeSeries={series}
            loading={loading}
            chartAnimateKey={benchmarkChartKey}
            onRebalance={() => setMode("rebalance")}
          />
        ) : (
          <RebalanceView
            timeSeries={series}
            onBack={() => {
              setMode("benchmark");
              setBenchmarkChartKey((k) => k + 1);
            }}
          />
        )}
      </main>

      <footer className="border-t border-gray-100 py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Datos de demostración · sin custodia ni ejecución real</span>
          <Link href="/onboarding" className="font-medium text-[#6abf1a] hover:underline">
            Ir al onboarding
          </Link>
        </div>
      </footer>
    </div>
  );
}
