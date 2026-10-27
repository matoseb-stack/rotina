import "server-only";
import { ETF_SEEDS, FX_SEED, GLOBAL_INDEX_SEEDS, INDEX_SEED, MACRO, STOCK_SEEDS, US_STOCK_SEEDS } from "../seeds";
import { MarketSimulator, quoteFrom } from "../simulator";
import type { MacroIndicator, MarketPayload, Quote, StockSeed, TradingSession } from "../types";
import { fetchYahooChart, mapLimit, type YahooChart } from "./yahoo";

/** Revalidação das cotações no servidor (Vercel). No GitHub Pages vale o horário do build. */
export const QUOTES_REVALIDATE = 60;

function quoteFromYahoo(seed: StockSeed, { meta, points }: YahooChart): Quote {
  const price = meta.regularMarketPrice;
  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? seed.previousClose;
  const prices = points.map((p) => p.price);
  const change = price - previousClose;
  return {
    symbol: seed.symbol,
    name: seed.name,
    sector: seed.sector,
    market: seed.market ?? "b3",
    currency: seed.currency ?? "BRL",
    kind: seed.kind ?? "stock",
    about: seed.about,
    brandColor: seed.brandColor,
    previousClose,
    open: points[0]?.open ?? points[0]?.price ?? price,
    price,
    dayLow: meta.regularMarketDayLow ?? (prices.length ? Math.min(...prices) : price),
    dayHigh: meta.regularMarketDayHigh ?? (prices.length ? Math.max(...prices) : price),
    change,
    changePct: (change / previousClose) * 100,
    history: prices,
    volume: meta.regularMarketVolume,
    marketTime: meta.regularMarketTime ? meta.regularMarketTime * 1000 : undefined,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
  };
}

/** Valor de referência (sem variação) quando um ativo específico falha. */
function staleQuote(seed: StockSeed): Quote {
  return { ...quoteFrom(seed, seed.previousClose), history: [], stale: true };
}

const pct = (v: string) => `${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

/** Selic meta (432), CDI anualizado (4389) e IPCA 12 meses (13522), do SGS do Banco Central. */
async function fetchMacro(): Promise<{ macro: MacroIndicator[]; source: MarketPayload["macroSource"] }> {
  const series = [
    { code: 432, label: "Selic Meta" },
    { code: 4389, label: "CDI" },
    { code: 13522, label: "IPCA 12m" },
  ];
  try {
    const macro = await Promise.all(
      series.map(async ({ code, label }) => {
        const res = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/1?formato=json`, {
          signal: AbortSignal.timeout(10_000),
          next: { revalidate: 3_600 },
        });
        if (!res.ok) throw new Error(`BCB ${code}: ${res.status}`);
        const [last] = (await res.json()) as { data: string; valor: string }[];
        return { label, value: pct(last.valor), date: last.data };
      }),
    );
    return { macro, source: "bcb" };
  } catch (error) {
    console.warn("[macro] Banco Central indisponível:", error);
    return { macro: MACRO, source: "referencia" };
  }
}

export async function fetchRealMarket(): Promise<MarketPayload> {
  const seeds = [INDEX_SEED, ...STOCK_SEEDS, ...US_STOCK_SEEDS, ...ETF_SEEDS, ...GLOBAL_INDEX_SEEDS, FX_SEED];
  const sessions: { b3: TradingSession | null; us: TradingSession | null } = { b3: null, us: null };
  const failed = new Set<string>();

  const [quotes, { macro, source: macroSource }] = await Promise.all([
    mapLimit(seeds, 4, async (seed) => {
      try {
        const chart = await fetchYahooChart(seed, "1d", "5m", QUOTES_REVALIDATE);
        const regular = chart.meta.currentTradingPeriod?.regular;
        const key = seed.market === "us" ? "us" : "b3";
        if (regular && seed.kind !== "fx" && !sessions[key]) sessions[key] = { start: regular.start * 1000, end: regular.end * 1000 };
        return quoteFromYahoo(seed, chart);
      } catch (error) {
        failed.add(seed.symbol);
        console.warn(`[quotes] ${seed.symbol}:`, error instanceof Error ? error.message : error);
        return staleQuote(seed);
      }
    }),
    fetchMacro(),
  ]);
  const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
  const pick = (list: StockSeed[]) => list.map((s) => bySymbol.get(s.symbol)!);

  // Fonte real fora do ar: retrato simulado da B3, sinalizado na interface.
  if (failed.size === seeds.length) {
    const sim = new MarketSimulator().step(Date.now());
    return {
      source: "simulado", fetchedAt: Date.now(), marketTime: null, session: null, usSession: null,
      index: sim.index, stocks: sim.stocks,
      us: pick(US_STOCK_SEEDS), etfs: pick(ETF_SEEDS), global: pick(GLOBAL_INDEX_SEEDS), fx: bySymbol.get(FX_SEED.symbol)!,
      macro, macroSource,
      notice: "Não foi possível obter cotações reais agora. Exibindo valores simulados.",
    };
  }

  const b3 = [INDEX_SEED, ...STOCK_SEEDS].map((s) => bySymbol.get(s.symbol)!);
  const times = b3.map((q) => q.marketTime ?? 0).filter(Boolean);
  return {
    source: "yahoo",
    fetchedAt: Date.now(),
    marketTime: times.length ? Math.max(...times) : null,
    session: sessions.b3,
    usSession: sessions.us,
    index: bySymbol.get(INDEX_SEED.symbol)!,
    stocks: pick(STOCK_SEEDS),
    us: pick(US_STOCK_SEEDS),
    etfs: pick(ETF_SEEDS),
    global: pick(GLOBAL_INDEX_SEEDS),
    fx: bySymbol.get(FX_SEED.symbol)!,
    macro,
    macroSource,
    notice: failed.size ? `${failed.size} ativo(s) sem cotação no momento; exibindo o último valor de referência.` : undefined,
  };
}
