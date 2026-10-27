import { withBase } from "../base-path";
import { createExternalStore } from "../external-store";
import { buildMockFeed } from "./mock";
import type { NewsFeed } from "./types";

export interface NewsState {
  status: "loading" | "ready" | "refreshing";
  feed: NewsFeed | null;
}

/**
 * Central de notícias compartilhada: um único fetch alimenta a faixa de
 * última hora, o resumo do dia e a aba de notícias. Recarrega a cada 5 min
 * (só com a aba visível).
 */
function createNewsStore(pollMs = 5 * 60_000) {
  let timer: ReturnType<typeof setInterval> | null = null;
  const load = async () => {
    const current = store.get();
    if (current.feed) store.set({ ...current, status: "refreshing" });
    let feed: NewsFeed;
    try {
      const res = await fetch(withBase("/api/news.json"), { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      feed = (await res.json()) as NewsFeed;
    } catch {
      feed = current.feed ?? buildMockFeed(Date.now(), "Sem conexão com a central de notícias. Exibindo manchetes simuladas.");
    }
    store.set({ status: "ready", feed });
  };
  const store = createExternalStore<NewsState>(
    { status: "loading", feed: null },
    () => {
      void load();
      timer = setInterval(() => document.visibilityState === "visible" && void load(), pollMs);
    },
    () => {
      if (timer) clearInterval(timer);
      timer = null;
    },
  );
  const serverSnapshot: NewsState = { status: "loading", feed: null };
  return { subscribe: store.subscribe, getSnapshot: store.get, getServerSnapshot: () => serverSnapshot, refresh: load };
}

export const newsStore = createNewsStore();
