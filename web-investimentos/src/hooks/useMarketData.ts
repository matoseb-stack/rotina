"use client";

import { useSyncExternalStore } from "react";
import { marketStore, treasuryStore } from "@/lib/market/store";
import type { MarketSnapshot, SimulatedSnapshot } from "@/lib/market/types";

/**
 * Cotações reais (Yahoo Finance, atraso de até ~15 min), recarregadas a cada 60 s.
 * Passe um seletor para re-renderizar só quando aquele pedaço mudar; ele deve
 * devolver algo do próprio snapshot (ou um primitivo), nunca um objeto novo.
 */
export function useMarketData<T>(selector: (snapshot: MarketSnapshot) => T): T {
  return useSyncExternalStore(
    marketStore.subscribe,
    () => selector(marketStore.getSnapshot()),
    () => selector(marketStore.getServerSnapshot()),
  );
}

/** Títulos do Tesouro (simulados, 1 tick/s). */
export function useTreasuryData<T>(selector: (snapshot: SimulatedSnapshot) => T): T {
  return useSyncExternalStore(
    treasuryStore.subscribe,
    () => selector(treasuryStore.getSnapshot()),
    () => selector(treasuryStore.getServerSnapshot()),
  );
}

export const refreshMarket = () => void marketStore.refresh();
