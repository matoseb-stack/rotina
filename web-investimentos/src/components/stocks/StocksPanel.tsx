"use client";

import { memo } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { fmt } from "@/lib/format";
import { NEON, trendColor } from "@/lib/tabs";
import type { Quote } from "@/lib/market/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChangeChip } from "@/components/ui/ChangeChip";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { Sparkline } from "@/components/ui/Sparkline";

export function StocksPanel() {
  const index = useMarketData((s) => s.index);
  const blueChips = useMarketData((s) => s.blueChips);
  return (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
      <IndexBanner quote={index} />
      {blueChips.map((q) => (
        <StockCard key={q.symbol} quote={q} />
      ))}
    </div>
  );
}

const IndexBanner = memo(function IndexBanner({ quote }: { quote: Quote }) {
  return (
    <GlassCard accent={NEON.lime} className="md:col-span-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] tracking-[0.25em] text-zinc-400">IBOVESPA</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <PriceTicker value={quote.price} format={fmt.points} className="text-3xl font-semibold tracking-tight sm:text-4xl" />
            <ChangeChip value={quote.changePct} />
          </div>
          <p className="tnum mt-1 text-xs text-zinc-500">Fech. anterior {fmt.points(quote.previousClose)}</p>
        </div>
        <Sparkline data={quote.history} color={trendColor(quote.changePct)} height={64} className="w-full sm:w-1/2" />
      </div>
    </GlassCard>
  );
});

const StockCard = memo(function StockCard({ quote }: { quote: Quote }) {
  const color = trendColor(quote.changePct);
  return (
    <GlassCard accent={NEON.lime}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold">{quote.symbol}</h3>
          <p className="truncate text-xs text-zinc-500">
            {quote.name} · {quote.sector}
          </p>
        </div>
        <ChangeChip value={quote.changePct} />
      </div>

      <PriceTicker value={quote.price} format={fmt.brl} className="mt-5 text-4xl font-semibold tracking-tight" />
      <p className="tnum text-xs text-zinc-500">Fech. anterior {fmt.brl(quote.previousClose)}</p>

      <Sparkline data={quote.history} color={color} height={72} className="mt-4" />

      <div className="hairline my-4" />
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <Stat label="Mínima" value={fmt.brl(quote.dayLow)} />
        <Stat label="Máxima" value={fmt.brl(quote.dayHigh)} />
        <Stat label="Variação" value={fmt.brl(quote.change)} color={color} />
      </dl>
    </GlassCard>
  );
});

export function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">{label}</dt>
      <dd className="tnum mt-1 truncate text-zinc-300" style={color ? { color } : undefined}>
        {value}
      </dd>
    </div>
  );
}
