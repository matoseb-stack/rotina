import "server-only";

/** Utilitários de RSS/Atom sem dependências: entidades, CDATA, charset e datas. */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

export const stripTags = (html: string) => html.replace(/<\/?(p|br|div|li)[^>]*>/gi, " ").replace(/<[^>]*>/g, "");
export const squash = (text: string) => text.replace(/\s+/g, " ").replace(/\s+([,.;:!?)])/g, "$1").trim();
const unCdata = (text: string) => text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");

export function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Texto limpo de um trecho HTML/escapado. */
export const clean = (html: string) => squash(decodeEntities(stripTags(decodeEntities(unCdata(html)))));

/**
 * Alguns feeds passam o link por um redirecionador ("...rss091/*https://www1.folha...").
 * Extrai o destino e só aceita https nos domínios permitidos.
 */
export function resolveLink(raw: string, allowedDomains: string[]): string | null {
  const target = raw.includes("/*http") ? raw.slice(raw.indexOf("/*http") + 2) : raw;
  try {
    const url = new URL(decodeEntities(target.trim()));
    const ok = allowedDomains.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`));
    return url.protocol === "https:" && ok ? url.toString() : null;
  } catch {
    return null;
  }
}

export interface RawFeedItem {
  title: string;
  link: string;
  description: string;
  published: number | null;
  /** <source> do Google News (veículo original). */
  sourceName?: string;
  author?: string;
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? unCdata(m[1]) : "";
}

/** RFC 822, ISO 8601 ou "2026-10-27 19:30:12" (assumido UTC, como no Investing.com). */
export function parseDate(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;
  const plain = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/);
  const parsed = Date.parse(plain ? `${plain[1]}T${plain[2]}Z` : text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseFeed(xml: string): RawFeedItem[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  return blocks.map((block) => {
    const atomLink = block.match(/<link[^>]*href="([^"]+)"/i)?.[1];
    return {
      title: clean(tag(block, "title")),
      link: (tag(block, "link") || atomLink || "").trim(),
      description: tag(block, "description") || tag(block, "summary") || tag(block, "content:encoded") || tag(block, "content"),
      published: parseDate(tag(block, "pubDate") || tag(block, "updated") || tag(block, "published") || tag(block, "dc:date")),
      sourceName: clean(tag(block, "source")) || undefined,
      author: clean(tag(block, "author") || tag(block, "dc:creator")) || undefined,
    };
  });
}

/** Baixa um feed respeitando o charset declarado (a Folha usa ISO-8859-1). */
export async function fetchFeed(url: string, revalidate: number): Promise<RawFeedItem[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PainelInvestimentos/1.0; +leitor de RSS)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(10_000),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`${new URL(url).hostname} respondeu ${res.status}`);
  const buffer = await res.arrayBuffer();
  const head = new TextDecoder("latin1").decode(buffer.slice(0, 200));
  const charset = head.match(/encoding="([^"]+)"/i)?.[1] ?? "utf-8";
  return parseFeed(new TextDecoder(charset).decode(buffer));
}

/** Primeira frase, limitada a ~180 caracteres. */
export function firstSentence(text: string, max = 180): string {
  const first = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  return first.length <= max ? first : `${first.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** Google News termina o título com " - Veículo": remove o sufixo. */
export const stripSourceSuffix = (title: string, source?: string) =>
  source && title.endsWith(` - ${source}`) ? title.slice(0, -(source.length + 3)) : title;
