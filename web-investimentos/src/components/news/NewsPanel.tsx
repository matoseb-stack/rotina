"use client";

import { memo, useMemo, useState } from "react";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { useNow } from "@/hooks/useNow";
import { fmt } from "@/lib/format";
import { NEWS_SOURCES, SOURCE_BY_ID } from "@/lib/news/sources";
import { CATEGORY_COLORS, NEWS_FILTERS, type NewsFilter, type NewsItem } from "@/lib/news/types";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { ImpactBadge } from "./ImpactBadge";
import { SourceSeal } from "./SourceSeal";

const PAGE = 30;

/**
 * Central de notícias multifontes: Valor, Folha, InfoMoney, Investing.com,
 * Estadão, Bloomberg, Reuters, CNBC, FT e WSJ. Filtros por tema e por veículo.
 */
export function NewsPanel() {
  const { feed, status, refresh } = useNewsFeed();
  const now = useNow();
  const [filter, setFilter] = useState<NewsFilter>("all");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const items = useMemo(() => feed?.items ?? [], [feed]);
  const bySource = useMemo(() => (sourceId ? items.filter((i) => i.source.id === sourceId) : items), [items, sourceId]);
  const counts = useMemo(() => {
    const c: Record<NewsFilter, number> = { all: bySource.length, macro: 0, acoes: 0, global: 0, rendafixa: 0 };
    for (const i of bySource) c[i.filter]++;
    return c;
  }, [bySource]);
  const sourceCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const i of items) if (filter === "all" || i.filter === filter) c.set(i.source.id, (c.get(i.source.id) ?? 0) + 1);
    return c;
  }, [items, filter]);
  const visible = filter === "all" ? bySource : bySource.filter((i) => i.filter === filter);
  const selectedSource = sourceId ? SOURCE_BY_ID.get(sourceId) : undefined;

  const pickFilter = (f: NewsFilter) => {
    setFilter(f);
    setLimit(PAGE);
  };
  const pickSource = (id: string | null) => {
    setSourceId((current) => (current === id ? null : id));
    setLimit(PAGE);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros por tema */}
      <div role="radiogroup" aria-label="Filtrar por tema" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {NEWS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={filter === f.id}
            onClick={() => pickFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.id ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted hover:text-fg",
            )}
          >
            {f.label} <span className="tnum ml-0.5 text-xs opacity-70">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {/* Filtro por veículo */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <Icon name="filter" className="size-3.5" /> Veículos
          </p>
          <div className="flex items-center gap-2 text-xs text-muted">
            {feed && <span className="tnum">Atualizado às {fmt.hour(feed.fetchedAt)}</span>}
            <button type="button" onClick={refresh} className="rounded-md p-1 hover:bg-surface-2 hover:text-fg" aria-label="Atualizar notícias">
              <Icon name="refresh" className={cn("size-4", status === "refreshing" && "animate-spin")} />
            </button>
          </div>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          {(["br", "intl"] as const).map((region) => (
            <div key={region} className="min-w-0 sm:flex-1">
              <p className="mb-1.5 text-[11px] font-medium tracking-wide text-subtle uppercase">{region === "br" ? "Brasil" : "Internacional"}</p>
              <div className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
                {NEWS_SOURCES.filter((s) => s.region === region).map((s) => {
                  const active = sourceId === s.id;
                  const count = sourceCounts.get(s.id) ?? 0;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => pickSource(s.id)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        active ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-fg",
                        count === 0 && !active && "opacity-50",
                      )}
                    >
                      <SourceSeal sourceId={s.id} size={14} />
                      {s.name}
                      <span className="tnum opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {selectedSource && (
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted">
            Exibindo só <strong className="font-medium text-fg">{selectedSource.name}</strong>
            <button type="button" onClick={() => pickSource(null)} className="text-accent hover:underline">
              ver todos os veículos
            </button>
            {selectedSource.note && <span className="w-full text-subtle sm:w-auto">· {selectedSource.note}</span>}
          </p>
        )}
      </div>

      {feed?.notice && <p className="rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm text-muted">{feed.notice}</p>}

      <div className="card overflow-hidden">
        {status === "loading" ? (
          <ul aria-busy className="divide-y divide-line">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="space-y-2 p-4 sm:p-5">
                <div className="h-3 w-40 animate-pulse rounded bg-surface-2" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">Nenhuma notícia com esses filtros agora.</p>
        ) : (
          <ul className="divide-y divide-line">
            {visible.slice(0, limit).map((item) => (
              <NewsCard key={item.id} item={item} now={now} />
            ))}
          </ul>
        )}
      </div>

      {visible.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="self-center rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-muted hover:text-fg"
        >
          Mostrar mais ({visible.length - limit} restantes)
        </button>
      )}
    </div>
  );
}

const NewsCard = memo(function NewsCard({ item, now }: { item: NewsItem; now: number }) {
  const color = CATEGORY_COLORS[item.category];
  return (
    <li>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex gap-3 p-4 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none sm:gap-4 sm:p-5"
      >
        <SourceSeal sourceId={item.source.id} size={28} className="mt-0.5 hidden rounded-md border border-line sm:block" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <SourceSeal sourceId={item.source.id} size={14} className="sm:hidden" />
            <span className="font-semibold text-fg">{item.simulated ? "Simulado" : item.source.name}</span>
            <time dateTime={new Date(item.publishedAt).toISOString()} className="tnum text-subtle" title={fmt.fullDate(item.publishedAt)}>
              {fmt.relative(item.publishedAt, now)}
            </time>
            <span className="rounded px-1.5 py-0.5 font-medium" style={{ color, background: `${color}1a` }}>
              {item.category}
            </span>
            <ImpactBadge impact={item.impact} />
            {item.lang === "en" && <span className="rounded bg-surface-2 px-1 py-px text-[10px] font-medium text-muted">EN</span>}
          </div>
          <h3 className="mt-1.5 text-[15px] leading-snug font-semibold group-hover:text-accent sm:text-base">{item.title}</h3>
          {item.summary && <p className="mt-1 line-clamp-2 text-sm text-muted">{item.summary}</p>}
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-subtle">
            {item.simulated ? "Conteúdo de demonstração" : `Ler matéria original · ${item.source.name}`}
            {item.via && ` · via ${item.via}`}
            <Icon name="external" className="size-3" />
          </span>
        </div>
      </a>
    </li>
  );
});
