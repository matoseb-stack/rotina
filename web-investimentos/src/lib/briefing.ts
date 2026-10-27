import { fmt, indexValue } from "./format";
import type { MarketSnapshot, Quote } from "./market/types";
import type { NewsFeed, NewsItem } from "./news/types";

export interface BriefingPoint {
  id: "b3" | "us" | "fx" | "policy";
  title: string;
  text: string;
  tone: "up" | "down" | "neutral";
  link?: { url: string; label: string };
}

const isOpen = (session: MarketSnapshot["session"], now: number) => session !== null && now >= session.start && now < session.end;

/** "sobe 0,52%" (pregão aberto) ou "fechou em alta de 0,52%" (fechado). */
function move(q: Quote, open: boolean): string {
  const pct = fmt.pct(Math.abs(q.changePct)).replace("+", "");
  if (open) return `${q.changePct >= 0 ? "sobe" : "cai"} ${pct}`;
  return `fechou em ${q.changePct >= 0 ? "alta" : "queda"} de ${pct}`;
}

const extremes = (list: Quote[]) => {
  const live = list.filter((q) => !q.stale);
  const sorted = [...live].sort((a, b) => b.changePct - a.changePct);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
};

/** Última manchete sobre Copom/Selic/Fed (prioriza alto impacto). */
function policyHeadline(feed: NewsFeed | null): NewsItem | undefined {
  const policy = (feed?.items ?? []).filter((i) => !i.simulated && (i.category === "Copom" || i.category === "Fed & BCs"));
  return policy.find((i) => i.impact === "alto") ?? policy[0];
}

/**
 * Resumo executivo "O que você perdeu": 4 tópicos montados com os números
 * reais do snapshot (B3, Wall Street, dólar) e a manchete mais recente de
 * política monetária. Regras simples, sem texto inventado.
 */
export function buildBriefing(market: MarketSnapshot, news: NewsFeed | null, now = Date.now()): BriefingPoint[] {
  const points: BriefingPoint[] = [];
  const b3Open = isOpen(market.session, now);
  const usOpen = isOpen(market.usSession, now);

  const { best, worst } = extremes(market.stocks);
  points.push({
    id: "b3",
    title: "B3",
    tone: market.index.changePct >= 0 ? "up" : "down",
    text:
      `Ibovespa ${move(market.index, b3Open)}, a ${fmt.points(market.index.price)}.` +
      (best && worst ? ` Destaques: ${best.symbol} (${fmt.pct(best.changePct)}) e ${worst.symbol} (${fmt.pct(worst.changePct)}).` : ""),
  });

  const [spx, nasdaq] = market.global;
  const us = extremes(market.us);
  if (spx) {
    points.push({
      id: "us",
      title: "Wall Street",
      tone: spx.changePct >= 0 ? "up" : "down",
      text:
        `S&P 500 ${move(spx, usOpen)}, a ${indexValue(spx.price)} pontos` +
        (nasdaq ? `; Nasdaq ${fmt.pct(nasdaq.changePct)}.` : ".") +
        (us.best ? ` Entre as Big Techs, ${us.best.name} lidera (${fmt.pct(us.best.changePct)}).` : ""),
    });
  }

  const fx = market.fx;
  points.push({
    id: "fx",
    title: "Dólar",
    tone: fx.changePct >= 0 ? "down" : "up",
    text: `Dólar comercial ${fx.changePct >= 0 ? "sobe" : "recua"} ${fmt.pct(Math.abs(fx.changePct)).replace("+", "")} e vale ${fmt.brl(fx.price)}.`,
  });

  const selic = market.macro.find((m) => m.label === "Selic Meta");
  const headline = policyHeadline(news);
  points.push({
    id: "policy",
    title: "Juros",
    tone: "neutral",
    text: headline
      ? `${headline.title} (${headline.source.name}).${selic ? ` Selic em ${selic.value}.` : ""}`
      : `Selic em ${selic?.value ?? "—"}, segundo o Banco Central. Sem novidades de Copom ou Fed no noticiário recente.`,
    link: headline ? { url: headline.url, label: `Ler matéria (${headline.source.name})` } : undefined,
  });

  return points;
}

/** Data de hoje em Brasília (AAAA-MM-DD): controla a abertura automática do resumo. */
export const brtDay = (ms = Date.now()) => new Date(ms - 3 * 3_600_000).toISOString().slice(0, 10);
