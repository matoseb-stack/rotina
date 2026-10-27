"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { TABS, type TabId } from "@/lib/tabs";
import { NeonTabs } from "./NeonTabs";
import { Header } from "./Header";
import { StocksPanel } from "@/components/stocks/StocksPanel";
import { MoversPanel } from "@/components/movers/MoversPanel";
import { TreasuryPanel } from "@/components/treasury/TreasuryPanel";
import { NewsWire } from "@/components/news/NewsWire";

const STORAGE_KEY = "neon-invest:tab";

const PANELS: Record<TabId, React.ComponentType> = {
  b3: StocksPanel,
  movers: MoversPanel,
  tesouro: TreasuryPanel,
  news: NewsWire,
};

/**
 * Layout adaptativo:
 *  - lg+ (laptop/desktop): abas laterais + conteúdo em grid;
 *  - md (tablet): abas no topo + grid de 2 colunas;
 *  - < md (iPhone): conteúdo empilhado + dock inferior respeitando a safe area.
 */
export function Dashboard() {
  const [active, setActive] = useState<TabId>("b3");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as TabId | null;
      if (saved && TABS.some((t) => t.id === saved)) setActive(saved);
    } catch {
      // Navegação privada / storage bloqueado: segue na aba padrão.
    }
  }, []);

  const select = useCallback((tab: TabId) => {
    setActive(tab);
    try {
      localStorage.setItem(STORAGE_KEY, tab);
    } catch {}
    if (window.scrollY > 120) window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const tab = TABS.find((t) => t.id === active)!;
  const Panel = PANELS[active];

  return (
    <div className="relative min-h-dvh">
      {/* Halos neon fixos ao fundo: dão o que o vidro "refratar". */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 size-[36rem] rounded-full bg-neon-purple/[0.09] blur-3xl" />
        <div className="absolute top-1/4 -right-48 size-[32rem] rounded-full bg-neon-cyan/[0.07] blur-3xl" />
        <div className="absolute -bottom-56 left-1/3 size-[34rem] rounded-full bg-neon-lime/[0.06] blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] gap-8 px-4 pt-[max(var(--safe-top),1rem)] pb-28 sm:px-6 md:pb-10 lg:px-8 lg:pt-8">
        <aside className="sticky top-8 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col lg:flex">
          <p className="mb-5 font-mono text-[11px] tracking-[0.25em] text-zinc-500">MERCADO</p>
          <NeonTabs variant="rail" active={active} onChange={select} />
          <p className="mt-auto text-xs leading-relaxed text-zinc-500">
            Cotações simuladas, atualizadas a cada 1 s.
            <br />
            Notícias: Folha de S.Paulo (RSS).
          </p>
        </aside>

        <main className="min-w-0 flex-1">
          <Header tab={tab} />
          <NeonTabs variant="bar" active={active} onChange={select} className="mt-6 hidden md:grid lg:hidden" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={active}
              id="dashboard-panel"
              role="tabpanel"
              aria-label={tab.label}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6"
            >
              <Panel />
            </motion.section>
          </AnimatePresence>
        </main>
      </div>

      <NeonTabs variant="dock" active={active} onChange={select} className="md:hidden" />
    </div>
  );
}
