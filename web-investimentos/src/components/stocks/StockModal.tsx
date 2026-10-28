"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMarketData } from "@/hooks/useMarketData";
import { compactMoney, decimal, fmt, priceFormatter, signedMoney } from "@/lib/format";

const compactFmt = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const compact = (v: number) => compactFmt.format(v);
import type { MarketSnapshot } from "@/lib/market/types";
import { cn } from "@/lib/utils";
import { ChangeChip } from "@/components/ui/ChangeChip";
import { Icon } from "@/components/ui/Icon";
import { LivePrice } from "@/components/ui/LivePrice";
import { StockLogo } from "@/components/ui/StockLogo";
import { AssetInsight } from "./AssetInsight";
import { AssetNews } from "./AssetNews";
import { StockChart } from "./StockChart";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface StockModalProps {
  symbol: string | null;
  onClose: () => void;
}

/**
 * Deep-dive do ativo: cabeçalho com preço ao vivo, gráfico com períodos à
 * esquerda e notícias da Folha à direita. Tela cheia no celular.
 * Esc fecha, o foco fica preso no diálogo e volta ao card ao fechar.
 */
export function StockModal({ symbol, onClose }: StockModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>{symbol && <ModalBody key="stock-modal" symbol={symbol} onClose={onClose} />}</AnimatePresence>,
    document.body,
  );
}

function ModalBody({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  // Seletor devolve o objeto do próprio snapshot: re-renderiza só quando o ativo muda.
  const quote = useMarketData(
    (s: MarketSnapshot) =>
      s.stocks.find((q) => q.symbol === symbol) ??
      s.us.find((q) => q.symbol === symbol) ??
      s.etfs.find((q) => q.symbol === symbol) ??
      s.crypto.find((q) => q.symbol === symbol)!,
  );
  const fxRate = useMarketData((s: MarketSnapshot) => s.fx.price);
  const btcDominance = useMarketData((s: MarketSnapshot) => s.cryptoGlobal?.btcDominance ?? null);
  const usd = quote.currency === "USD";
  const crypto = quote.kind === "crypto";
  const format = priceFormatter(quote);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prevOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  const up = quote.changePct >= 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-[2px]" onClick={onClose} aria-hidden />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-modal-title"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
        className="relative flex h-full w-full flex-col overflow-hidden bg-surface shadow-pop sm:h-auto sm:max-h-[92dvh] sm:max-w-6xl sm:rounded-2xl sm:border sm:border-line"
      >
        {/* Cabeçalho */}
        <header className="flex shrink-0 items-start gap-3 border-b border-line px-4 pt-[max(var(--safe-top),1rem)] pb-4 sm:px-6 sm:pt-5">
          <StockLogo symbol={quote.symbol} name={quote.name} brandColor={quote.brandColor} market={quote.market} size={48} />
          <div className="min-w-0 flex-1">
            <h2 id="stock-modal-title" className="truncate text-lg font-semibold sm:text-xl">
              {quote.name}
            </h2>
            <p className="text-sm text-muted">
              <span className="font-medium text-fg">{quote.symbol}</span> · {quote.kind === "etf" ? `ETF · acompanha ${quote.sector}` : quote.sector}
              {quote.market === "us" && " · NYSE/Nasdaq"}
              {crypto && " · 24 h por dia"}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <LivePrice value={quote.price} format={format} className="text-2xl font-semibold tracking-tight" />
            <div className="mt-1 flex items-center justify-end gap-2">
              <span className={cn("tnum text-sm", up ? "text-up" : "text-down")}>{signedMoney(quote.change, quote.currency)}</span>
              <ChangeChip value={quote.changePct} size="md" />
            </div>
            {crypto && <p className="mt-0.5 text-[11px] text-subtle">variação em 24 h</p>}
            {usd && <p className="tnum mt-1 text-xs text-muted">≈ {fmt.brl(quote.price * fxRate)} · dólar a {fmt.brl(fxRate)}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="-mt-1 -mr-1 rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label="Fechar"
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="overflow-y-auto overscroll-contain pb-[var(--safe-bottom)]">
          {/* Preço no celular (no desktop fica no cabeçalho). */}
          <div className="flex items-center gap-3 px-4 pt-4 sm:hidden">
            <LivePrice value={quote.price} format={format} className="text-2xl font-semibold tracking-tight" />
            <ChangeChip value={quote.changePct} size="md" />
            <span className={cn("tnum text-sm", up ? "text-up" : "text-down")}>{signedMoney(quote.change, quote.currency)}</span>
          </div>
          {usd && <p className="tnum px-4 pt-1 text-xs text-muted sm:hidden">≈ {fmt.brl(quote.price * fxRate)} · dólar a {fmt.brl(fxRate)}</p>}

          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              <StockChart quote={quote} />

              {crypto ? (
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
                  <Stat label="Capitalização de mercado" value={quote.marketCap ? compactMoney(quote.marketCap) : "—"} hint="Preço × moedas em circulação." />
                  <Stat label="Volume em 24 h" value={quote.volume24h ? compactMoney(quote.volume24h) : "—"} hint="Valor negociado em todas as corretoras nas últimas 24 horas (CoinGecko)." />
                  <Stat label="Dominância do Bitcoin" value={btcDominance !== null ? fmt.rate(btcDominance, 1) : "—"} hint="Fatia do bitcoin no valor de mercado de todas as criptomoedas." />
                  <Stat label="Máxima 24 h" value={format(quote.dayHigh)} hint="Maior preço nas últimas 24 horas." />
                  <Stat label="Mínima 24 h" value={format(quote.dayLow)} hint="Menor preço nas últimas 24 horas." />
                  <Stat label="Ranking" value={quote.rank ? `#${quote.rank}` : "—"} hint="Posição por capitalização de mercado (CoinGecko)." />
                </dl>
              ) : (
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
                  <Stat label="Abertura" value={format(quote.open)} hint="Primeiro preço negociado no dia." />
                  <Stat label="Mínima do dia" value={format(quote.dayLow)} hint="Menor preço negociado hoje." />
                  <Stat label="Máxima do dia" value={format(quote.dayHigh)} hint="Maior preço negociado hoje." />
                  <Stat label="Fech. anterior" value={format(quote.previousClose)} hint="Preço no fim do pregão anterior: base da variação do dia." />
                  <Stat label="Volume" value={quote.volume ? compact(quote.volume) : "—"} hint="Quantidade de ações negociadas hoje." />
                  <Stat
                    label="52 semanas"
                    value={quote.fiftyTwoWeekLow && quote.fiftyTwoWeekHigh ? `${decimal(quote.fiftyTwoWeekLow)} – ${decimal(quote.fiftyTwoWeekHigh)}` : "—"}
                    hint="Menor e maior preço do último ano."
                  />
                </dl>
              )}

              <div className="rounded-xl bg-surface-2 p-4">
                <p className="text-sm font-semibold">{quote.kind === "etf" ? "Sobre o ETF" : crypto ? "Sobre a criptomoeda" : "Sobre a empresa"}</p>
                <p className="mt-1 text-sm text-muted">{quote.about}</p>
              </div>
            </div>

            <aside className="flex flex-col gap-5 lg:border-l lg:border-line lg:pl-6">
              {/* Antes das notícias: o resumo de por que o ativo sobe ou cai hoje. */}
              <AssetInsight symbol={quote.symbol} crypto={crypto} />
              <AssetNews symbol={quote.symbol} market={quote.market} name={quote.name.replace(/ (ON|PN)$/, "")} />
            </aside>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-surface p-3" title={hint}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="tnum mt-0.5 text-sm font-semibold">{value}</dd>
    </div>
  );
}
