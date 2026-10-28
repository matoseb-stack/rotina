"use client";

import { useCallback, useMemo, useState } from "react";
import { refreshMarket, useMarketData } from "@/hooks/useMarketData";
import { compactMoney, fmt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChangeChip } from "@/components/ui/ChangeChip";
import { StockCard } from "@/components/stocks/StockCard";
import { StockModal } from "@/components/stocks/StockModal";

/**
 * Criptomoedas: preço em US$ (e aproximado em R$), variação de 24 h e gráfico
 * do dia. Preços ao vivo pela Coinbase, aplicados a cada 1 s; capitalização,
 * volume e dominância pela CoinGecko.
 */
export function CryptoPanel() {
  const status = useMarketData((s) => s.status);
  const crypto = useMarketData((s) => s.crypto);
  const fx = useMarketData((s) => s.fx);
  const [openSymbol, setOpenSymbol] = useState<string | null>(null);
  const open = useCallback((symbol: string) => setOpenSymbol(symbol), []);
  const close = useCallback(() => setOpenSymbol(null), []);
  const { coins, stables } = useMemo(
    () => ({ coins: crypto.filter((q) => q.sector !== "Stablecoin"), stables: crypto.filter((q) => q.sector === "Stablecoin") }),
    [crypto],
  );

  if (status === "loading") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4" aria-busy aria-label="Carregando criptomoedas">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="card h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <CryptoStatusBar />
      <CryptoOverview fxPrice={fx.price} fxChange={fx.changePct} />

      <section aria-labelledby="crypto-main" className="flex flex-col gap-3">
        <div>
          <h2 id="crypto-main" className="text-base font-semibold">Principais criptomoedas</h2>
          <p className="text-sm text-muted">
            Cripto negocia 24 h por dia, então a variação é a das últimas 24 h. Toque para ver gráfico, métricas e notícias.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-3">
          {coins.map((q) => (
            <StockCard key={q.symbol} quote={q} onOpen={open} fxRate={fx.price} />
          ))}
        </div>
      </section>

      <section aria-labelledby="crypto-stable" className="flex flex-col gap-3">
        <div>
          <h2 id="crypto-stable" className="text-base font-semibold">Stablecoins</h2>
          <p className="text-sm text-muted">
            Moedas digitais que buscam valer sempre US$ 1. Servem de &quot;dólar digital&quot; para entrar e sair de outras criptos.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {stables.map((q) => (
            <StockCard key={q.symbol} quote={q} onOpen={open} fxRate={fx.price} />
          ))}
        </div>
      </section>

      <p className="text-xs text-subtle">
        Criptoativos são voláteis e não têm garantia do FGC. As informações são educativas e não são recomendação de investimento.
      </p>

      <StockModal symbol={openSymbol} onClose={close} />
    </div>
  );
}

function CryptoOverview({ fxPrice, fxChange }: { fxPrice: number; fxChange: number }) {
  const global = useMarketData((s) => s.cryptoGlobal);
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <div className="card p-4">
        <dt className="text-xs text-muted">Dominância do Bitcoin</dt>
        <dd className="tnum mt-1 text-xl font-semibold tracking-tight">{global?.btcDominance != null ? fmt.rate(global.btcDominance, 1) : "—"}</dd>
        <dd className="mt-1 text-[11px] text-subtle">Fatia do BTC no valor de todo o mercado cripto</dd>
      </div>
      <div className="card p-4">
        <dt className="text-xs text-muted">Valor do mercado cripto</dt>
        <dd className="tnum mt-1 flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight">
          {global?.totalMarketCap != null ? compactMoney(global.totalMarketCap) : "—"}
          {global?.marketCapChange24h != null && <ChangeChip value={global.marketCapChange24h} />}
        </dd>
        <dd className="mt-1 text-[11px] text-subtle">Capitalização total, variação em 24 h</dd>
      </div>
      <div className="card col-span-2 p-4 sm:col-span-1">
        <dt className="text-xs text-muted">Dólar (USD/BRL)</dt>
        <dd className="tnum mt-1 flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight">
          {fmt.brl(fxPrice)} <ChangeChip value={fxChange} />
        </dd>
        <dd className="mt-1 text-[11px] text-subtle">Usado na conversão aproximada para reais</dd>
      </div>
    </dl>
  );
}

const LIVE_LABEL = { live: "Ao vivo · Coinbase", connecting: "Conectando ao feed ao vivo…", offline: "Feed ao vivo indisponível · reconectando" } as const;

function CryptoStatusBar() {
  const live = useMarketData((s) => s.cryptoLive);
  const fetchedAt = useMarketData((s) => s.fetchedAt);
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5 font-medium text-fg">
        <span className="relative inline-flex size-2">
          {live === "live" && <span className="absolute inset-0 animate-ping rounded-full bg-up opacity-60" />}
          <span className={cn("relative size-2 rounded-full", live === "live" ? "bg-up" : live === "connecting" ? "bg-warn" : "bg-subtle")} />
        </span>
        {LIVE_LABEL[live]}
      </span>
      <span>· preços atualizados a cada 1 s</span>
      <span>· métricas: CoinGecko</span>
      <button type="button" onClick={refreshMarket} className="tnum rounded px-1 text-accent hover:underline">
        dados de referência às {fmt.hour(fetchedAt)} ↻
      </button>
    </p>
  );
}
