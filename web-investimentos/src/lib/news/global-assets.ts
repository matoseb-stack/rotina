import "server-only";
import { DETAIL_SEEDS } from "../market/seeds";
import { assetMoreUrl } from "./company-sources";
import { fetchFeed, hash, stripSourceSuffix } from "./rss";
import type { AssetNewsFeed } from "./types";

/** Veículos de referência para ativos dos EUA (filtrados na busca do Google News). */
const GLOBAL_OUTLETS = ["reuters.com", "bloomberg.com", "cnbc.com", "wsj.com", "ft.com", "marketwatch.com", "barrons.com"];
export const GLOBAL_SOURCE_LABEL = "Reuters, Bloomberg, CNBC, WSJ, FT";

function queryFor(symbol: string): string {
  const seed = DETAIL_SEEDS.find((s) => s.symbol === symbol);
  return seed?.newsQuery ?? `${symbol} stock`;
}

export const globalMoreUrl = (symbol: string) => assetMoreUrl(symbol, "us", queryFor(symbol));

/**
 * Notícias sobre um ativo americano na imprensa financeira global, em inglês.
 * Links passam pelo Google News, que redireciona para a matéria original.
 */
export async function fetchGlobalAssetNews(symbol: string, limit = 8): Promise<AssetNewsFeed> {
  const base = {
    symbol,
    sourceLabel: GLOBAL_SOURCE_LABEL,
    lang: "en" as const,
    moreUrl: globalMoreUrl(symbol),
    moreLabel: "Mais notícias no Google News",
    fetchedAt: Date.now(),
  };
  const sites = GLOBAL_OUTLETS.map((d) => `site:${d}`).join(" OR ");
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${queryFor(symbol)} (${sites}) when:14d`)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const raw = await fetchFeed(url, 900);
    const items = raw
      .filter((it) => it.link.startsWith("https://news.google.com/") && it.title)
      .slice(0, limit)
      .map((it) => ({
        id: hash(it.link),
        title: stripSourceSuffix(it.title, it.sourceName),
        summary: "",
        url: it.link,
        publishedAt: it.published,
        source: it.sourceName,
      }));
    return { ...base, items };
  } catch (error) {
    return { ...base, items: [], error: error instanceof Error ? error.message : "Falha ao buscar notícias." };
  }
}
