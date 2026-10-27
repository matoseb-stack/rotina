"use client";

import { useEffect, useState } from "react";
import { withBase } from "@/lib/base-path";
import type { AssetNewsFeed } from "@/lib/news/types";

type State = { status: "loading" } | { status: "ready"; feed: AssetNewsFeed } | { status: "error" };

/** Notícias da Folha sobre um ativo, servidas como /api/asset-news/<TICKER>.json. */
export function useAssetNews(symbol: string): State {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetch(withBase(`/api/asset-news/${symbol}.json`))
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<AssetNewsFeed>;
      })
      .then((feed) => !cancelled && setState({ status: "ready", feed }))
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [symbol]);
  return state;
}
