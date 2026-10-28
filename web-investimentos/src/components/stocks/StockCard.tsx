"use client";

import { memo } from "react";
import { fmt, priceFormatter, signedMoney } from "@/lib/format";
import type { Quote } from "@/lib/market/types";
import { cn } from "@/lib/utils";
import { ChangeChip } from "@/components/ui/ChangeChip";
import { LivePrice, TickDot } from "@/components/ui/LivePrice";
import { Sparkline } from "@/components/ui/Sparkline";
import { StockLogo } from "@/components/ui/StockLogo";

interface StockCardProps {
  quote: Quote;
  onOpen: (symbol: string) => void;
  /** Cotação do dólar: quando presente, ativos em US$ mostram o valor aproximado em R$. */
  fxRate?: number;
}

/** Card mínimo: logo, ticker, preço (R$ ou US$), variação e o gráfico real do pregão. */
export const StockCard = memo(function StockCard({ quote, onOpen, fxRate }: StockCardProps) {
  const up = quote.changePct >= 0;
  const usd = quote.currency === "USD";
  const format = priceFormatter(quote);
  const crypto = quote.kind === "crypto";
  return (
    <button
      type="button"
      onClick={() => onOpen(quote.symbol)}
      aria-label={`${quote.symbol}, ${quote.name}: ${format(quote.price)}, ${fmt.pct(quote.changePct)}. Abrir detalhes.`}
      className="card group relative flex flex-col gap-3 overflow-hidden p-3.5 text-left transition-[box-shadow,border-color,transform] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:translate-y-0 sm:p-4"
    >
      {/* Indicador discreto de tendência no dia. */}
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-[3px]", up ? "bg-up" : "bg-down")} />

      <div className="flex items-center gap-2.5">
        <StockLogo symbol={quote.symbol} name={quote.name} brandColor={quote.brandColor} market={quote.market} size={34} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm leading-tight font-semibold">
            {quote.symbol}
            {quote.kind === "etf" && <span className="rounded bg-surface-2 px-1 py-px text-[10px] font-medium text-muted">ETF</span>}
          </p>
          <p className="truncate text-xs text-muted">{quote.kind === "etf" ? `Acompanha ${quote.sector}` : quote.name}</p>
        </div>
        {/* Cripto ao vivo: pulsa a cada tick recebido da Coinbase. */}
        {crypto && quote.marketTime ? <TickDot tick={quote.marketTime} tone={up ? "up" : "down"} className="self-start" /> : null}
      </div>

      <div>
        <LivePrice value={quote.price} format={format} className="text-lg font-semibold tracking-tight sm:text-xl" />
        {usd && fxRate ? <p className="tnum text-xs text-muted">≈ {fmt.brl(quote.price * fxRate)}</p> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <ChangeChip value={quote.changePct} />
          {crypto ? (
            <MomentumBadge changePct={quote.changePct} stable={quote.sector === "Stablecoin"} />
          ) : (
            <span className={cn("tnum hidden text-xs sm:inline", up ? "text-up" : "text-down")}>{signedMoney(quote.change, quote.currency)}</span>
          )}
        </div>
      </div>

      {quote.stale ? (
        <p className="text-xs text-subtle">Sem cotação no momento</p>
      ) : (
        <Sparkline data={quote.history} up={up} height={32} />
      )}
    </button>
  );
});

/** Selo sutil do momento do mercado (variação de 24 h). */
function MomentumBadge({ changePct, stable }: { changePct: number; stable: boolean }) {
  if (stable) return <span className="text-[11px] text-muted">24h · paridade US$ 1</span>;
  const strong = Math.abs(changePct) >= 3;
  const up = changePct >= 0;
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-px text-[10px] font-semibold tracking-wide uppercase ring-1",
        up ? "text-up ring-up/30" : "text-down ring-down/30",
        strong && (up ? "bg-up-soft shadow-[0_0_10px_-2px_var(--up)]" : "bg-down-soft shadow-[0_0_10px_-2px_var(--down)]"),
      )}
      title="Variação nas últimas 24 horas"
    >
      24h · {strong ? (up ? "forte alta" : "forte queda") : up ? "alta" : "queda"}
    </span>
  );
}
