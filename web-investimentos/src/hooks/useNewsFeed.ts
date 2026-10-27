"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { withBase } from "@/lib/base-path";
import { buildMockFeed } from "@/lib/news/mock";
import type { NewsFeed } from "@/lib/news/types";

type Status = "loading" | "ready" | "refreshing";

/**
 * Busca /api/news.json (RSS da Folha lido no servidor ou no build) e atualiza a
 * cada `pollMs`. Se o arquivo não estiver acessível, cai no feed simulado local.
 * `freshIds` marca as manchetes que chegaram desde a última atualização.
 */
export function useNewsFeed(pollMs = 5 * 60_000) {
  const [feed, setFeed] = useState<NewsFeed | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(new Set());
  const known = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    setStatus((s) => (s === "loading" ? s : "refreshing"));
    let next: NewsFeed;
    try {
      const res = await fetch(withBase("/api/news.json"), { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      next = (await res.json()) as NewsFeed;
    } catch {
      next = buildMockFeed(Date.now(), "Sem conexão com o servidor de notícias. Exibindo manchetes simuladas.");
    }
    const ids = new Set(next.items.map((i) => i.id));
    if (known.current) {
      const previous = known.current;
      setFreshIds(new Set([...ids].filter((id) => !previous.has(id))));
    }
    known.current = ids;
    setFeed(next);
    setStatus("ready");
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { feed, status, freshIds, refresh: load };
}
