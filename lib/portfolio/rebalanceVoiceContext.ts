import { PORTFOLIO_METRICS, ASSET_ALLOCATION } from "./portfolioData";
import type { PortfolioTimeSeriesPoint } from "./portfolioHistory";

/**
 * Texto estructurado para el system prompt del asesor de voz en la vista de rebalanceo.
 */
export function buildRebalanceVoiceContext(timeSeries: PortfolioTimeSeriesPoint[]): string {
  const last = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1] : null;
  const head = timeSeries.length > 0 ? timeSeries[0] : null;

  const payload = {
    escenario: "Comparación portafolio actual vs opción rebalanceada Portfolio 32",
    metricas: {
      benchmark: {
        etiqueta: "Portafolio actual (referencia)",
        valores: PORTFOLIO_METRICS.benchmark,
      },
      portfolio32: {
        etiqueta: "Portfolio 32 (opción de rebalanceo mostrada en pantalla)",
        valores: PORTFOLIO_METRICS.portfolio32,
      },
    },
    asignacionPorActivo: ASSET_ALLOCATION.map((a) => ({
      activo: a.asset,
      benchmarkPct: a.bmkActual,
      portfolio32Pct: a.portfolio32,
    })),
    serieHistorica: {
      descripcion:
        "Serie diaria normalizada con base 100. «provided» = trayectoria tipo benchmark; «portfolio32» = Portfolio 32.",
      primeraFecha: head?.date ?? null,
      ultimaFecha: last?.date ?? null,
      ultimoNivelBenchmark100: last?.provided ?? null,
      ultimoNivelPortfolio32_100: last?.portfolio32 ?? null,
    },
  };

  return JSON.stringify(payload, null, 2);
}
