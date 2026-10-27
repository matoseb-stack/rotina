"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useMemo } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { fmt } from "@/lib/format";
import { NEON } from "@/lib/tabs";
import type { Quote } from "@/lib/market/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { PriceTicker } from "@/components/ui/PriceTicker";

const RANK_SIZE = 6;
const SHUFFLE = { type: "spring", stiffness: 520, damping: 40, mass: 0.9 } as const;

export function MoversPanel() {
  const stocks = useMarketData((s) => s.stocks);

  const { gainers, losers, advancers, scale } = useMemo(() => {
    const sorted = [...stocks].sort((a, b) => b.changePct - a.changePct);
    return {
      gainers: sorted.filter((q) => q.changePct >= 0).slice(0, RANK_SIZE),
      losers: sorted.filter((q) => q.changePct < 0).reverse().slice(0, RANK_SIZE),
      advancers: stocks.filter((q) => q.changePct >= 0).length,
      scale: Math.max(0.5, ...stocks.map((q) => Math.abs(q.changePct))),
    };
  }, [stocks]);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <BreadthBar advancers={advancers} total={stocks.length} />
      <LayoutGroup>
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          <MoversList title="Maiores altas" accent={NEON.lime} items={gainers} scale={scale} />
          <MoversList title="Maiores baixas" accent={NEON.red} items={losers} scale={scale} />
        </div>
      </LayoutGroup>
    </div>
  );
}

function BreadthBar({ advancers, total }: { advancers: number; total: number }) {
  const ratio = total ? (advancers / total) * 100 : 50;
  return (
    <GlassCard accent={NEON.cyan} className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] tracking-[0.25em] text-zinc-400">AMPLITUDE DO MERCADO</p>
        <p className="tnum text-xs">
          <span className="text-neon-lime">{advancers} altas</span>
          <span className="text-zinc-600"> · </span>
          <span className="text-neon-red">{total - advancers} baixas</span>
        </p>
      </div>
      <div className="mt-3 flex h-1.5 gap-1 overflow-hidden rounded-full">
        <div className="rounded-full bg-neon-lime transition-[width] duration-700 ease-out" style={{ width: `${ratio}%` }} />
        <div className="flex-1 rounded-full bg-neon-red" />
      </div>
    </GlassCard>
  );
}

function MoversList({ title, accent, items, scale }: { title: string; accent: string; items: Quote[]; scale: number }) {
  return (
    <GlassCard accent={accent} className="min-h-[24rem]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-[11px] tracking-[0.25em] uppercase" style={{ color: accent }}>
          {title}
        </h3>
        <span className="text-xs text-zinc-500">{items.length} ativos</span>
      </div>
      {items.length === 0 && <p className="text-sm text-zinc-500">Nenhum ativo deste lado agora.</p>}
      <ol className="relative">
        <AnimatePresence initial={false}>
          {items.map((q, i) => (
            // layout="position": quando a hierarquia muda, a linha desliza até o novo lugar.
            <motion.li
              key={q.symbol}
              layout="position"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={SHUFFLE}
              className="border-b border-white/[0.05] py-3 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="tnum w-7 font-mono text-xs" style={{ color: accent }}>
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{q.symbol}</p>
                  <p className="truncate text-xs text-zinc-500">{q.name}</p>
                </div>
                <div className="text-right">
                  <PriceTicker value={q.price} format={fmt.brl} className="text-[15px] font-semibold" />
                  <p className="tnum text-xs font-semibold" style={{ color: accent }}>
                    {fmt.pct(q.changePct)}
                  </p>
                </div>
              </div>
              <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.min(100, (Math.abs(q.changePct) / scale) * 100)}%`, background: accent, boxShadow: `0 0 8px ${accent}` }}
                />
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </GlassCard>
  );
}
