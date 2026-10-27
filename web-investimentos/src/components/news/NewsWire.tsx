"use client";

import { AnimatePresence } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { useNow } from "@/hooks/useNow";
import { fmt } from "@/lib/format";
import { NEWS_FILTERS, type NewsFilter } from "@/lib/news/types";
import { NEON } from "@/lib/tabs";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { NewsCard } from "./NewsCard";
import { NewsFilters } from "./NewsFilters";
import { NewsReaderModal } from "./NewsReaderModal";

/**
 * Financial Intelligence Wire: feed de manchetes em layout de terminal.
 * Fonte: RSS da Folha de S.Paulo (Mercado) via /api/news, com fallback simulado.
 */
export function NewsWire() {
  const { feed, status, freshIds, refresh } = useNewsFeed();
  const now = useNow();
  const [filter, setFilter] = useState<NewsFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo(() => feed?.items ?? [], [feed]);
  const counts = useMemo(() => {
    const c = Object.fromEntries(NEWS_FILTERS.map((f) => [f.id, 0])) as Record<NewsFilter, number>;
    c.all = items.length;
    for (const i of items) c[i.filter]++;
    return c;
  }, [items]);
  const visible = useMemo(() => (filter === "all" ? items : items.filter((i) => i.filter === filter)), [items, filter]);

  const openIndex = visible.findIndex((i) => i.id === openId);
  const close = useCallback(() => setOpenId(null), []);
  const prev = useCallback(() => {
    if (openIndex > 0) setOpenId(visible[openIndex - 1].id);
  }, [openIndex, visible]);
  const next = useCallback(() => {
    if (openIndex >= 0 && openIndex < visible.length - 1) setOpenId(visible[openIndex + 1].id);
  }, [openIndex, visible]);

  const live = feed?.source === "folha";

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <GlassCard accent={NEON.pink} className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold tracking-[0.22em] text-neon-pink text-glow sm:tracking-[0.3em]">
              <span className="hidden sm:inline">FINANCIAL </span>INTELLIGENCE WIRE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LiveBadge label={live ? "LIVE" : "SIMULADO"} color={live ? NEON.pink : "#FCD34D"} />
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Atualizar notícias"
            >
              <Icon name="refresh" className={cn("size-4", status === "refreshing" && "animate-spin")} />
            </button>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-3.5 font-mono text-[11px] sm:grid-cols-4">
          <WireStat label="FONTE" value={live ? "Folha de S.Paulo · Mercado" : "Feed simulado"} />
          <WireStat label="MANCHETES" value={String(items.length)} />
          <WireStat label="ALTO IMPACTO" value={String(items.filter((i) => i.impact === "alto").length)} />
          <WireStat label="SYNC" value={feed ? fmt.clock(feed.fetchedAt) : "--:--:--"} />
        </dl>
        {items[0] && (
          <p className="truncate border-t border-white/[0.06] px-5 py-2.5 font-mono text-[11px] text-zinc-400">
            <span className="text-neon-pink">ÚLTIMA ▸ </span>
            {fmt.hour(items[0].publishedAt)} — {items[0].title}
          </p>
        )}
      </GlassCard>

      {feed?.notice && (
        <p className="rounded-xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-2.5 text-xs text-amber-200">{feed.notice}</p>
      )}

      <NewsFilters value={filter} onChange={setFilter} counts={counts} />

      {status === "loading" ? (
        <ul className="grid gap-3 lg:grid-cols-2" aria-busy>
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="glass h-36 animate-pulse rounded-2xl" />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">Nenhuma manchete nesta categoria agora.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((item) => (
              <NewsCard key={item.id} item={item} now={now} fresh={freshIds.has(item.id)} onOpen={setOpenId} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <NewsReaderModal
        item={openIndex >= 0 ? visible[openIndex] : null}
        position={{ index: Math.max(openIndex, 0), total: visible.length }}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    </div>
  );
}

function WireStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="tracking-[0.2em] text-zinc-500">{label}</dt>
      <dd className="tnum mt-0.5 truncate text-zinc-200">{value}</dd>
    </div>
  );
}
