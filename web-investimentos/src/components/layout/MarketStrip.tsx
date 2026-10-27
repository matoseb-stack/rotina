"use client";

import { memo } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { fmt, indexValue } from "@/lib/format";
import type { Quote } from "@/lib/market/types";
import { ChangeChip } from "@/components/ui/ChangeChip";
import { LivePrice } from "@/components/ui/LivePrice";

/** Faixa compacta com Ibovespa, S&P 500, Nasdaq e dólar (cotações reais). */
export function MarketStrip() {
  const index = useMarketData((s) => s.index);
  const global = useMarketData((s) => s.global);
  const fx = useMarketData((s) => s.fx);
  const status = useMarketData((s) => s.status);
  if (status === "loading") return <div className="mb-5 h-12 animate-pulse rounded-xl bg-surface-2" />;
  return (
    <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
      <Tile label="Ibovespa" quote={index} format={fmt.points} />
      {global.map((q) => (
        <Tile key={q.symbol} label={q.name} quote={q} format={indexValue} />
      ))}
      <Tile label="Dólar" quote={fx} format={(v) => fmt.brl(v)} />
    </div>
  );
}

const Tile = memo(function Tile({ label, quote, format }: { label: string; quote: Quote; format: (v: number) => string }) {
  return (
    <div className="flex min-w-[9.5rem] shrink-0 items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2 shadow-card-sm">
      <div className="min-w-0">
        <p className="text-[11px] text-muted">{label}</p>
        <LivePrice value={quote.price} format={format} className="text-sm font-semibold" />
      </div>
      <ChangeChip value={quote.changePct} />
    </div>
  );
});
