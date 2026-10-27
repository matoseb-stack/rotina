import "server-only";
import { classify } from "./classify";
import { mapLimit } from "../market/real/yahoo";
import { buildMockFeed } from "./mock";
import { clean, fetchFeed, firstSentence, hash, resolveLink, stripSourceSuffix, type RawFeedItem } from "./rss";
import { NEWS_SOURCES, type NewsSourceDef } from "./sources";
import type { NewsFeed, NewsItem, NewsSourceStatus } from "./types";

export const NEWS_REVALIDATE = 900;
const PER_SOURCE = 25;
const MAX_AGE_MS = 4 * 86_400_000;

/** Converte itens crus do feed em notícias (link validado, sem itens velhos). */
function toItems(source: NewsSourceDef, raw: RawFeedItem[], via?: string): NewsItem[] {
  const now = Date.now();
  const items: NewsItem[] = [];
  for (const it of raw) {
    const url = via ? (it.link.startsWith("https://news.google.com/") ? it.link : null) : resolveLink(it.link, [source.domain]);
    const title = stripSourceSuffix(it.title, it.sourceName ?? source.name);
    if (!url || !title) continue;
    const published = it.published ?? now;
    if (now - published > MAX_AGE_MS) continue;
    // Folha: remove "Leia mais" e o carimbo "(10/27/2026 - 14h54)" do fim da descrição.
    const body = clean(it.description.replace(/<a[^>]*>\s*Leia mais\s*<\/a>/i, ""))
      .replace(/\(\d{2}\/\d{2}\/\d{4} - \d{2}h\d{2}\)\s*$/, "")
      // Rodapé padrão do WordPress (InfoMoney): "The post <título> appeared first on <site>."
      .replace(/\s*The post [\s\S]*$/, "");
    const summary = via || body.startsWith(title) ? "" : firstSentence(body);
    items.push({
      id: hash(url + title),
      title,
      summary,
      url,
      publishedAt: Math.min(published, now),
      source: { id: source.id, name: source.name },
      lang: source.lang,
      via,
      ...classify(title, body, source.region),
    });
  }
  return items.sort((a, b) => b.publishedAt - a.publishedAt).slice(0, PER_SOURCE);
}

/**
 * Lê os feeds oficiais do veículo. Se não sobrar nenhuma notícia recente
 * (feed bloqueado, vazio ou desatualizado), tenta a busca do Google News (site:...).
 */
async function fetchSource(source: NewsSourceDef): Promise<NewsItem[]> {
  const raw: RawFeedItem[] = [];
  for (const url of source.feeds) {
    try {
      raw.push(...(await fetchFeed(url, NEWS_REVALIDATE)));
    } catch (error) {
      console.warn(`[news] ${source.id}:`, error instanceof Error ? error.message : error);
    }
  }
  const items = toItems(source, raw);
  if (items.length > 0 || !source.googleNews) return items;
  const fallback = (await fetchFeed(source.googleNews, NEWS_REVALIDATE)).filter(
    (it) => !it.sourceName || it.sourceName.toLowerCase().includes(source.name.toLowerCase()),
  );
  return toItems(source, fallback, "Google News");
}

const titleKey = (title: string) => title.toLowerCase().replace(/[^a-z0-9à-ú]+/g, " ").trim();

/** Central de notícias: todos os veículos, sem duplicatas, do mais recente para o mais antigo. */
export async function fetchAllNews(): Promise<NewsFeed> {
  const status: NewsSourceStatus[] = [];
  const results = await mapLimit(NEWS_SOURCES, 5, async (source) => {
    try {
      const items = await fetchSource(source);
      status.push({ id: source.id, name: source.name, ok: items.length > 0, count: items.length });
      return items;
    } catch (error) {
      console.warn(`[news] ${source.id} falhou:`, error instanceof Error ? error.message : error);
      status.push({ id: source.id, name: source.name, ok: false, count: 0 });
      return [];
    }
  });

  const seen = new Set<string>();
  const items = results
    .flat()
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .filter((it) => (seen.has(titleKey(it.title)) ? false : (seen.add(titleKey(it.title)), true)));

  if (items.length === 0) {
    return buildMockFeed(Date.now(), "Nenhum veículo respondeu agora. Exibindo manchetes simuladas.");
  }
  const order = new Map(NEWS_SOURCES.map((s, i) => [s.id, i]));
  status.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  const failed = status.filter((s) => !s.ok).map((s) => s.name);
  return {
    items,
    fetchedAt: Date.now(),
    sources: status,
    simulated: false,
    notice: failed.length ? `Sem resposta no momento: ${failed.join(", ")}.` : undefined,
  };
}
