"use client";

import { memo } from "react";
import { fmt, signedBrl } from "@/lib/format";
import type { Quote } from "@/lib/market/types";
import { cn } from "@/lib/utils";
import { ChangeChip } from "@/components/ui/ChangeChip";
import { LivePrice, TickDot } from "@/components/ui/LivePrice";
import { StockLogo } from "@/components/ui/StockLogo";

interface StockCardProps {
  quote: Quote;
  onOpen: (symbol: string) => void;
}

/** Card mínimo: logo, ticker, preço, variação e o ponto do tick de 1 s. */
export const StockCard = memo(function StockCard({ quote, onOpen }: StockCardProps) {
  const up = quote.changePct >= 0;
  const h = quote.history;
  const lastMoveUp = h.length < 2 || h[h.length - 1] >= h[h.length - 2];
  return (
    <button
      type="button"
      onClick={() => onOpen(quote.symbol)}
      aria-label={`${quote.symbol}, ${quote.name}: ${fmt.brl(quote.price)}, ${fmt.pct(quote.changePct)}. Abrir detalhes.`}
      className="card group relative flex flex-col gap-3 overflow-hidden p-3.5 text-left transition-[box-shadow,border-color,transform] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:translate-y-0 sm:p-4"
    >
      {/* Indicador discreto de tendência no dia. */}
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-[3px]", up ? "bg-up" : "bg-down")} />

      <div className="flex items-center gap-2.5">
        <StockLogo symbol={quote.symbol} name={quote.name} brandColor={quote.brandColor} size={34} />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-tight font-semibold">{quote.symbol}</p>
          <p className="truncate text-xs text-muted">{quote.name}</p>
        </div>
        <TickDot tick={quote.price} up={lastMoveUp} className="self-start" />
      </div>

      <div>
        <LivePrice value={quote.price} format={fmt.brl} className="text-lg font-semibold tracking-tight sm:text-xl" />
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <ChangeChip value={quote.changePct} />
          <span className={cn("tnum hidden text-xs sm:inline", up ? "text-up" : "text-down")}>{signedBrl(quote.change)}</span>
        </div>
      </div>
    </button>
  );
});
