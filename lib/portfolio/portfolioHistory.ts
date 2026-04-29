export interface PortfolioHistoryData {
  dates: string[];
  portfolios: {
    provided: number[];
    portfolio32: number[];
    portfolio33: number[];
    portfolio36: number[];
  };
}

export interface PortfolioTimeSeriesPoint {
  date: string;
  provided: number;
  portfolio32: number;
  portfolio33: number;
  portfolio36: number;
}

let cachedData: PortfolioHistoryData | null = null;

export async function loadPortfolioHistory(): Promise<PortfolioHistoryData> {
  if (cachedData) return cachedData;

  const response = await fetch("/data/portfolio-history.json");
  if (!response.ok) {
    throw new Error("Failed to load portfolio history data");
  }

  cachedData = await response.json();
  return cachedData!;
}

export async function getPortfolioTimeSeries(): Promise<PortfolioTimeSeriesPoint[]> {
  const data = await loadPortfolioHistory();

  return data.dates.map((date, idx) => ({
    date,
    provided: data.portfolios.provided[idx],
    portfolio32: data.portfolios.portfolio32[idx],
    portfolio33: data.portfolios.portfolio33[idx],
    portfolio36: data.portfolios.portfolio36[idx],
  }));
}

export async function getPortfolioTimeSeriesFiltered(
  startDate?: string,
  endDate?: string
): Promise<PortfolioTimeSeriesPoint[]> {
  const allData = await getPortfolioTimeSeries();

  return allData.filter((point) => {
    if (startDate && point.date < startDate) return false;
    if (endDate && point.date > endDate) return false;
    return true;
  });
}

export async function getLatestPortfolioValues(): Promise<PortfolioTimeSeriesPoint> {
  const data = await loadPortfolioHistory();
  const lastIdx = data.dates.length - 1;

  return {
    date: data.dates[lastIdx],
    provided: data.portfolios.provided[lastIdx],
    portfolio32: data.portfolios.portfolio32[lastIdx],
    portfolio33: data.portfolios.portfolio33[lastIdx],
    portfolio36: data.portfolios.portfolio36[lastIdx],
  };
}

export async function getPortfolioReturns(): Promise<{
  provided: number;
  portfolio32: number;
  portfolio33: number;
  portfolio36: number;
}> {
  const latest = await getLatestPortfolioValues();

  return {
    provided: ((latest.provided - 100) / 100) * 100,
    portfolio32: ((latest.portfolio32 - 100) / 100) * 100,
    portfolio33: ((latest.portfolio33 - 100) / 100) * 100,
    portfolio36: ((latest.portfolio36 - 100) / 100) * 100,
  };
}

export function calculateAnnualizedReturn(startValue: number, endValue: number, years: number): number {
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

export async function getAnnualizedReturns(): Promise<{
  provided: number;
  portfolio32: number;
  portfolio33: number;
  portfolio36: number;
}> {
  const data = await loadPortfolioHistory();
  const years = data.dates.length / 365;
  const lastIdx = data.dates.length - 1;

  return {
    provided: calculateAnnualizedReturn(100, data.portfolios.provided[lastIdx], years),
    portfolio32: calculateAnnualizedReturn(100, data.portfolios.portfolio32[lastIdx], years),
    portfolio33: calculateAnnualizedReturn(100, data.portfolios.portfolio33[lastIdx], years),
    portfolio36: calculateAnnualizedReturn(100, data.portfolios.portfolio36[lastIdx], years),
  };
}
