import assetAllocationData from "./data/assetAllocation.json";
import portfolioMetricsData from "./data/portfolioMetrics.json";
import historicalDataRaw from "./data/historicalData.json";

export interface AssetAllocation {
  asset: string;
  bmkActual: number;
  portfolio32: number;
  portfolio33: number;
  portfolio36: number;
}

export interface PortfolioMetrics {
  trm: number;
  expectedReturn: number;
  volatility: number;
  maxDrawdown: number;
}

export interface PortfolioOption {
  id: string;
  name: string;
  description: string;
  metrics: PortfolioMetrics;
  allocation: AssetAllocation[];
}

export interface HistoricalDataPoint {
  date: string;
  provided: number;
  portfolio32: number;
  portfolio33: number;
  portfolio36: number;
}

export const ASSET_ALLOCATION: AssetAllocation[] = assetAllocationData as AssetAllocation[];

export const ASSET_NAMES = ASSET_ALLOCATION.map((a) => a.asset) as readonly string[];

export const PORTFOLIO_METRICS = portfolioMetricsData as {
  benchmark: PortfolioMetrics;
  portfolio32: PortfolioMetrics;
  portfolio33: PortfolioMetrics;
  portfolio36: PortfolioMetrics;
};

export const HISTORICAL_DATA: HistoricalDataPoint[] = historicalDataRaw as HistoricalDataPoint[];

export const PORTFOLIO_OPTIONS: PortfolioOption[] = [
  {
    id: "benchmark",
    name: "Tu portafolio actual",
    description: "Portafolio de referencia actual",
    metrics: PORTFOLIO_METRICS.benchmark,
    allocation: ASSET_ALLOCATION.map((a) => ({
      ...a,
      portfolio32: a.bmkActual,
      portfolio33: a.bmkActual,
      portfolio36: a.bmkActual,
    })),
  },
  {
    id: "portfolio32",
    name: "Sugerido",
    description: "Opción de rebalanceo con menor volatilidad",
    metrics: PORTFOLIO_METRICS.portfolio32,
    allocation: ASSET_ALLOCATION,
  },
  {
    id: "portfolio33",
    name: "Portfolio 33",
    description: "Opción de rebalanceo balanceada",
    metrics: PORTFOLIO_METRICS.portfolio33,
    allocation: ASSET_ALLOCATION,
  },
  {
    id: "portfolio36",
    name: "Portfolio 36",
    description: "Opción de rebalanceo con mayor retorno esperado",
    metrics: PORTFOLIO_METRICS.portfolio36,
    allocation: ASSET_ALLOCATION,
  },
];

export function getPortfolioAllocation(portfolioId: string): number[] {
  if (portfolioId === "benchmark") {
    return ASSET_ALLOCATION.map((a) => a.bmkActual);
  }
  const key = portfolioId as keyof AssetAllocation;
  return ASSET_ALLOCATION.map((a) => {
    const value = a[key];
    return typeof value === "number" ? value : 0;
  });
}

export function getActiveAssets(portfolioId: string): AssetAllocation[] {
  const allocation = getPortfolioAllocation(portfolioId);
  return ASSET_ALLOCATION.filter((_, idx) => allocation[idx] > 0);
}

export function getHistoricalDataForPortfolio(portfolioId: string): { date: string; value: number }[] {
  return HISTORICAL_DATA.map((point) => {
    let value: number;
    switch (portfolioId) {
      case "benchmark":
        value = point.provided;
        break;
      case "portfolio32":
        value = point.portfolio32;
        break;
      case "portfolio33":
        value = point.portfolio33;
        break;
      case "portfolio36":
        value = point.portfolio36;
        break;
      default:
        value = point.provided;
    }
    return { date: point.date, value };
  });
}
