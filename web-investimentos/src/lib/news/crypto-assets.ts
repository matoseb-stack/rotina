import "server-only";
import { DETAIL_SEEDS } from "../market/seeds";
import { assetMoreUrl } from "./company-sources";
import { NEWS_REVALIDATE } from "./aggregate";
import { clean, fetchFeed, firstSentence, hash, resolveLink, stripSourceSuffix, type RawFeedItem } from "./rss";
import { NEWS_SOURCES } from "./sources";
import type { AssetNewsFeed, AssetNewsItem } from "./types";

const CRYPTO_SOURCES = NEWS_SOURCES.filter((s) => s.crypto);
export const CRYPTO_SOURCE_LABEL = CRYPTO_SOURCES.map((s) => s.name).join(", ");

const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Notícias sobre um criptoativo: os portais especializados (CoinDesk,
 * Cointelegraph Brasil, CriptoFácil) filtrados pelos nomes da moeda. Com poucas
 * manchetes, completa com a busca do Google News na imprensa cripto global.
 */
export async function fetchCryptoAssetNews(symbol: string, limit = 8): Promise<AssetNewsFeed> {
  const seed = DETAIL_SEEDS.find((s) => s.symbol === symbol);
  const keywords = (seed?.newsKeywords ?? [symbol.toLowerCase()]).map(normalize);
  const pattern = new RegExp(`\\b(${keywords.join("|")})\\b`);
  const base = {
    symbol,
    sourceLabel: CRYPTO_SOURCE_LABEL,
    lang: "pt" as const,
    moreUrl: assetMoreUrl(symbol, "crypto", seed?.name),
    moreLabel: "Mais notícias na Cointelegraph Brasil",
    fetchedAt: Date.now(),
  };

  const items: AssetNewsItem[] = [];
  const seen = new Set<string>();
  const push = (it: RawFeedItem, url: string | null, source: string) => {
    if (!url || seen.has(url)) return;
    const body = clean(it.description).replace(/\s*The post [\s\S]*$/, "");
    if (!pattern.test(normalize(`${it.title} ${body}`))) return;
    seen.add(url);
    const title = stripSourceSuffix(it.title, it.sourceName);
    items.push({ id: hash(url), title, summary: body.startsWith(title) ? "" : firstSentence(body, 160), url, publishedAt: it.published, source });
  };

  await Promise.all(
    CRYPTO_SOURCES.map(async (src) => {
      for (const feed of src.feeds) {
        try {
          for (const it of await fetchFeed(feed, NEWS_REVALIDATE)) push(it, resolveLink(it.link, [src.domain]), src.name);
        } catch (error) {
          console.warn(`[crypto-news] ${src.id}:`, error instanceof Error ? error.message : error);
        }
      }
    }),
  );

  if (items.length < 3 && seed) {
    const sites = ["coindesk.com", "cointelegraph.com", "theblock.co", "decrypt.co", "reuters.com", "bloomberg.com"].map((d) => `site:${d}`).join(" OR ");
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${seed.name}" (${sites}) when:7d`)}&hl=en-US&gl=US&ceid=US:en`;
    try {
      for (const it of await fetchFeed(url, NEWS_REVALIDATE)) {
        if (it.link.startsWith("https://news.google.com/")) push(it, it.link, it.sourceName ?? "Google News");
      }
    } catch (error) {
      console.warn("[crypto-news] google:", error instanceof Error ? error.message : error);
    }
  }

  items.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  return { ...base, items: items.slice(0, limit) };
}
