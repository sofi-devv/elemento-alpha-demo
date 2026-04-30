"use client";

import * as React from "react";
import { ArrowLeft, HelpCircle, Mic, Sparkles, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PORTFOLIO_METRICS } from "@/lib/portfolio/portfolioData";
import type { PortfolioTimeSeriesPoint } from "@/lib/portfolio/portfolioHistory";
import { buildRebalanceVoiceContext } from "@/lib/portfolio/rebalanceVoiceContext";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";
import { VoicePulse } from "@/components/voice/VoicePulse";
import { RaceChart } from "@/components/portfolio/RaceChart";
import { AllocationComparison } from "@/components/portfolio/AllocationComparison";

export interface RebalanceViewProps {
  timeSeries: PortfolioTimeSeriesPoint[];
  onBack: () => void;
}

export function RebalanceView({ timeSeries, onBack }: RebalanceViewProps) {
  const [raceActive, setRaceActive] = React.useState(false);
  const [raceDone, setRaceDone] = React.useState(false);
  const [replayKey, setReplayKey] = React.useState(0);
  const [comparisonActive, setComparisonActive] = React.useState(false);
  const [voicePanelOpen, setVoicePanelOpen] = React.useState(false);

  const bench = PORTFOLIO_METRICS.benchmark;
  const opt32 = PORTFOLIO_METRICS.portfolio32;

  const rebalanceContext = React.useMemo(() => buildRebalanceVoiceContext(timeSeries), [timeSeries]);

  const { startSession, endSession, isConnected, isConnecting, isSpeaking, error: voiceError } =
    useVoiceAgent({
      mode: "rebalance_advisor",
      rebalanceContext,
      voiceName: "Zephyr",
    });

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      setComparisonActive(true);
      setRaceActive(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (isConnected) setVoicePanelOpen(true);
  }, [isConnected]);

  const handleBack = () => {
    endSession();
    onBack();
  };

  const handleReplay = () => {
    endSession();
    setRaceDone(false);
    setReplayKey((k) => k + 1);
    setRaceActive(false);
    setComparisonActive(false);
    window.setTimeout(() => {
      setComparisonActive(true);
      setRaceActive(true);
    }, 50);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-28 md:pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="-ml-2 h-auto gap-2 px-2 py-1 text-gray-500 hover:text-[#1a1a1a]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a tu portafolio actual
          </Button>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6abf1a]">
            Sugerido · rebalanceo
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
            Comparación frente a tu portafolio actual
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
            Gráficos con serie histórica normalizada (base 100). Pulsa el micrófono flotante para hablar con el
            asesor: tiene el contexto de tu portafolio actual y la opción sugerida de esta pantalla.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      {voicePanelOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:bg-black/10"
            aria-label="Cerrar panel del asesor"
            onClick={() => setVoicePanelOpen(false)}
          />
          <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-gray-100 bg-white p-4 shadow-xl ring-1 ring-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-200 md:left-auto md:right-8 md:mx-0">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6abf1a]">
                  Asesor por voz
                </p>
                <p className="text-sm font-bold text-[#1a1a1a] leading-snug">Tu portafolio actual vs Sugerido</p>
              </div>
              <button
                type="button"
                onClick={() => setVoicePanelOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#1a1a1a]"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              <VoicePulse speaking={isSpeaking} />
              <div className="flex justify-center flex-wrap gap-2">
                {voiceError ? (
                  <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold ring-1 ring-red-200">
                    Error de conexión
                  </span>
                ) : isConnecting ? (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold ring-1 ring-amber-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Conectando…
                  </span>
                ) : isConnected ? (
                  <span className="px-3 py-1 bg-[#F0FEE6] text-[#4a7c59] rounded-full text-xs font-semibold ring-1 ring-[#BBE795]/40 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c59] animate-pulse" />
                    {isSpeaking ? "Hablando · LIVE" : "Escuchando · LIVE"}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-semibold ring-1 ring-gray-200">
                    Pulsa activar y permite el micrófono
                  </span>
                )}
              </div>
              {voiceError ? <p className="text-xs text-red-600">{voiceError}</p> : null}
              <div className="flex w-full justify-center gap-2 pt-1">
                {isConnecting ? (
                  <Button disabled variant="outline" className="flex-1 rounded-xl h-10">
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                    Conectando…
                  </Button>
                ) : !isConnected ? (
                  <Button
                    type="button"
                    onClick={() => void startSession()}
                    className="flex-1 rounded-xl h-10 bg-[#4a7c59] text-white hover:bg-[#3f6b4c] font-semibold gap-2"
                  >
                    <Mic className="w-4 h-4" /> Activar micrófono
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => endSession()}
                    variant="outline"
                    className="flex-1 rounded-xl h-10 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-semibold gap-2"
                  >
                    <Square className="w-3 h-3 fill-current" /> Finalizar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => setVoicePanelOpen((open) => !open)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6abf1a] focus-visible:ring-offset-2 ${
          isConnected
            ? "bg-[#4a7c59] ring-2 ring-[#BBE795]/90 shadow-[0_4px_24px_rgba(106,191,26,0.35)]"
            : "bg-[#4a7c59] hover:bg-[#3f6b4c] shadow-[0_8px_30px_rgba(74,124,89,0.35)]"
        } ${isSpeaking ? "animate-pulse" : ""}`}
        aria-label={voicePanelOpen ? "Ocultar panel del asesor" : "Abrir preguntas por voz"}
        aria-expanded={voicePanelOpen}
      >
        <Mic className="h-6 w-6 shrink-0" strokeWidth={2.25} />
      </button>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricTile
          label="TRM estimado"
          value={`${opt32.trm}%`}
          accent
          description="La TRM (Tasa Representativa del Mercado) es la tasa de referencia cambiaria oficial. Aquí ves una estimación incorporada al escenario del portafolio rebalanceado para contextualizar rentabilidades."
          comparison={{ benchmark: bench.trm, portfolio: opt32.trm }}
        />
        <MetricTile
          label="Retorno esperado"
          value={`${opt32.expectedReturn}%`}
          description="Rentabilidad anual esperada según el modelo y la información histórica disponible. Es una proyección orientativa; los resultados reales pueden diferir."
          comparison={{ benchmark: bench.expectedReturn, portfolio: opt32.expectedReturn }}
        />
        <MetricTile
          label="Volatilidad"
          value={`${opt32.volatility}%`}
          description="Te dice qué tan fuerte oscilan los resultados de un periodo a otro: números más altos significan meses muy buenos alternando con meses muy malos; más bajo suele sentirse más estable en el día a día. Aquí la opción rebalanceada tiende a moverse un poco menos que tu referencia actual."
          comparison={{ benchmark: bench.volatility, portfolio: opt32.volatility }}
          comparisonHint="Menos barra = menos oscilación típica"
        />
        <MetricTile
          label="Max drawdown"
          value={`${opt32.maxDrawdown}%`}
          description="Imagina la peor racha que hubo en el pasado: desde el mejor momento hasta el punto más bajo antes de recuperarse, ¿cuánto llegó a caer la cuenta? Sirve para dimensionar ‘hasta dónde ha bajado en crisis’ en los datos que miramos, no para predecir el futuro."
          comparison={{ benchmark: bench.maxDrawdown, portfolio: opt32.maxDrawdown }}
          comparisonHint="No siempre menor es mejor: depende del riesgo que asumas"
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <p className="mb-4 text-sm font-bold text-[#1a1a1a]">Comparación de asignaciones</p>
        <AllocationComparison active={comparisonActive} />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-[#1a1a1a]">Carrera histórica</p>
            <p className="text-xs text-gray-500">
              Dos líneas desde base 100: tu portafolio actual vs sugerido
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs" onClick={handleReplay}>
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
          El portafolio sugerido prioriza menor volatilidad histórica ({opt32.volatility}%) frente a tu portafolio actual,
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
  description,
  comparison,
  comparisonHint,
}: {
  label: string;
  value: string;
  accent?: boolean;
  description: string;
  comparison?: { benchmark: number; portfolio: number };
  comparisonHint?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className={`group relative w-full overflow-hidden rounded-2xl p-4 text-left shadow-sm ring-1 transition-[box-shadow,transform] hover:ring-[#BBE795]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6abf1a] focus-visible:ring-offset-2 active:scale-[0.99] ${
          accent ? "bg-[#F0FEE6] ring-[#BBE795]/50" : "bg-white ring-gray-100 hover:bg-gray-50/80"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
          <HelpCircle
            className={`h-4 w-4 shrink-0 opacity-50 transition-opacity group-hover:opacity-80 ${
              accent ? "text-[#4a7c59]" : "text-gray-400"
            }`}
            aria-hidden
          />
        </div>
        <p className="mt-1 text-xl font-bold tabular-nums text-[#1a1a1a]">{value}</p>

        {comparison ? (
          <MetricHoverComparison
            benchmark={comparison.benchmark}
            portfolio={comparison.portfolio}
            accent={accent}
            hint={comparisonHint}
          />
        ) : null}

        <span className="sr-only">Pulsa para leer qué significa esta métrica</span>
      </PopoverTrigger>
      <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] border-gray-100 bg-white p-4 text-[#1a1a1a] shadow-lg ring-1 ring-gray-100">
        <PopoverTitle className="text-sm font-semibold leading-snug text-[#1a1a1a]">{label}</PopoverTitle>
        <PopoverDescription className="mt-2 text-xs leading-relaxed text-gray-600">{description}</PopoverDescription>
      </PopoverContent>
    </Popover>
  );
}

function MetricHoverComparison({
  benchmark,
  portfolio,
  accent,
  hint,
}: {
  benchmark: number;
  portfolio: number;
  accent?: boolean;
  hint?: string;
}) {
  const max = Math.max(Math.abs(benchmark), Math.abs(portfolio), 1e-6);
  const benchW = Math.min(100, (Math.abs(benchmark) / max) * 100);
  const portW = Math.min(100, (Math.abs(portfolio) / max) * 100);

  return (
    <div
      className="pointer-events-none mt-3 max-h-0 opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:max-h-[128px] group-hover:opacity-100 group-hover:translate-y-0"
      aria-hidden
    >
      <div className="space-y-2 border-t border-gray-200/80 pt-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Antes vs rebalanceo</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-[6.5rem] shrink-0 text-[10px] leading-tight text-gray-500">Tu portafolio actual</span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full origin-left scale-x-0 rounded-full bg-gray-400 transition-transform duration-500 ease-out group-hover:scale-x-100"
                style={{ width: `${benchW}%` }}
              />
            </div>
            <span className="w-11 shrink-0 text-right text-[10px] tabular-nums text-gray-600">
              {benchmark.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-[6.5rem] shrink-0 text-[10px] leading-tight text-[#4a7c59]">Sugerido</span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e8f5e0]/80">
              <div
                className={`h-full origin-left scale-x-0 rounded-full transition-transform duration-500 ease-out delay-100 group-hover:scale-x-100 ${
                  accent ? "bg-[#6abf1a]" : "bg-[#7cb342]"
                }`}
                style={{ width: `${portW}%` }}
              />
            </div>
            <span className="w-11 shrink-0 text-right text-[10px] font-semibold tabular-nums text-[#1a1a1a]">
              {portfolio.toFixed(2)}%
            </span>
          </div>
        </div>
        {hint ? <p className="text-[10px] leading-snug text-gray-400">{hint}</p> : null}
      </div>
    </div>
  );
}
