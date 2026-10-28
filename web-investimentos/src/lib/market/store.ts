import { withBase } from "../base-path";
import { createExternalStore } from "../external-store";
import { MarketSimulator } from "./simulator";
import { startCoinbaseFeed, type CryptoTick } from "./crypto-live";
import type { MarketPayload, MarketSnapshot, Quote, SimulatedSnapshot } from "./types";
import { CRYPTO_SEEDS, ETF_SEEDS, FX_SEED, GLOBAL_INDEX_SEEDS, MACRO, US_STOCK_SEEDS } from "./seeds";
import { quoteFrom } from "./simulator";

/** Aplica um tick ao vivo (variação de 24 h, máxima/mínima, capitalização proporcional). */
function applyTick(q: Quote, tick: CryptoTick): Quote {
  const change = tick.price - tick.open24h;
  const history = q.history.length ? [...q.history.slice(0, -1), tick.price] : [tick.price];
  return {
    ...q,
    price: tick.price,
    previousClose: tick.open24h,
    open: tick.open24h,
    change,
    changePct: (change / tick.open24h) * 100,
    dayHigh: Math.max(tick.high24h, tick.price),
    dayLow: Math.min(tick.low24h, tick.price),
    marketCap: q.marketCap ? (q.marketCap * tick.price) / q.price : undefined,
    marketTime: tick.time,
    history,
    stale: false,
  };
}

/**
 * Cotações reais: busca /api/market/quotes.json (Yahoo Finance, CoinGecko e
 * Banco Central) ao abrir e a cada `pollMs`, só com a aba visível. Cripto
 * recebe ainda o feed ao vivo da Coinbase, aplicado num loop de 1 s.
 */
export function createMarketStore(pollMs = 60_000, liveFlushMs = 1_000) {
  const sim = MarketSimulator.initialSnapshot();
  const initial: MarketSnapshot = {
    status: "loading",
    source: "yahoo",
    fetchedAt: 0,
    marketTime: null,
    session: null,
    usSession: null,
    index: sim.index,
    stocks: sim.stocks,
    us: US_STOCK_SEEDS.map((s) => quoteFrom(s, s.previousClose)),
    etfs: ETF_SEEDS.map((s) => quoteFrom(s, s.previousClose)),
    global: GLOBAL_INDEX_SEEDS.map((s) => quoteFrom(s, s.previousClose)),
    fx: quoteFrom(FX_SEED, FX_SEED.previousClose),
    crypto: CRYPTO_SEEDS.map((s) => quoteFrom(s, s.previousClose)),
    cryptoGlobal: null,
    cryptoLive: "connecting",
    macro: MACRO,
    macroSource: "referencia",
  };
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let stopFeed: (() => void) | null = null;
  const pending = new Map<string, CryptoTick>();
  const productToSymbol = new Map(CRYPTO_SEEDS.filter((s) => s.coinbase).map((s) => [s.coinbase!, s.symbol]));

  /** Loop de 1 s: aplica de uma vez os ticks acumulados (um só render por segundo). */
  const flush = () => {
    if (pending.size === 0) return;
    const current = store.get();
    const crypto = current.crypto.map((q) => {
      const tick = pending.get(q.symbol);
      return tick ? applyTick(q, tick) : q;
    });
    pending.clear();
    store.set({ ...current, crypto });
  };

  const startLive = () => {
    if (stopFeed) return;
    stopFeed = startCoinbaseFeed(
      [...productToSymbol.keys()],
      (product, tick) => {
        const symbol = productToSymbol.get(product);
        if (symbol) pending.set(symbol, tick);
      },
      (cryptoLive) => store.get().cryptoLive !== cryptoLive && store.set({ ...store.get(), cryptoLive }),
    );
    flushTimer = setInterval(flush, liveFlushMs);
  };
  const stopLive = () => {
    stopFeed?.();
    stopFeed = null;
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = null;
    pending.clear();
  };

  /**
   * Métricas de cripto direto da CoinGecko pelo navegador (ela aceita CORS),
   * quando o servidor não conseguiu (limite gratuito). No máximo a cada 5 min.
   */
  let lastMetaFetch = 0;
  const fillCryptoMeta = async () => {
    const current = store.get();
    const missing = !current.cryptoGlobal || current.crypto.some((q) => q.marketCap === undefined);
    if (!missing || Date.now() - lastMetaFetch < 5 * 60_000) return;
    lastMetaFetch = Date.now();
    const ids = CRYPTO_SEEDS.map((s) => s.coingeckoId).filter(Boolean).join(",");
    try {
      const [markets, global] = await Promise.all([
        fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`).then((r) => (r.ok ? r.json() : [])),
        fetch("https://api.coingecko.com/api/v3/global").then((r) => (r.ok ? r.json() : null)),
      ]) as [{ id: string; market_cap: number | null; total_volume: number | null; market_cap_rank: number | null }[], { data?: { market_cap_percentage: Record<string, number>; total_market_cap: Record<string, number>; market_cap_change_percentage_24h_usd: number } } | null];
      const byId = new Map(markets.map((m) => [m.id, m]));
      const now = store.get();
      store.set({
        ...now,
        crypto: now.crypto.map((q) => {
          const m = byId.get(CRYPTO_SEEDS.find((s) => s.symbol === q.symbol)?.coingeckoId ?? "");
          return m && q.marketCap === undefined
            ? { ...q, marketCap: m.market_cap ?? undefined, volume24h: m.total_volume ?? undefined, rank: m.market_cap_rank ?? undefined }
            : q;
        }),
        cryptoGlobal:
          now.cryptoGlobal ??
          (global?.data
            ? {
                btcDominance: global.data.market_cap_percentage.btc ?? null,
                totalMarketCap: global.data.total_market_cap.usd ?? null,
                marketCapChange24h: global.data.market_cap_change_percentage_24h_usd ?? null,
              }
            : null),
      });
    } catch {
      // Sem as métricas, os cards mostram "—"; os preços seguem pelo feed ao vivo.
    }
  };

  const load = async () => {
    try {
      const res = await fetch(withBase("/api/market/quotes.json"), { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const payload = (await res.json()) as MarketPayload;
      const current = store.get();
      // O arquivo do servidor pode ser mais antigo que o feed ao vivo: mantém o preço mais novo.
      const crypto = payload.crypto.map((fresh) => {
        const prev = current.status === "ready" ? current.crypto.find((q) => q.symbol === fresh.symbol) : undefined;
        if (!prev) return fresh;
        // Métricas: as do servidor, ou as que já tínhamos (ex.: buscadas pelo navegador).
        const meta = { marketCap: fresh.marketCap ?? prev.marketCap, volume24h: fresh.volume24h ?? prev.volume24h, rank: fresh.rank ?? prev.rank };
        return (prev.marketTime ?? 0) > (fresh.marketTime ?? 0) ? { ...prev, ...meta } : { ...fresh, ...meta };
      });
      store.set({
        ...payload,
        crypto,
        cryptoGlobal: payload.cryptoGlobal ?? current.cryptoGlobal,
        status: "ready",
        cryptoLive: current.cryptoLive,
      });
      void fillCryptoMeta();
    } catch {
      // Sem acesso ao arquivo (ex.: offline sem cache): mantém o último dado, ou um retrato simulado.
      if (store.get().status === "loading") {
        const s = new MarketSimulator().step(Date.now());
        store.set({
          ...initial, status: "ready", source: "simulado", fetchedAt: Date.now(), index: s.index, stocks: s.stocks,
          notice: "Sem conexão com a fonte de cotações. Exibindo valores simulados.",
        });
      }
    }
  };
  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      void load();
      startLive();
    } else {
      stopLive();
    }
  };
  const store = createExternalStore<MarketSnapshot>(
    initial,
    () => {
      void load();
      pollTimer = setInterval(() => document.visibilityState === "visible" && void load(), pollMs);
      if (document.visibilityState === "visible") startLive();
      document.addEventListener("visibilitychange", onVisibility);
    },
    () => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
      stopLive();
      document.removeEventListener("visibilitychange", onVisibility);
    },
  );
  return { subscribe: store.subscribe, getSnapshot: store.get, getServerSnapshot: () => initial, refresh: load };
}

/** Taxas do Tesouro Direto: simuladas, com tick de 1 s (sem fonte pública aberta). */
export function createTreasuryStore(intervalMs = 1_000) {
  const simulator = new MarketSimulator();
  const initial = MarketSimulator.initialSnapshot();
  let timer: ReturnType<typeof setInterval> | null = null;
  const tick = () => store.set(simulator.step(Date.now()));
  const store = createExternalStore<SimulatedSnapshot>(
    initial,
    () => {
      tick();
      timer = setInterval(() => document.visibilityState === "visible" && tick(), intervalMs);
    },
    () => {
      if (timer) clearInterval(timer);
      timer = null;
    },
  );
  return { subscribe: store.subscribe, getSnapshot: store.get, getServerSnapshot: () => initial };
}

export const marketStore = createMarketStore();
export const treasuryStore = createTreasuryStore();
