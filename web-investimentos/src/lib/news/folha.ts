import "server-only";
import { classify, executiveSummary } from "./classify";
import { FOLHA_MERCADO_URL, type NewsItem } from "./types";

export const FOLHA_MERCADO_RSS = "https://feeds.folha.uol.com.br/mercado/rss091.xml";
const FOLHA_SOURCE = { name: "Folha de S.Paulo · Mercado", kind: "folha" } as const;

const NAMED_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

const stripTags = (html: string) => html.replace(/<\/?(p|br|div|li)[^>]*>/gi, " ").replace(/<[^>]*>/g, "");
const squash = (text: string) => text.replace(/\s+/g, " ").replace(/\s+([,.;:!?)])/g, "$1").trim();

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return "";
  return m[1].replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1");
}

/**
 * Os links do RSS passam por um redirecionador ("...rss091/*https://www1.folha...").
 * Extrai o destino e só aceita domínios da Folha; qualquer outra coisa vira a capa de Mercado.
 */
function resolveLink(raw: string): string {
  const target = raw.includes("*") ? raw.slice(raw.indexOf("*") + 1) : raw;
  try {
    const url = new URL(target.trim());
    const okHost = url.hostname === "folha.com.br" || url.hostname.endsWith(".folha.com.br") || url.hostname.endsWith(".folha.uol.com.br");
    return url.protocol === "https:" && okHost ? url.toString() : FOLHA_MERCADO_URL;
  } catch {
    return FOLHA_MERCADO_URL;
  }
}

function parseDate(pubDate: string, description: string): number {
  const parsed = Date.parse(pubDate);
  if (Number.isFinite(parsed)) return parsed;
  // Fallback: "(10/27/2026 - 14h54)" no fim da descrição, horário de Brasília.
  const m = description.match(/\((\d{2})\/(\d{2})\/(\d{4}) - (\d{2})h(\d{2})\)/);
  if (m) return Date.parse(`${m[3]}-${m[1]}-${m[2]}T${m[4]}:${m[5]}:00-03:00`);
  return Date.now();
}

function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function parseFolhaRss(xml: string, limit = 60): NewsItem[] {
  const items: NewsItem[] = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const title = squash(decodeEntities(stripTags(decodeEntities(tag(block, "title")))));
    if (!title) continue;
    const rawDescription = decodeEntities(tag(block, "description"));
    const excerpt = squash(
      decodeEntities(stripTags(rawDescription.replace(/<a[^>]*>\s*Leia mais\s*<\/a>/i, "")))
        .replace(/\(\d{2}\/\d{2}\/\d{4} - \d{2}h\d{2}\)\s*$/, ""),
    );
    const url = resolveLink(decodeEntities(tag(block, "link")));
    const author = squash(decodeEntities(tag(block, "author"))) || undefined;
    items.push({
      id: hash(url + title),
      title,
      summary: executiveSummary(excerpt || title),
      excerpt,
      url,
      author,
      publishedAt: parseDate(tag(block, "pubDate"), rawDescription),
      source: FOLHA_SOURCE,
      ...classify(title, excerpt),
    });
    if (items.length >= limit) break;
  }
  return items.sort((a, b) => b.publishedAt - a.publishedAt);
}

export async function fetchFolhaMercado(): Promise<NewsItem[]> {
  const res = await fetch(FOLHA_MERCADO_RSS, {
    headers: { "User-Agent": "NeonInvestWire/1.0 (+leitor de RSS)", Accept: "application/rss+xml, text/xml" },
    signal: AbortSignal.timeout(8_000),
    next: { revalidate: 120 },
  });
  if (!res.ok) throw new Error(`Folha RSS respondeu ${res.status}`);
  // O feed da Folha é ISO-8859-1; decodifica pelo charset declarado.
  const buffer = await res.arrayBuffer();
  const head = new TextDecoder("latin1").decode(buffer.slice(0, 200));
  const charset = head.match(/encoding="([^"]+)"/i)?.[1] ?? "utf-8";
  const xml = new TextDecoder(charset).decode(buffer);
  const items = parseFolhaRss(xml);
  if (items.length === 0) throw new Error("Folha RSS sem itens");
  return items;
}
