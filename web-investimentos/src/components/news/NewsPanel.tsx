"use client";

import { useMemo, useState } from "react";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { useNow } from "@/hooks/useNow";
import { fmt } from "@/lib/format";
import { CATEGORY_COLORS, FOLHA_MERCADO_URL, type NewsFilter, type NewsItem } from "@/lib/news/types";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

const FILTERS: { id: NewsFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "macro", label: "Macro" },
  { id: "cambio", label: "Câmbio" },
  { id: "tesouro", label: "Tesouro" },
  { id: "acoes", label: "Ações" },
];

/** Notícias gerais do mercado (Folha de S.Paulo · Mercado), com filtros por categoria. */
export function NewsPanel() {
  const { feed, status, refresh } = useNewsFeed();
  const now = useNow();
  const [filter, setFilter] = useState<NewsFilter>("all");

  const items = useMemo(() => feed?.items ?? [], [feed]);
  const counts = useMemo(() => {
    const c: Record<NewsFilter, number> = { all: items.length, macro: 0, cambio: 0, tesouro: 0, acoes: 0 };
    for (const i of items) c[i.filter]++;
    return c;
  }, [items]);
  const visible = filter === "all" ? items : items.filter((i) => i.filter === filter);
  const live = feed?.source === "folha";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Filtrar por categoria" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.id ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted hover:text-fg",
              )}
            >
              {f.label} <span className="tnum ml-0.5 text-xs opacity-70">{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{live ? "Folha de S.Paulo · Mercado" : "Feed simulado"}</span>
          {feed && <span className="tnum">· {fmt.hour(feed.fetchedAt)}</span>}
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md p-1.5 hover:bg-surface-2 hover:text-fg"
            aria-label="Atualizar notícias"
          >
            <Icon name="refresh" className={cn("size-4", status === "refreshing" && "animate-spin")} />
          </button>
        </div>
      </div>

      {feed?.notice && (
        <p className="rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm text-muted">{feed.notice}</p>
      )}

      <div className="card overflow-hidden">
        {status === "loading" ? (
          <ul aria-busy className="divide-y divide-line">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="space-y-2 p-4 sm:p-5">
                <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">Nenhuma notícia nesta categoria agora.</p>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((item) => (
              <NewsRow key={item.id} item={item} now={now} />
            ))}
          </ul>
        )}
      </div>

      <a
        href={FOLHA_MERCADO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-accent hover:underline"
      >
        Ver todas as notícias de Mercado na Folha <Icon name="external" className="size-3.5" />
      </a>
    </div>
  );
}

function NewsRow({ item, now }: { item: NewsItem; now: number }) {
  const color = CATEGORY_COLORS[item.category];
  const folha = item.source.kind === "folha";
  return (
    <li>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex gap-4 p-4 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none sm:p-5"
      >
        <div className="hidden w-14 shrink-0 sm:block">
          <time dateTime={new Date(item.publishedAt).toISOString()} className="tnum text-sm font-medium">
            {fmt.hour(item.publishedAt)}
          </time>
          <p className="text-xs text-subtle">{fmt.relative(item.publishedAt, now)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded px-1.5 py-0.5 font-medium" style={{ color, background: `${color}1a` }}>
              {item.category}
            </span>
            <span className="tnum text-subtle sm:hidden">
              {fmt.hour(item.publishedAt)} · {fmt.relative(item.publishedAt, now)}
            </span>
            {!folha && <span className="rounded border border-dashed border-line-strong px-1.5 py-0.5 text-muted">Simulado</span>}
          </div>
          <h3 className="mt-1.5 text-[15px] leading-snug font-semibold group-hover:text-accent sm:text-base">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{item.summary}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-subtle">
            {folha ? "Folha de S.Paulo" : "Abrir Folha · Mercado"} <Icon name="external" className="size-3" />
          </span>
        </div>
      </a>
    </li>
  );
}
