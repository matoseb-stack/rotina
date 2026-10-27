"use client";

import { useEffect, useState } from "react";
import { withBase } from "@/lib/base-path";
import type { HistoryPayload } from "@/lib/market/types";

type State = { status: "loading" } | { status: "ready"; data: HistoryPayload } | { status: "error" };

const cache = new Map<string, HistoryPayload>();

/** Histórico real do ativo para o gráfico (todos os períodos num só arquivo). */
export function useStockHistory(symbol: string): State {
  const [state, setState] = useState<State>(() => {
    const hit = cache.get(symbol);
    return hit ? { status: "ready", data: hit } : { status: "loading" };
  });
  useEffect(() => {
    let cancelled = false;
    fetch(withBase(`/api/market/history/${symbol}.json`))
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<HistoryPayload>;
      })
      .then((data) => {
        cache.set(symbol, data);
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch(() => !cancelled && setState((s) => (s.status === "ready" ? s : { status: "error" })));
    return () => {
      cancelled = true;
    };
  }, [symbol]);
  return state;
}
