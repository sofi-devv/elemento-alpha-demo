import { PORTFOLIO_METRICS, ASSET_ALLOCATION } from "./portfolioData";
import type { PortfolioTimeSeriesPoint } from "./portfolioHistory";

/**
 * Texto estructurado para el system prompt del asesor de voz en la vista de rebalanceo.
 */
export function buildRebalanceVoiceContext(timeSeries: PortfolioTimeSeriesPoint[]): string {
  const last = timeSeries.length > 0 ? timeSeries[timeSeries.length - 1] : null;
  const head = timeSeries.length > 0 ? timeSeries[0] : null;

  const payload = {
    escenario: "Comparación entre tu portafolio actual y el portafolio sugerido (rebalanceo)",
    metricas: {
      benchmark: {
        etiqueta: "Tu portafolio actual (referencia)",
        valores: PORTFOLIO_METRICS.benchmark,
      },
      portfolio32: {
        etiqueta: "Sugerido (opción de rebalanceo mostrada en pantalla)",
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
        "Serie diaria normalizada con base 100. «provided» = tu portafolio actual; «portfolio32» = portafolio sugerido.",
      primeraFecha: head?.date ?? null,
      ultimaFecha: last?.date ?? null,
      ultimoNivelBenchmark100: last?.provided ?? null,
      ultimoNivelPortfolio32_100: last?.portfolio32 ?? null,
    },
  };

  return JSON.stringify(payload, null, 2);
}
