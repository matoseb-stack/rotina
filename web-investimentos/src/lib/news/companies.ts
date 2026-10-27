import "server-only";
import { decodeEntities, hash, resolveLink, squash, stripTags } from "./folha";
import { COMPANY_SOURCES, companyMoreUrl } from "./company-sources";
import type { AssetNewsFeed, AssetNewsItem } from "./types";

const MONTHS: Record<string, string> = {
  jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06",
  jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12",
};

/** Datas da Folha: "2026-10-27 06:56:00" (tópicos) ou "27.out.2026 às 9h40" (busca), em BRT. */
function parseFolhaDate(raw: string): number | null {
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  if (iso) return Date.parse(`${iso[1]}T${iso[2]}:00-03:00`);
  const br = raw.match(/(\d{1,2})\.(\w{3})\.(\d{4})(?:\s+às\s+(\d{1,2})h(\d{2}))?/);
  if (br && MONTHS[br[2]]) {
    const time = br[4] ? `${br[4].padStart(2, "0")}:${br[5]}` : "12:00";
    return Date.parse(`${br[3]}-${MONTHS[br[2]]}-${br[1].padStart(2, "0")}T${time}:00-03:00`);
  }
  return null;
}

const clean = (html: string) => squash(decodeEntities(stripTags(html)));


/**
 * Lê blocos "c-headline" (padrão das páginas de tópico e de busca da Folha):
 * <a href> → <h2 c-headline__title> → <p c-headline__standfirst> → <time datetime>.
 */
export function parseFolhaHeadlines(html: string): AssetNewsItem[] {
  const items: AssetNewsItem[] = [];
  const parts = html.split('class="c-headline__title"');
  for (let i = 1; i < parts.length; i++) {
    const before = parts[i - 1].slice(-1200);
    const href = [...before.matchAll(/<a\s+href="([^"]+)"/g)].pop()?.[1];
    const body = parts[i];
    const title = clean(body.slice(body.indexOf(">") + 1, body.indexOf("</h2>")));
    if (!href || !title) continue;
    const standfirst = body.match(/c-headline__standfirst">([\s\S]*?)<\/p>/)?.[1] ?? "";
    const datetime = body.match(/datetime="([^"]+)"/)?.[1] ?? "";
    const url = resolveLink(decodeEntities(href));
    items.push({
      id: hash(url),
      title,
      summary: clean(standfirst).replace(/\s*\.\.\.$/, "…"),
      url,
      publishedAt: parseFolhaDate(datetime),
    });
  }
  return items;
}

const stripAccents = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Casa nomes próprios sem acento, mas sensível a maiúsculas (evita "localiza" verbo, "Suzano" ok). */
function keywordPattern(keywords: string[]): RegExp {
  const escaped = keywords.map((k) => stripAccents(k).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`);
}

/** Mercado, Painel S.A., C-Level e a cobertura ao vivo de mercado. */
function isBusinessSection(url: string): boolean {
  const { hostname, pathname } = new URL(url);
  if (hostname === "c-level.folha.uol.com.br") return true;
  if (hostname === "aovivo.folha.uol.com.br") return pathname.startsWith("/mercado/");
  return pathname.startsWith("/mercado/") || pathname.startsWith("/colunas/painelsa/");
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "PainelInvestimentos/1.0 (+leitor de manchetes)", Accept: "text/html" },
    signal: AbortSignal.timeout(10_000),
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`Folha respondeu ${res.status}`);
  return res.text();
}

export async function fetchCompanyNews(symbol: string, limit = 8): Promise<AssetNewsFeed> {
  const source = COMPANY_SOURCES[symbol];
  const moreUrl = companyMoreUrl(symbol);
  const base = { symbol, moreUrl, fetchedAt: Date.now() };
  if (!source) return { ...base, items: [], error: "Ativo sem fonte de notícias configurada." };

  try {
    let items: AssetNewsItem[];
    if (source.topic) {
      items = parseFolhaHeadlines(await fetchHtml(moreUrl));
    } else {
      // A busca é ampla ("Suzano" também é cidade, "localiza" é verbo): só seções de negócios que citam a empresa,
      // com prioridade para quem a cita no título.
      const pattern = keywordPattern(source.keywords);
      items = parseFolhaHeadlines(await fetchHtml(moreUrl))
        .filter((it) => isBusinessSection(it.url) && !/patrocinad/i.test(it.title) && pattern.test(stripAccents(`${it.title} ${it.summary}`)))
        .sort((a, b) => Number(pattern.test(stripAccents(b.title))) - Number(pattern.test(stripAccents(a.title))));
    }
    const seen = new Set<string>();
    items = items
      .filter((it) => (seen.has(it.url) ? false : (seen.add(it.url), true)))
      .slice(0, limit)
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
    return { ...base, items };
  } catch (error) {
    return { ...base, items: [], error: error instanceof Error ? error.message : "Falha ao buscar notícias." };
  }
}
