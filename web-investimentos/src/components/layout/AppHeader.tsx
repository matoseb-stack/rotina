"use client";

import { motion } from "framer-motion";
import { useMarketData } from "@/hooks/useMarketData";
import { useNow } from "@/hooks/useNow";
import { fmt } from "@/lib/format";
import { TABS, type TabId } from "@/lib/tabs";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Icon } from "@/components/ui/Icon";
import { TickDot } from "@/components/ui/LivePrice";

/** Status do pregão e horário da última negociação recebida. */
function MarketStatus() {
  const fetchedAt = useMarketData((s) => s.fetchedAt);
  const marketTime = useMarketData((s) => s.marketTime);
  const session = useMarketData((s) => s.session);
  const source = useMarketData((s) => s.source);
  const now = useNow(30_000);
  const open = source === "yahoo" && session !== null && now >= session.start && now < session.end;
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted" title="Cotações do Yahoo Finance, com atraso de até 15 minutos">
      <TickDot tick={fetchedAt} tone={open ? "up" : "idle"} />
      <span className="hidden sm:inline">{source === "simulado" ? "Simulado ·" : open ? "Pregão aberto ·" : "Pregão fechado ·"}</span>
      <span className="tnum">{marketTime ? fmt.hour(marketTime) : "--:--"}</span>
    </span>
  );
}

interface AppHeaderProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  onOpenBriefing: () => void;
}

export function AppHeader({ active, onChange, onOpenBriefing }: AppHeaderProps) {
  return (
    <header className="border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:h-16 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white dark:text-slate-900" aria-hidden>
            PI
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight">
            <span className="hidden sm:inline">Painel de </span>Investimentos
          </span>
        </div>

        {/* Abas no topo (tablet/desktop). No celular viram a barra inferior. */}
        <nav role="tablist" aria-label="Seções" className="hidden h-full items-stretch gap-1 md:flex">
          {TABS.map((tab) => {
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="painel"
                onClick={() => onChange(tab.id)}
                className={cn(
                  "relative px-3 text-sm font-medium transition-colors",
                  selected ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                {tab.label}
                {selected && (
                  <motion.span
                    layoutId="tab-underline"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <MarketStatus />
          <button
            type="button"
            onClick={onOpenBriefing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg sm:px-2.5"
            aria-label="Abrir o resumo do dia"
          >
            <Icon name="sparkles" className="size-4 text-accent" />
            <span className="hidden sm:inline">Resumo do dia</span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
