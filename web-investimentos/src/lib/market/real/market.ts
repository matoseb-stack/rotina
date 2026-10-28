import "server-only";
import { CRYPTO_SEEDS, ETF_SEEDS, FX_SEED, GLOBAL_INDEX_SEEDS, INDEX_SEED, MACRO, STOCK_SEEDS, US_STOCK_SEEDS } from "../seeds";
import { MarketSimulator, quoteFrom } from "../simulator";
import type { CryptoGlobal, MacroIndicator, MarketPayload, Quote, StockSeed, TradingSession } from "../types";
import { fetchYahooChart, mapLimit, type YahooChart } from "./yahoo";

/** Revalidação das cotações no servidor (Vercel). No GitHub Pages vale o horário do build. */
export const QUOTES_REVALIDATE = 60;

export function quoteFromYahoo(seed: StockSeed, { meta, points }: YahooChart): Quote {
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

const DAY_MS = 86_400_000;

/**
 * Cripto negocia 24 h por dia: a variação é a das últimas 24 h, medida contra
 * o preço de 24 h atrás numa série de 15 min (o "fechamento" do Yahoo é 00h UTC).
 */
function cryptoQuote(seed: StockSeed, chart: YahooChart): Quote {
  const base = quoteFromYahoo(seed, chart);
  const now = chart.points.at(-1)?.t ?? Date.now();
  const day = chart.points.filter((p) => p.t >= now - DAY_MS);
  const ref = [...chart.points].reverse().find((p) => p.t <= now - DAY_MS) ?? day[0];
  if (!ref || day.length < 2) return base;
  const prices = day.map((p) => p.price);
  const change = base.price - ref.price;
  return {
    ...base,
    previousClose: ref.price,
    open: ref.price,
    change,
    changePct: (change / ref.price) * 100,
    dayHigh: Math.max(...prices, base.price),
    dayLow: Math.min(...prices, base.price),
    history: [...prices.slice(0, -1), base.price],
  };
}

/** Cotação de qualquer ativo (ação, índice, câmbio ou cripto) no formato do painel. */
export async function fetchSeedQuote(seed: StockSeed): Promise<{ quote: Quote; chart: YahooChart }> {
  if (seed.kind === "crypto") {
    const chart = await fetchYahooChart(seed, "5d", "15m", QUOTES_REVALIDATE);
    return { quote: cryptoQuote(seed, chart), chart };
  }
  const chart = await fetchYahooChart(seed, "1d", "5m", QUOTES_REVALIDATE);
  return { quote: quoteFromYahoo(seed, chart), chart };
}

interface CoinGeckoMarket {
  id: string;
  market_cap: number | null;
  total_volume: number | null;
  market_cap_rank: number | null;
}

/** Capitalização, volume de 24 h, ranking e dominância do BTC (CoinGecko; limite gratuito baixo). */
async function fetchCoinGecko(): Promise<{ markets: Map<string, CoinGeckoMarket>; global: CryptoGlobal | null }> {
  const ids = CRYPTO_SEEDS.map((s) => s.coingeckoId).filter(Boolean).join(",");
  const get = async <T,>(url: string): Promise<T> => {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10_000), next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`CoinGecko respondeu ${res.status}`);
    return (await res.json()) as T;
  };
  const [markets, global] = await Promise.all([
    get<CoinGeckoMarket[]>(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`).catch((e) => {
      console.warn("[crypto] markets:", e instanceof Error ? e.message : e);
      return [] as CoinGeckoMarket[];
    }),
    get<{ data: { market_cap_percentage: Record<string, number>; total_market_cap: Record<string, number>; market_cap_change_percentage_24h_usd: number } }>(
      "https://api.coingecko.com/api/v3/global",
    ).catch((e) => {
      console.warn("[crypto] global:", e instanceof Error ? e.message : e);
      return null;
    }),
  ]);
  return {
    markets: new Map(markets.map((m) => [m.id, m])),
    global: global
      ? {
          btcDominance: global.data.market_cap_percentage.btc ?? null,
          totalMarketCap: global.data.total_market_cap.usd ?? null,
          marketCapChange24h: global.data.market_cap_change_percentage_24h_usd ?? null,
        }
      : null,
  };
}

export async function fetchRealMarket(): Promise<MarketPayload> {
  const seeds = [INDEX_SEED, ...STOCK_SEEDS, ...US_STOCK_SEEDS, ...ETF_SEEDS, ...GLOBAL_INDEX_SEEDS, FX_SEED, ...CRYPTO_SEEDS];
  const sessions: { b3: TradingSession | null; us: TradingSession | null } = { b3: null, us: null };
  const failed = new Set<string>();

  const [quotes, { macro, source: macroSource }, gecko] = await Promise.all([
    mapLimit(seeds, 4, async (seed) => {
      try {
        const { quote, chart } = await fetchSeedQuote(seed);
        const regular = chart.meta.currentTradingPeriod?.regular;
        const key = seed.market === "us" ? "us" : "b3";
        if (regular && seed.kind !== "fx" && seed.kind !== "crypto" && !sessions[key]) sessions[key] = { start: regular.start * 1000, end: regular.end * 1000 };
        return quote;
      } catch (error) {
        failed.add(seed.symbol);
        console.warn(`[quotes] ${seed.symbol}:`, error instanceof Error ? error.message : error);
        return staleQuote(seed);
      }
    }),
    fetchMacro(),
    fetchCoinGecko(),
  ]);
  const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
  const pick = (list: StockSeed[]) => list.map((s) => bySymbol.get(s.symbol)!);
  const crypto = CRYPTO_SEEDS.map((seed) => {
    const q = bySymbol.get(seed.symbol)!;
    const m = seed.coingeckoId ? gecko.markets.get(seed.coingeckoId) : undefined;
    return m ? { ...q, marketCap: m.market_cap ?? undefined, volume24h: m.total_volume ?? undefined, rank: m.market_cap_rank ?? undefined } : q;
  });

  // Fonte real fora do ar: retrato simulado da B3, sinalizado na interface.
  if (failed.size === seeds.length) {
    const sim = new MarketSimulator().step(Date.now());
    return {
      source: "simulado", fetchedAt: Date.now(), marketTime: null, session: null, usSession: null,
      index: sim.index, stocks: sim.stocks,
      us: pick(US_STOCK_SEEDS), etfs: pick(ETF_SEEDS), global: pick(GLOBAL_INDEX_SEEDS), fx: bySymbol.get(FX_SEED.symbol)!,
      crypto, cryptoGlobal: gecko.global,
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
    crypto,
    cryptoGlobal: gecko.global,
    macro,
    macroSource,
    notice: failed.size ? `${failed.size} ativo(s) sem cotação no momento; exibindo o último valor de referência.` : undefined,
  };
}
