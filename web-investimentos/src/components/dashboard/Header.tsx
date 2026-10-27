"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMarketData } from "@/hooks/useMarketData";
import { fmt } from "@/lib/format";
import type { Tab } from "@/lib/tabs";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { ChangeChip } from "@/components/ui/ChangeChip";

/** Só o relógio e o mini-Ibovespa se inscrevem no mercado; o título não. */
function Clock() {
  const updatedAt = useMarketData((s) => s.updatedAt);
  return <span className="tnum font-mono text-sm text-zinc-400 sm:text-base">{fmt.clock(updatedAt)}</span>;
}

function IbovMini() {
  const index = useMarketData((s) => s.index);
  return (
    <span className="hidden items-center gap-2 sm:inline-flex">
      <span className="font-mono text-[11px] tracking-widest text-zinc-500">IBOV</span>
      <span className="tnum text-sm text-zinc-200">{fmt.points(index.price)}</span>
      <ChangeChip value={index.changePct} />
    </span>
  );
}

export function Header({ tab }: { tab: Tab }) {
  return (
    <header>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate font-mono text-[11px] tracking-[0.25em] transition-colors duration-500" style={{ color: tab.accent }}>
          <span className="sm:hidden">PAINEL</span>
          <span className="hidden sm:inline">PAINEL DE INVESTIMENTOS</span>
        </p>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <IbovMini />
          <Clock />
          <LiveBadge />
        </div>
      </div>
      <div className="relative mt-2 h-9 overflow-hidden sm:h-10">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.h1
            key={tab.id}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="truncate text-[1.7rem] leading-9 font-semibold tracking-tight sm:text-3xl sm:leading-10"
          >
            {tab.label}
          </motion.h1>
        </AnimatePresence>
      </div>
    </header>
  );
}
