"use client";

import { useSyncExternalStore } from "react";
import { marketStore } from "@/lib/market/store";
import type { MarketSnapshot } from "@/lib/market/types";

const identity = (s: MarketSnapshot) => s;

/**
 * Fluxo de cotações em tempo real (1 tick/s).
 *
 * Passe um seletor para inscrever o componente só no pedaço que ele usa:
 *   const petr = useMarketData((s) => s.blueChips[0]);
 * O seletor deve devolver algo que já existe no snapshot (ou um primitivo),
 * nunca um objeto/array novo, para manter a referência estável.
 */
export function useMarketData(): MarketSnapshot;
export function useMarketData<T>(selector: (snapshot: MarketSnapshot) => T): T;
export function useMarketData<T>(selector: (snapshot: MarketSnapshot) => T = identity as (s: MarketSnapshot) => T): T {
  return useSyncExternalStore(
    marketStore.subscribe,
    () => selector(marketStore.getSnapshot()),
    () => selector(marketStore.getServerSnapshot()),
  );
}
