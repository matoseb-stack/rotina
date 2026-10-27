import "server-only";
import type { HistoryPayload, StockSeed } from "../types";
import { fetchYahooChart, mapLimit } from "./yahoo";

export const HISTORY_REVALIDATE = 300;

/** Período do seletor → consulta ao Yahoo (intervalo escolhido para ~20 a 300 pontos). */
const QUERIES = {
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  ALL: { range: "max", interval: "1mo" },
} as const;

type PeriodKey = keyof typeof QUERIES;

export async function fetchRealHistory(seed: StockSeed): Promise<HistoryPayload> {
  const symbol = seed.symbol;
  const series: HistoryPayload["series"] = {};
  let previousClose: number | undefined;
  const errors: string[] = [];
  await mapLimit(Object.keys(QUERIES) as PeriodKey[], 3, async (period) => {
    const { range, interval } = QUERIES[period];
    try {
      const chart = await fetchYahooChart(seed, range, interval, HISTORY_REVALIDATE);
      series[period] = chart.points.map(({ t, price }) => ({ t, price: Math.round(price * 100) / 100 }));
      if (period === "1D") previousClose = chart.meta.chartPreviousClose ?? chart.meta.previousClose;
    } catch (error) {
      errors.push(`${period}: ${error instanceof Error ? error.message : "erro"}`);
    }
  });
  if (errors.length) console.warn(`[history] ${symbol}`, errors.join("; "));
  return {
    symbol,
    fetchedAt: Date.now(),
    series,
    previousClose,
    error: errors.length === Object.keys(QUERIES).length ? "Histórico indisponível no momento." : undefined,
  };
}
