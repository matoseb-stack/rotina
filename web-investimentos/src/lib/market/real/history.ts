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
    // Cripto: "1D" são as últimas 24 h (série de 15 min), não o dia desde 00h UTC.
    const crypto1D = seed.kind === "crypto" && period === "1D";
    const { range, interval } = crypto1D ? { range: "5d", interval: "15m" } : QUERIES[period];
    try {
      const chart = await fetchYahooChart(seed, range, interval, HISTORY_REVALIDATE);
      const cutoff = crypto1D ? (chart.points.at(-1)?.t ?? Date.now()) - 86_400_000 : -Infinity;
      // Cripto vale centavos (ADA, XRP) ou frações de centavo (stablecoins): guarda 6 dígitos significativos.
      const round = (v: number) => (seed.kind === "crypto" ? Number(v.toPrecision(6)) : Math.round(v * 100) / 100);
      series[period] = chart.points.filter((p) => p.t >= cutoff).map(({ t, price }) => ({ t, price: round(price) }));
      if (period === "1D") {
        previousClose = crypto1D ? series[period]![0]?.price : chart.meta.chartPreviousClose ?? chart.meta.previousClose;
      }
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
