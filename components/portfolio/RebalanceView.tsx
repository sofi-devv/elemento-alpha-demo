"use client";

import * as React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ASSET_ALLOCATION,
  PORTFOLIO_METRICS,
  getActiveAssets,
} from "@/lib/portfolio/portfolioData";
import type { PortfolioTimeSeriesPoint } from "@/lib/portfolio/portfolioHistory";
import { useNarration } from "@/hooks/useNarration";
import { AssetAllocationChart } from "@/components/portfolio/AssetAllocationChart";
import { RaceChart } from "@/components/portfolio/RaceChart";

const NARRATION_TEXT =
  "Te presento una oportunidad de rebalanceo para tu portafolio. El Portfolio 32 ofrece un retorno esperado del siete coma ocho por ciento anual, con una volatilidad de solo uno coma sesenta y ocho por ciento, la más baja de nuestras opciones. Su máximo drawdown histórico es del siete coma cuatro por ciento. Observa cómo se comporta comparado con tu benchmark actual.";

export interface RebalanceViewProps {
  timeSeries: PortfolioTimeSeriesPoint[];
  onBack: () => void;
}

export function RebalanceView({ timeSeries, onBack }: RebalanceViewProps) {
  const { speak, stop, isSpeaking, isLoading, error } = useNarration();
  const [raceActive, setRaceActive] = React.useState(false);
  const [raceDone, setRaceDone] = React.useState(false);
  const [replayKey, setReplayKey] = React.useState(0);

  const hasStartedSpeakingRef = React.useRef(false);
  const mountedRef = React.useRef(true);

  const benchmarkAssets = getActiveAssets("benchmark");
  const opt32 = PORTFOLIO_METRICS.portfolio32;

  // Iniciar narración al montar
  React.useEffect(() => {
    mountedRef.current = true;

    // Mínima demora para evitar doble ejecución en Strict Mode
    const timerId = setTimeout(() => {
      if (!mountedRef.current) return;
      void speak(NARRATION_TEXT).catch(() => {
        if (mountedRef.current) setRaceActive(true);
      });
    }, 10);

    return () => {
      mountedRef.current = false;
      clearTimeout(timerId);
      hasStartedSpeakingRef.current = false;
      stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Iniciar animación cuando COMIENZA el audio (no cuando termina)
  React.useEffect(() => {
    if (isSpeaking && !hasStartedSpeakingRef.current) {
      hasStartedSpeakingRef.current = true;
      setRaceActive(true);
    }
  }, [isSpeaking]);

  // Si el audio termina sin haber iniciado la animación, iniciarla como fallback
  const triedSpeakingRef = React.useRef(false);
  React.useEffect(() => {
    const id = setTimeout(() => { triedSpeakingRef.current = true; }, 50);
    return () => clearTimeout(id);
  }, []);

  React.useEffect(() => {
    if (!isSpeaking && !isLoading && triedSpeakingRef.current && !raceActive) {
      setRaceActive(true);
    }
  }, [isSpeaking, isLoading, raceActive]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              stop();
              onBack();
            }}
            className="-ml-2 h-auto gap-2 px-2 py-1 text-gray-500 hover:text-[#1a1a1a]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al benchmark
          </Button>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6abf1a]">
            Portfolio 32 · rebalanceo
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
            Comparación frente al benchmark
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
            Narración guiada y animación tipo carrera sobre la serie histórica normalizada (base 100).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isLoading && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              Preparando audio…
            </span>
          )}
          {isSpeaking && (
            <span className="rounded-full bg-[#F0FEE6] px-3 py-1 text-xs font-semibold text-[#4a7c59] ring-1 ring-[#BBE795]/40">
              Reproduciendo narración…
            </span>
          )}
          {raceActive && !raceDone && (
            <span className="rounded-full bg-[#F0FEE6] px-3 py-1 text-xs font-semibold text-[#6abf1a] ring-1 ring-[#BBE795]/40">
              Animación en curso
            </span>
          )}
          {raceDone && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FEE6] px-3 py-1 text-xs font-semibold text-[#6abf1a] ring-1 ring-[#BBE795]/40">
              <Sparkles className="h-3.5 w-3.5" /> Comparación lista
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricTile label="TRM estimado" value={`${opt32.trm}%`} accent />
        <MetricTile label="Retorno esperado" value={`${opt32.expectedReturn}%`} />
        <MetricTile label="Volatilidad" value={`${opt32.volatility}%`} />
        <MetricTile label="Max drawdown" value={`${opt32.maxDrawdown}%`} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="mb-4 text-sm font-bold text-[#1a1a1a]">Benchmark — allocation</p>
          <AssetAllocationChart allocations={benchmarkAssets} variant="benchmark" />
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#BBE795]/40">
          <p className="mb-4 text-sm font-bold text-[#1a1a1a]">Portfolio 32 — allocation</p>
          <AssetAllocationChart allocations={ASSET_ALLOCATION} variant="portfolio32" />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-[#1a1a1a]">Carrera histórica</p>
            <p className="text-xs text-gray-500">
              Dos líneas desde base 100: benchmark vs Portfolio 32
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => {
              stop();
              hasStartedSpeakingRef.current = false;
              setRaceDone(false);
              setReplayKey((k) => k + 1);
              setRaceActive(false);
              window.setTimeout(() => setRaceActive(true), 50);
            }}
          >
            Repetir animación
          </Button>
        </div>
        {timeSeries.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center rounded-xl bg-[#FAFAFA] text-sm text-gray-400">
            Cargando serie histórica…
          </div>
        ) : (
          <RaceChart
            key={replayKey}
            fullSeries={timeSeries}
            active={raceActive}
            onComplete={() => setRaceDone(true)}
          />
        )}
      </div>

      <div className="rounded-2xl bg-[#FAFAFA] p-5 ring-1 ring-gray-100">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Resumen</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          El Portfolio 32 prioriza menor volatilidad histórica ({opt32.volatility}%) frente al benchmark,
          manteniendo un retorno esperado cercano al{" "}
          <span className="font-semibold text-[#1a1a1a]">{opt32.expectedReturn}%</span>.
          La animación muestra cómo ambas trayectorias evolucionan en el tiempo con base 100.
        </p>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 shadow-sm ring-1 ${
        accent ? "bg-[#F0FEE6] ring-[#BBE795]/50" : "bg-white ring-gray-100"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-[#1a1a1a]">{value}</p>
    </div>
  );
}
