"use client";

import { useSyncExternalStore } from "react";
import { newsStore, type NewsState } from "@/lib/news/store";

/** Notícias de todos os veículos (um fetch compartilhado por toda a aplicação). */
export function useNewsFeed(): NewsState & { refresh: () => void } {
  const state = useSyncExternalStore(newsStore.subscribe, newsStore.getSnapshot, newsStore.getServerSnapshot);
  return { ...state, refresh: () => void newsStore.refresh() };
}
