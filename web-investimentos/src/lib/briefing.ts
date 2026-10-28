import { compactMoney, fmt, indexValue } from "./format";
import type { MarketSnapshot, Quote } from "./market/types";
import { SOURCE_BY_ID } from "./news/sources";
import type { NewsFeed, NewsItem } from "./news/types";

export type BriefingTheme = "macro" | "b3" | "us" | "crypto";

export interface BriefingPoint {
  id: BriefingTheme;
  title: string;
  text: string;
  tone: "up" | "down" | "neutral";
  /** Manchete mais relevante do tema (impacto alto primeiro, depois a mais recente). */
  headline?: { title: string; url: string; source: string; publishedAt: number };
}

const isOpen = (session: MarketSnapshot["session"], now: number) => session !== null && now >= session.start && now < session.end;
const abs = (v: number) => fmt.pct(Math.abs(v)).replace("+", "");

/** "sobe 0,52%" (pregão aberto) ou "fechou em alta de 0,52%" (fechado). */
function move(q: Quote, open: boolean): string {
  if (open) return `${q.changePct >= 0 ? "sobe" : "cai"} ${abs(q.changePct)}`;
  return `fechou em ${q.changePct >= 0 ? "alta" : "queda"} de ${abs(q.changePct)}`;
}

const extremes = (list: Quote[]) => {
  const live = list.filter((q) => !q.stale);
  const sorted = [...live].sort((a, b) => b.changePct - a.changePct);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
};

const IMPACT_RANK = { alto: 0, medio: 1, neutro: 2 } as const;

const CRYPTO_TITLE = /\b(bitcoin|btc|ethereum|ether|solana|cardano|xrp|ripple|tether|usdt|usdc|stablecoins?|cripto\w*|crypto\w*|blockchain|halving|defi|altcoins?|memecoins?|binance|coinbase)\b/i;
const isIntl = (i: NewsItem) => SOURCE_BY_ID.get(i.source.id)?.region === "intl";

/**
 * Notícia mais relevante do tema nas últimas 24 h: primeiro as que passam no
 * critério preferido do tema, depois impacto alto, depois a mais recente. Não
 * repete manchete já usada em outro tema.
 */
function topHeadline(
  feed: NewsFeed | null,
  now: number,
  used: Set<string>,
  match: (i: NewsItem) => boolean,
  prefer: (i: NewsItem) => boolean = () => true,
): BriefingPoint["headline"] {
  const best = (feed?.items ?? [])
    .filter((i) => !i.simulated && !used.has(i.url) && now - i.publishedAt < 86_400_000 && match(i))
    .sort(
      (a, b) =>
        Number(prefer(b)) - Number(prefer(a)) || IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact] || b.publishedAt - a.publishedAt,
    )[0];
  if (!best) return undefined;
  used.add(best.url);
  return { title: best.title, url: best.url, source: best.source.name, publishedAt: best.publishedAt };
}

/**
 * Resumo executivo "O que você perdeu", organizado por tema: Macroeconomia,
 * B3, Mercado Americano e Cripto. Números reais do snapshot + a manchete mais
 * relevante de cada tema. Regras simples, sem texto inventado.
 */
export function buildBriefing(market: MarketSnapshot, news: NewsFeed | null, now = Date.now()): BriefingPoint[] {
  const points: BriefingPoint[] = [];
  const used = new Set<string>();

  // Macroeconomia: juros (Selic), dólar e a decisão/indicador mais recente.
  const selic = market.macro.find((m) => m.label === "Selic Meta");
  const ipca = market.macro.find((m) => m.label === "IPCA 12m");
  const fx = market.fx;
  points.push({
    id: "macro",
    title: "Macroeconomia",
    tone: "neutral",
    text:
      `Selic em ${selic?.value ?? "—"}${ipca ? ` e IPCA de ${ipca.value} em 12 meses` : ""}. ` +
      `Dólar ${fx.changePct >= 0 ? "sobe" : "recua"} ${abs(fx.changePct)}, a ${fmt.brl(fx.price)}.`,
    headline: topHeadline(news, now, used, (i) => ["Copom", "Fed & BCs", "Inflação", "Política Fiscal", "Câmbio"].includes(i.category)),
  });

  const { best, worst } = extremes(market.stocks);
  points.push({
    id: "b3",
    title: "B3",
    tone: market.index.changePct >= 0 ? "up" : "down",
    text:
      `Ibovespa ${move(market.index, isOpen(market.session, now))}, a ${fmt.points(market.index.price)}.` +
      (best && worst ? ` Destaques: ${best.symbol} (${fmt.pct(best.changePct)}) e ${worst.symbol} (${fmt.pct(worst.changePct)}).` : ""),
    headline: topHeadline(news, now, used, (i) => i.filter === "acoes"),
  });

  const [spx, nasdaq] = market.global;
  const us = extremes(market.us);
  if (spx) {
    points.push({
      id: "us",
      title: "Mercado americano",
      tone: spx.changePct >= 0 ? "up" : "down",
      text:
        `S&P 500 ${move(spx, isOpen(market.usSession, now))}, a ${indexValue(spx.price)} pontos` +
        (nasdaq ? `; Nasdaq ${fmt.pct(nasdaq.changePct)}.` : ".") +
        (us.best ? ` Entre as Big Techs, ${us.best.name} lidera (${fmt.pct(us.best.changePct)}).` : ""),
      headline: topHeadline(news, now, used, (i) => i.filter === "global", isIntl),
    });
  }

  const coins = market.crypto.filter((q) => q.sector !== "Stablecoin");
  const btc = market.crypto.find((q) => q.symbol === "BTC");
  if (btc) {
    const c = extremes(coins.filter((q) => q.symbol !== "BTC"));
    const dom = market.cryptoGlobal?.btcDominance;
    const total = market.cryptoGlobal?.totalMarketCap;
    points.push({
      id: "crypto",
      title: "Cripto",
      tone: btc.changePct >= 0 ? "up" : "down",
      text:
        `Bitcoin ${btc.changePct >= 0 ? "sobe" : "cai"} ${abs(btc.changePct)} em 24 h, a ${fmt.brl(btc.price * fx.price)} (US$ ${indexValue(btc.price)}).` +
        (c.best ? ` Destaque: ${c.best.name} (${fmt.pct(c.best.changePct)}).` : "") +
        (dom != null ? ` Dominância do BTC em ${fmt.rate(dom, 1)}` : "") +
        (total != null ? `${dom != null ? "; " : " "}mercado total de ${compactMoney(total)}.` : dom != null ? "." : ""),
      headline: topHeadline(news, now, used, (i) => i.filter === "cripto", (i) => CRYPTO_TITLE.test(i.title)),
    });
  }

  return points;
}

/** Data de hoje em Brasília (AAAA-MM-DD): controla a abertura automática do resumo. */
export const brtDay = (ms = Date.now()) => new Date(ms - 3 * 3_600_000).toISOString().slice(0, 10);
