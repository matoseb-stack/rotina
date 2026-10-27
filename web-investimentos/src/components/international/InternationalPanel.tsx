"use client";

import { useCallback, useState } from "react";
import { refreshMarket, useMarketData } from "@/hooks/useMarketData";
import { useNow } from "@/hooks/useNow";
import { fmt, indexValue } from "@/lib/format";
import type { Quote } from "@/lib/market/types";
import { ChangeChip } from "@/components/ui/ChangeChip";
import { LivePrice } from "@/components/ui/LivePrice";
import { Sparkline } from "@/components/ui/Sparkline";
import { StockCard } from "@/components/stocks/StockCard";
import { StockModal } from "@/components/stocks/StockModal";

/** Ações americanas e ETFs globais, com preço em US$ e conversão aproximada para R$. */
export function InternationalPanel() {
  const status = useMarketData((s) => s.status);
  const us = useMarketData((s) => s.us);
  const etfs = useMarketData((s) => s.etfs);
  const global = useMarketData((s) => s.global);
  const fx = useMarketData((s) => s.fx);
  const [openSymbol, setOpenSymbol] = useState<string | null>(null);
  const open = useCallback((symbol: string) => setOpenSymbol(symbol), []);
  const close = useCallback(() => setOpenSymbol(null), []);

  if (status === "loading") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4" aria-busy aria-label="Carregando cotações">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="card h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <UsSourceBar />

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {global.map((q) => (
          <BenchmarkCard key={q.symbol} quote={q} format={indexValue} subtitle={q.sector} />
        ))}
        <BenchmarkCard quote={fx} format={(v) => fmt.brl(v)} subtitle="Dólar comercial · USD/BRL" />
      </div>

      <section aria-labelledby="us-stocks" className="flex flex-col gap-3">
        <div>
          <h2 id="us-stocks" className="text-base font-semibold">Ações dos EUA · Big Techs</h2>
          <p className="text-sm text-muted">
            Preços em dólar, com valor aproximado em reais pelo câmbio atual. Toque para ver gráfico e notícias.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {us.map((q) => (
            <StockCard key={q.symbol} quote={q} onOpen={open} fxRate={fx.price} />
          ))}
        </div>
      </section>

      <section aria-labelledby="etfs" className="flex flex-col gap-3">
        <div>
          <h2 id="etfs" className="text-base font-semibold">ETFs globais</h2>
          <p className="text-sm text-muted">
            Fundos negociados em bolsa que replicam um índice inteiro: uma cota já diversifica em centenas de empresas ou títulos.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-3">
          {etfs.map((q) => (
            <StockCard key={q.symbol} quote={q} onOpen={open} fxRate={fx.price} />
          ))}
        </div>
      </section>

      <StockModal symbol={openSymbol} onClose={close} />
    </div>
  );
}

function BenchmarkCard({ quote, format, subtitle }: { quote: Quote; format: (v: number) => string; subtitle: string }) {
  const up = quote.changePct >= 0;
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">{quote.name}</p>
        <ChangeChip value={quote.changePct} />
      </div>
      <p className="text-xs text-muted">{subtitle}</p>
      <LivePrice value={quote.price} format={format} className="mt-2 text-xl font-semibold tracking-tight" />
      <Sparkline data={quote.history} up={up} height={36} className="mt-2" />
    </div>
  );
}

function UsSourceBar() {
  const source = useMarketData((s) => s.source);
  const session = useMarketData((s) => s.usSession);
  const fetchedAt = useMarketData((s) => s.fetchedAt);
  const now = useNow(30_000);
  const open = session !== null && now >= session.start && now < session.end;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
      {source === "yahoo" ? (
        <>
          <span className="font-medium text-fg">Cotações reais</span>
          <span>· Yahoo Finance · NYSE/Nasdaq {open ? "abertas" : "fechadas"}</span>
          {session && <span className="tnum">· pregão {fmt.hour(session.start)}–{fmt.hour(session.end)} (Brasília)</span>}
        </>
      ) : (
        <span className="font-medium text-down">Valores simulados</span>
      )}
      <button type="button" onClick={refreshMarket} className="tnum rounded px-1 text-accent hover:underline">
        atualizado às {fmt.hour(fetchedAt)} ↻
      </button>
    </p>
  );
}
