"use client";

import { useEffect, useState } from "react";
import { withBase } from "@/lib/base-path";
import type { AssetInsight } from "@/lib/insights/types";

type State = { status: "loading" } | { status: "ready"; insight: AssetInsight } | { status: "error" };

/** Resumo "por que está subindo/caindo" do ativo (/api/insights/<TICKER>.json). */
export function useAssetInsight(symbol: string): State {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetch(withBase(`/api/insights/${symbol}.json`))
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<AssetInsight & { error?: string }>;
      })
      .then((data) => {
        if (cancelled) return;
        setState(data.error || !data.summary ? { status: "error" } : { status: "ready", insight: data });
      })
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [symbol]);
  return state;
}
