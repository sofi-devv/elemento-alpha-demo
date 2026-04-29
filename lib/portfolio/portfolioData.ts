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

export const ASSET_NAMES = [
  "Vista Banrep",
  "COLTES CP",
  "COLTES",
  "COLTES UVRCP",
  "COLTES UVR",
  "FTSE-PIP CO Gov Fix 2Y",
  "FTSE-PIP CO Gov Fix 5Y",
  "FTSE-PIP CO Gov Fix 10Y",
  "FTSE-PIP Co Corp Fix Banking 2 Y",
  "FTSE-PIP Co Corp Fix Banking 5 Y",
  "FTSE-PIP Co Corp Fix Banking 10 Y",
  "FTSE-PIP Co Corp IBR Banking 24M",
  "FTSE-PIP Co Corp IPC Banking 2 Y",
  "FTSE-PIP Co Corp IPC Banking 5 Y",
  "FTSE-PIP Co Corp IPC Banking 10 Y",
] as const;

export const ASSET_ALLOCATION: AssetAllocation[] = [
  { asset: "Vista Banrep", bmkActual: 13.55, portfolio32: 13.0846, portfolio33: 11.1572, portfolio36: 9.005 },
  { asset: "COLTES CP", bmkActual: 0.0, portfolio32: 0.0, portfolio33: 0.0, portfolio36: 0.0 },
  { asset: "COLTES", bmkActual: 0.0, portfolio32: 0.0, portfolio33: 0.0, portfolio36: 0.0 },
  { asset: "COLTES UVRCP", bmkActual: 0.0, portfolio32: 0.0, portfolio33: 0.0, portfolio36: 0.0 },
  { asset: "COLTES UVR", bmkActual: 0.0, portfolio32: 0.0, portfolio33: 0.0, portfolio36: 0.0 },
  { asset: "FTSE-PIP CO Gov Fix 2Y", bmkActual: 0.0, portfolio32: 0.0, portfolio33: 0.0, portfolio36: 0.0 },
  { asset: "FTSE-PIP CO Gov Fix 5Y", bmkActual: 4.27, portfolio32: 3.8326, portfolio33: 3.1189, portfolio36: 3.3376 },
  { asset: "FTSE-PIP CO Gov Fix 10Y", bmkActual: 4.96, portfolio32: 3.6557, portfolio33: 3.3246, portfolio36: 3.6019 },
  { asset: "FTSE-PIP Co Corp Fix Banking 2 Y", bmkActual: 0.0, portfolio32: 0.0, portfolio33: 0.0, portfolio36: 0.0 },
  { asset: "FTSE-PIP Co Corp Fix Banking 5 Y", bmkActual: 29.83, portfolio32: 29.2876, portfolio33: 31.6789, portfolio36: 34.5421 },
  { asset: "FTSE-PIP Co Corp Fix Banking 10 Y", bmkActual: 3.58, portfolio32: 5.0831, portfolio33: 5.3323, portfolio36: 5.0482 },
  { asset: "FTSE-PIP Co Corp IBR Banking 24M", bmkActual: 0.0, portfolio32: 0.0, portfolio33: 0.0, portfolio36: 0.0 },
  { asset: "FTSE-PIP Co Corp IPC Banking 2 Y", bmkActual: 0.0, portfolio32: 0.0, portfolio33: 0.0, portfolio36: 0.0 },
  { asset: "FTSE-PIP Co Corp IPC Banking 5 Y", bmkActual: 29.82, portfolio32: 34.9106, portfolio33: 34.8041, portfolio36: 34.1828 },
  { asset: "FTSE-PIP Co Corp IPC Banking 10 Y", bmkActual: 5.99, portfolio32: 6.8373, portfolio33: 6.6403, portfolio36: 6.8151 },
];

export const PORTFOLIO_METRICS = {
  benchmark: {
    trm: 8.0,
    expectedReturn: null,
    volatility: null,
    maxDrawdown: null,
  },
  portfolio32: {
    trm: 3.3087,
    expectedReturn: 7.8035,
    volatility: 1.6793,
    maxDrawdown: 7.4066,
  },
  portfolio33: {
    trm: 3.9437,
    expectedReturn: 7.8174,
    volatility: 1.7147,
    maxDrawdown: 7.5547,
  },
  portfolio36: {
    trm: 3.4674,
    expectedReturn: 7.8286,
    volatility: 1.7609,
    maxDrawdown: 8.1466,
  },
} as const;

export const PORTFOLIO_OPTIONS: PortfolioOption[] = [
  {
    id: "benchmark",
    name: "Benchmark Actual",
    description: "Portafolio de referencia actual",
    metrics: {
      trm: 8.0,
      expectedReturn: 0,
      volatility: 0,
      maxDrawdown: 0,
    },
    allocation: ASSET_ALLOCATION.map((a) => ({
      ...a,
      portfolio32: a.bmkActual,
      portfolio33: a.bmkActual,
      portfolio36: a.bmkActual,
    })),
  },
  {
    id: "portfolio32",
    name: "Portfolio 32",
    description: "Opción de rebalanceo con menor volatilidad",
    metrics: {
      trm: 3.3087,
      expectedReturn: 7.8035,
      volatility: 1.6793,
      maxDrawdown: 7.4066,
    },
    allocation: ASSET_ALLOCATION,
  },
  {
    id: "portfolio33",
    name: "Portfolio 33",
    description: "Opción de rebalanceo balanceada",
    metrics: {
      trm: 3.9437,
      expectedReturn: 7.8174,
      volatility: 1.7147,
      maxDrawdown: 7.5547,
    },
    allocation: ASSET_ALLOCATION,
  },
  {
    id: "portfolio36",
    name: "Portfolio 36",
    description: "Opción de rebalanceo con mayor retorno esperado",
    metrics: {
      trm: 3.4674,
      expectedReturn: 7.8286,
      volatility: 1.7609,
      maxDrawdown: 8.1466,
    },
    allocation: ASSET_ALLOCATION,
  },
];

export function getPortfolioAllocation(portfolioId: string): number[] {
  const key = portfolioId as keyof typeof PORTFOLIO_METRICS;
  if (portfolioId === "benchmark") {
    return ASSET_ALLOCATION.map((a) => a.bmkActual);
  }
  return ASSET_ALLOCATION.map((a) => a[key as keyof AssetAllocation] as number);
}

export function getActiveAssets(portfolioId: string): AssetAllocation[] {
  const allocation = getPortfolioAllocation(portfolioId);
  return ASSET_ALLOCATION.filter((_, idx) => allocation[idx] > 0);
}
