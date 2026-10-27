import "server-only";

/**
 * Cliente mínimo da API pública de gráficos do Yahoo Finance (v8/chart).
 * Ações da B3 usam o sufixo ".SA"; índices e câmbio têm símbolos próprios
 * ("^BVSP", "^GSPC", "BRL=X"). Cotações da B3 no Yahoo têm atraso de até ~15 min.
 */
const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];
const USER_AGENT = "Mozilla/5.0 (compatible; PainelInvestimentos/1.0)";

import type { StockSeed } from "../types";

/** Símbolo do ativo no Yahoo: explícito na seed, ".SA" na B3 ou o próprio ticker nos EUA. */
export const yahooSymbol = (seed: StockSeed) => seed.yahoo ?? (seed.market === "us" ? seed.symbol : `${seed.symbol}.SA`);

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface YahooMeta {
  regularMarketPrice: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketTime?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  currentTradingPeriod?: { regular?: { start: number; end: number } };
}

export interface YahooPoint {
  t: number;
  price: number;
  open?: number;
}

export interface YahooChart {
  meta: YahooMeta;
  points: YahooPoint[];
}

interface RawChart {
  chart?: {
    result?: Array<{
      meta: YahooMeta;
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: (number | null)[]; open?: (number | null)[] }> };
    }> | null;
    error?: { description?: string } | null;
  };
}

export async function fetchYahooChart(seed: StockSeed, range: string, interval: string, revalidate: number): Promise<YahooChart> {
  let lastError: unknown;
  // query1 → query2 → espera 1,5 s e tenta query1 de novo (contorna 429 ocasional).
  for (const [attempt, host] of [...HOSTS, HOSTS[0]].entries()) {
    if (attempt === HOSTS.length) await pause(1_500);
    try {
      const url = `${host}/v8/finance/chart/${encodeURIComponent(yahooSymbol(seed))}?range=${range}&interval=${interval}&includePrePost=false`;
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
        next: { revalidate },
      });
      if (!res.ok) throw new Error(`Yahoo respondeu ${res.status}`);
      const json = (await res.json()) as RawChart;
      const result = json.chart?.result?.[0];
      if (!result) throw new Error(json.chart?.error?.description ?? "Yahoo sem dados");
      const quote = result.indicators?.quote?.[0];
      const points: YahooPoint[] = [];
      (result.timestamp ?? []).forEach((t, i) => {
        const close = quote?.close?.[i];
        if (typeof close === "number" && Number.isFinite(close)) {
          const open = quote?.open?.[i];
          points.push({ t: t * 1000, price: close, open: typeof open === "number" ? open : undefined });
        }
      });
      return { meta: result.meta, points };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Falha ao consultar o Yahoo Finance");
}

/** Executa `fn` com no máximo `limit` chamadas simultâneas (gentil com a API). */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}
