"use client";

import { memo, useMemo } from "react";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { fmt } from "@/lib/format";
import type { NewsCategory, NewsItem } from "@/lib/news/types";
import { cn } from "@/lib/utils";
import { SourceSeal } from "@/components/news/SourceSeal";

const MACRO: NewsCategory[] = ["Copom", "Fed & BCs", "Inflação", "Política Fiscal"];
const BREAKING_WINDOW_MS = 2 * 3_600_000;
const MAX_ITEMS = 14;

type Urgency = "breaking" | "macro" | "market";

/** BREAKING: alto impacto nas últimas 2 h. MACRO ALERT: Copom/Fed/inflação/fiscal. */
function urgencyOf(item: NewsItem, now: number): Urgency {
  if (item.impact === "alto" && now - item.publishedAt < BREAKING_WINDOW_MS) return "breaking";
  if (MACRO.includes(item.category)) return "macro";
  return "market";
}

const BADGE: Record<Urgency, { label: string; className: string }> = {
  breaking: { label: "BREAKING", className: "bg-breaking text-white" },
  macro: { label: "MACRO ALERT", className: "bg-warn-soft text-warn ring-1 ring-warn/30" },
  market: { label: "MERCADO", className: "bg-surface-2 text-muted" },
};

/**
 * Faixa de última hora no topo: só manchetes de alto impacto ou macro, de
 * todos os veículos. Anima apenas com transform (GPU), pausa no hover/foco e
 * vira rolagem manual com "reduzir movimento". Re-renderiza só quando o
 * feed muda (a cada 5 min), nunca a cada tick de preço.
 */
export function BreakingNewsBar() {
  const { feed } = useNewsFeed();
  const items = useMemo(() => {
    if (!feed) return [];
    const now = Date.now();
    return feed.items
      .filter((i) => !i.simulated && (i.impact === "alto" || MACRO.includes(i.category)))
      .slice(0, MAX_ITEMS)
      .map((item) => ({ item, urgency: urgencyOf(item, now) }));
  }, [feed]);

  const hasBreaking = items.some((i) => i.urgency === "breaking");

  return (
    <div className="ticker relative z-40 flex h-9 items-stretch border-b border-line bg-ticker text-xs" aria-label="Notícias de última hora">
      <div className={cn("flex shrink-0 items-center gap-1.5 px-3 font-semibold tracking-wide", hasBreaking ? "bg-breaking text-white" : "bg-accent text-white dark:text-slate-900")}>
        <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-current" />
        <span className="hidden sm:inline">ÚLTIMA HORA</span>
        <span className="sm:hidden">AO VIVO</span>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center px-3 text-muted">{feed ? "Sem alertas de alto impacto agora." : "Carregando manchetes…"}</div>
      ) : (
        <div className="ticker-mask ticker-scroll no-scrollbar min-w-0 flex-1 overflow-hidden">
          {/* Duas cópias lado a lado: o trilho anda -50% e recomeça sem salto. */}
          <div className="ticker-track flex h-full w-max items-center" style={{ ["--ticker-duration" as string]: `${items.length * 7}s` }}>
            <TickerItems items={items} />
            <TickerItems items={items} hidden />
          </div>
        </div>
      )}
    </div>
  );
}

const TickerItems = memo(function TickerItems({
  items,
  hidden = false,
}: {
  items: { item: NewsItem; urgency: Urgency }[];
  hidden?: boolean;
}) {
  return (
    <ul className="flex items-center" aria-hidden={hidden || undefined}>
      {items.map(({ item, urgency }) => (
        <li key={item.id} className="flex items-center">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={hidden ? -1 : undefined}
            className="group flex items-center gap-2 px-4 whitespace-nowrap hover:text-accent"
          >
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide", BADGE[urgency].className)}>{BADGE[urgency].label}</span>
            <span className="tnum text-subtle">{fmt.hour(item.publishedAt)}</span>
            <SourceSeal sourceId={item.source.id} size={14} />
            <span className="font-medium text-fg group-hover:text-accent">{item.title}</span>
          </a>
          <span aria-hidden className="text-line-strong">|</span>
        </li>
      ))}
    </ul>
  );
});
