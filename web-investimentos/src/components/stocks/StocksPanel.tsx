"use client";

import { useCallback, useMemo, useState } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { fmt } from "@/lib/format";
import { buildHistory } from "@/lib/market/history";
import type { Quote } from "@/lib/market/types";
import { cn } from "@/lib/utils";
import { ChangeChip } from "@/components/ui/ChangeChip";
import { LivePrice } from "@/components/ui/LivePrice";
import { Sparkline } from "@/components/ui/Sparkline";
import { StockLogo } from "@/components/ui/StockLogo";
import { StockCard } from "./StockCard";
import { StockModal } from "./StockModal";

type SortKey = "ticker" | "alta" | "baixa";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "ticker", label: "A–Z" },
  { id: "alta", label: "Maiores altas" },
  { id: "baixa", label: "Maiores baixas" },
];

export function StocksPanel() {
  const stocks = useMarketData((s) => s.stocks);
  const [sort, setSort] = useState<SortKey>("ticker");
  const [openSymbol, setOpenSymbol] = useState<string | null>(null);
  const open = useCallback((symbol: string) => setOpenSymbol(symbol), []);
  const close = useCallback(() => setOpenSymbol(null), []);

  const sorted = useMemo(() => {
    const list = [...stocks];
    if (sort === "ticker") list.sort((a, b) => a.symbol.localeCompare(b.symbol));
    else if (sort === "alta") list.sort((a, b) => b.changePct - a.changePct);
    else list.sort((a, b) => a.changePct - b.changePct);
    return list;
  }, [stocks, sort]);

  return (
    <div className="flex flex-col gap-6">
      <MarketOverview stocks={stocks} onOpen={open} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Principais ações</h2>
          <p className="text-sm text-muted">Toque em uma ação para ver o gráfico e as notícias.</p>
        </div>
        <div role="radiogroup" aria-label="Ordenar" className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5 text-xs font-medium">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={sort === s.id}
              onClick={() => setSort(s.id)}
              className={cn(
                "rounded-md px-2.5 py-1.5 transition-colors",
                sort === s.id ? "bg-surface text-fg shadow-card-sm" : "text-muted hover:text-fg",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {sorted.map((q) => (
          <StockCard key={q.symbol} quote={q} onOpen={open} />
        ))}
      </div>

      <StockModal symbol={openSymbol} onClose={close} />
    </div>
  );
}

/** Resumo do dia: Ibovespa + três maiores altas e baixas. */
function MarketOverview({ stocks, onOpen }: { stocks: Quote[]; onOpen: (symbol: string) => void }) {
  const index = useMarketData((s) => s.index);
  const { gainers, losers, advancers } = useMemo(() => {
    const byChange = [...stocks].sort((a, b) => b.changePct - a.changePct);
    return {
      gainers: byChange.slice(0, 3),
      losers: byChange.slice(-3).reverse(),
      advancers: stocks.filter((q) => q.changePct >= 0).length,
    };
  }, [stocks]);
  const up = index.changePct >= 0;
  // Curva do pregão de hoje (mesma série do gráfico 1D), terminando no valor ao vivo.
  const intraday = useMemo(() => buildHistory(index, "1D", Date.now()).map((p) => p.price), [index]);

  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2.5">
          <StockLogo symbol="IBOV" name="Ibovespa" brandColor={index.brandColor} size={32} />
          <div>
            <p className="text-sm font-semibold">Ibovespa</p>
            <p className="text-xs text-muted">Índice da B3</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <LivePrice value={index.price} format={fmt.points} className="text-2xl font-semibold tracking-tight" />
          <ChangeChip value={index.changePct} size="md" />
        </div>
        <Sparkline data={intraday} up={up} height={44} className="mt-3" />
        <p className="mt-2 text-xs text-muted">
          <span className="text-up">{advancers} em alta</span> · <span className="text-down">{stocks.length - advancers} em baixa</span> entre as ações acompanhadas
        </p>
      </div>
      <MoversCard title="Maiores altas" items={gainers} onOpen={onOpen} />
      <MoversCard title="Maiores baixas" items={losers} onOpen={onOpen} />
    </div>
  );
}

function MoversCard({ title, items, onOpen }: { title: string; items: Quote[]; onOpen: (symbol: string) => void }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 divide-y divide-line">
        {items.map((q) => (
          <li key={q.symbol}>
            <button type="button" onClick={() => onOpen(q.symbol)} className="flex w-full items-center gap-2.5 py-2.5 text-left">
              <StockLogo symbol={q.symbol} name={q.name} brandColor={q.brandColor} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{q.symbol}</span>
                <span className="block truncate text-xs text-muted">{q.name}</span>
              </span>
              <span className="text-right">
                <span className="tnum block text-sm">{fmt.brl(q.price)}</span>
                <ChangeChip value={q.changePct} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
