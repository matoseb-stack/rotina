"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { useNow } from "@/hooks/useNow";
import { fmt } from "@/lib/format";
import type { NewsCategory, NewsItem } from "@/lib/news/types";
import { cn } from "@/lib/utils";
import { SourceSeal } from "@/components/news/SourceSeal";

const MACRO: NewsCategory[] = ["Copom", "Fed & BCs", "Inflação", "Política Fiscal", "Câmbio"];
const BREAKING_WINDOW_MS = 2 * 3_600_000;
const MAX_AGE_MS = 24 * 3_600_000;
/** Teto por tema, para nenhum assunto tomar a faixa inteira. */
const LIMITS = { macro: 6, cripto: 4, mercado: 4 } as const;

type Urgency = "breaking" | "macro" | "crypto" | "market";

/** BREAKING: alto impacto nas últimas 2 h. MACRO ALERT: juros, Fed, inflação, câmbio e fiscal. CRIPTO ALERT: cripto relevante. */
function urgencyOf(item: NewsItem, now: number): Urgency {
  if (item.impact === "alto" && now - item.publishedAt < BREAKING_WINDOW_MS) return "breaking";
  if (MACRO.includes(item.category)) return "macro";
  if (item.category === "Cripto") return "crypto";
  return "market";
}

const BADGE: Record<Urgency, { label: string; className: string }> = {
  breaking: { label: "BREAKING", className: "bg-breaking text-white" },
  macro: { label: "MACRO ALERT", className: "bg-warn-soft text-warn ring-1 ring-warn/30" },
  crypto: { label: "CRIPTO ALERT", className: "bg-[#ea580c1f] text-[#ea580c] ring-1 ring-[#ea580c4d] dark:text-[#fb923c]" },
  market: { label: "MERCADO", className: "bg-surface-2 text-muted" },
};

/** Seleciona as manchetes da faixa: alto impacto, macro e cripto relevante, das últimas 24 h, misturando os temas. */
function pickHeadlines(items: NewsItem[], now: number): NewsItem[] {
  const used = { macro: 0, cripto: 0, mercado: 0 };
  const picked: NewsItem[] = [];
  for (const item of items) {
    if (item.simulated || now - item.publishedAt > MAX_AGE_MS) continue;
    const macro = MACRO.includes(item.category);
    const crypto = item.category === "Cripto";
    const bucket = macro ? "macro" : crypto ? "cripto" : "mercado";
    const relevant = item.impact === "alto" || (macro && item.impact !== "neutro") || (crypto && item.impact !== "neutro");
    if (!relevant || used[bucket] >= LIMITS[bucket]) continue;
    used[bucket]++;
    picked.push(item);
  }
  return picked;
}

/**
 * Faixa de última hora no topo: anima só com transform (GPU), pausa no
 * hover/foco e vira rolagem manual com "reduzir movimento". O feed é
 * recarregado a cada 2 min; manchetes que chegam numa atualização ganham "NOVO".
 */
export function BreakingNewsBar() {
  const { feed, status } = useNewsFeed();
  const now = useNow(30_000);
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());

  const items = useMemo(() => (feed ? pickHeadlines(feed.items, Date.now()) : []), [feed]);

  // Marca como "NOVO" o que não estava na faixa da atualização anterior.
  useEffect(() => {
    if (!items.length) return;
    const ids = new Set(items.map((i) => i.id));
    if (seen.current) setFresh(new Set([...ids].filter((id) => !seen.current!.has(id))));
    seen.current = ids;
  }, [items]);

  const entries = items.map((item) => ({ item, urgency: urgencyOf(item, now), fresh: fresh.has(item.id) }));

  return (
    <div className="ticker relative z-40 flex h-9 items-stretch border-b border-line bg-ticker text-xs" aria-label="Notícias de última hora">
      <div className="flex shrink-0 items-center gap-2 border-r border-line bg-surface-2 px-3 font-semibold tracking-wide text-fg">
        <span className="relative inline-flex size-2" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-up opacity-70" />
          <span className="relative size-2 rounded-full bg-up" />
        </span>
        <span className="hidden sm:inline">LIVE FEED</span>
        <span className="sm:hidden">AO VIVO</span>
        {feed && (
          <span className="tnum hidden font-normal text-subtle lg:inline" title="Última atualização das manchetes">
            {status === "refreshing" ? "atualizando…" : fmt.relative(feed.fetchedAt, now)}
          </span>
        )}
      </div>
      {entries.length === 0 ? (
        <div className="flex items-center px-3 text-muted">{feed ? "Sem alertas de alto impacto agora." : "Carregando manchetes…"}</div>
      ) : (
        <div className="ticker-mask ticker-scroll no-scrollbar min-w-0 flex-1 overflow-hidden">
          {/* Duas cópias lado a lado: o trilho anda -50% e recomeça sem salto. */}
          <div className="ticker-track flex h-full w-max items-center" style={{ ["--ticker-duration" as string]: `${entries.length * 7}s` }}>
            <TickerItems entries={entries} />
            <TickerItems entries={entries} hidden />
          </div>
        </div>
      )}
    </div>
  );
}

const TickerItems = memo(function TickerItems({
  entries,
  hidden = false,
}: {
  entries: { item: NewsItem; urgency: Urgency; fresh: boolean }[];
  hidden?: boolean;
}) {
  return (
    <ul className="flex items-center" aria-hidden={hidden || undefined}>
      {entries.map(({ item, urgency, fresh }) => (
        <li key={item.id} className="flex items-center">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={hidden ? -1 : undefined}
            className="group flex items-center gap-2 px-4 whitespace-nowrap hover:text-accent"
          >
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide", BADGE[urgency].className)}>{BADGE[urgency].label}</span>
            {fresh && <span className="rounded bg-up px-1 py-px text-[9px] font-bold text-white dark:text-slate-900">NOVO</span>}
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
