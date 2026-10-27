"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { TABS, type TabId } from "@/lib/tabs";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { BreakingNewsBar } from "@/components/layout/BreakingNewsBar";
import { MarketStrip } from "@/components/layout/MarketStrip";
import { MissedTodayModal } from "@/components/briefing/MissedTodayModal";
import { StocksPanel } from "@/components/stocks/StocksPanel";
import { InternationalPanel } from "@/components/international/InternationalPanel";
import { TreasuryPanel } from "@/components/treasury/TreasuryPanel";
import { NewsPanel } from "@/components/news/NewsPanel";

const STORAGE_KEY = "painel:tab";

const PANELS: Record<TabId, React.ComponentType> = {
  acoes: StocksPanel,
  internacional: InternationalPanel,
  tesouro: TreasuryPanel,
  noticias: NewsPanel,
};

export function Dashboard() {
  const [active, setActive] = useState<TabId>("acoes");
  const [briefingOpen, setBriefingOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as TabId | null;
      if (saved && TABS.some((t) => t.id === saved)) setActive(saved);
    } catch {
      // Storage bloqueado: segue na aba padrão.
    }
  }, []);

  const select = useCallback((tab: TabId) => {
    setActive(tab);
    try {
      localStorage.setItem(STORAGE_KEY, tab);
    } catch {}
    window.scrollTo({ top: 0 });
  }, []);
  const openNews = useCallback(() => select("noticias"), [select]);

  const tab = TABS.find((t) => t.id === active)!;
  const Panel = PANELS[active];

  return (
    <div className="min-h-dvh">
      {/* Topo fixo: faixa de última hora + cabeçalho. */}
      <div className="sticky top-0 z-30 bg-bg pt-[var(--safe-top)]">
        <BreakingNewsBar />
        <AppHeader active={active} onChange={select} onOpenBriefing={() => setBriefingOpen(true)} />
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-5 pb-28 sm:px-6 md:pb-12 lg:px-8">
        <MarketStrip />
        <h1 className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">{tab.title}</h1>
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={active}
            id="painel"
            role="tabpanel"
            aria-label={tab.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Panel />
          </motion.section>
        </AnimatePresence>
        <p className="mt-10 text-center text-xs text-subtle">
          Cotações: Yahoo Finance (B3 com atraso de até 15 min) · Indicadores: Banco Central · Notícias: Valor, Folha, InfoMoney,
          Investing.com, Estadão, Bloomberg, Reuters, CNBC, FT e WSJ · Taxas do Tesouro simuladas
        </p>
      </main>

      <BottomNav active={active} onChange={select} />
      <MissedTodayModal open={briefingOpen} onOpenChange={setBriefingOpen} onSeeNews={openNews} />
    </div>
  );
}
