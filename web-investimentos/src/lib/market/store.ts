import { withBase } from "../base-path";
import { createExternalStore } from "../external-store";
import { MarketSimulator } from "./simulator";
import type { MarketPayload, MarketSnapshot, SimulatedSnapshot } from "./types";
import { ETF_SEEDS, FX_SEED, GLOBAL_INDEX_SEEDS, MACRO, US_STOCK_SEEDS } from "./seeds";
import { quoteFrom } from "./simulator";

/**
 * Cotações reais: busca /api/market/quotes.json (Yahoo Finance + Banco Central)
 * ao abrir e a cada `pollMs`, só com a aba visível.
 */
export function createMarketStore(pollMs = 60_000) {
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
    macro: MACRO,
    macroSource: "referencia",
  };
  let timer: ReturnType<typeof setInterval> | null = null;

  const load = async () => {
    try {
      const res = await fetch(withBase("/api/market/quotes.json"), { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const payload = (await res.json()) as MarketPayload;
      store.set({ ...payload, status: "ready" });
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
  const onVisibility = () => document.visibilityState === "visible" && void load();
  const store = createExternalStore<MarketSnapshot>(
    initial,
    () => {
      void load();
      timer = setInterval(() => document.visibilityState === "visible" && void load(), pollMs);
      document.addEventListener("visibilitychange", onVisibility);
    },
    () => {
      if (timer) clearInterval(timer);
      timer = null;
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
