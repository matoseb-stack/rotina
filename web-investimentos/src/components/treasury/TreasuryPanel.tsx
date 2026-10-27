"use client";

import { memo } from "react";
import { useMarketData } from "@/hooks/useMarketData";
import { fmt } from "@/lib/format";
import { NEON } from "@/lib/tabs";
import type { Bond, BondKind } from "@/lib/market/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { Sparkline } from "@/components/ui/Sparkline";
import { Stat } from "@/components/stocks/StocksPanel";

const KIND_LABEL: Record<BondKind, string> = { selic: "Tesouro Selic", ipca: "Tesouro IPCA+", prefixado: "Tesouro Prefixado" };

const RATE_FORMAT: Record<BondKind, (r: number) => string> = {
  selic: (r) => `SELIC + ${fmt.rate(r, 4)}`,
  ipca: (r) => `IPCA + ${fmt.rate(r)}`,
  prefixado: (r) => `${fmt.rate(r)} a.a.`,
};

export function TreasuryPanel() {
  const bonds = useMarketData((s) => s.bonds);
  const macro = useMarketData((s) => s.macro);
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <GlassCard accent={NEON.purple} className="py-4">
        <dl className="grid grid-cols-3 divide-x divide-white/[0.07]">
          {macro.map((m) => (
            <div key={m.label} className="min-w-0 px-2 first:pl-0 sm:px-5">
              <dt className="truncate font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">{m.label}</dt>
              <dd className="tnum mt-1 text-lg font-semibold text-neon-purple sm:text-2xl">{m.value}</dd>
            </div>
          ))}
        </dl>
      </GlassCard>
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {bonds.map((b) => (
          <BondCard key={b.id} bond={b} />
        ))}
      </div>
    </div>
  );
}

const BondCard = memo(function BondCard({ bond }: { bond: Bond }) {
  // Taxa caindo valoriza o título: verde. Subindo: vermelho.
  const bpsColor = bond.changeBps <= 0 ? NEON.lime : NEON.red;
  return (
    <GlassCard accent={NEON.purple}>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-neon-purple/15 px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-neon-purple uppercase">
          {KIND_LABEL[bond.kind]}
        </span>
        <span className="text-xs text-zinc-500">Venc. {bond.maturity}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold">{bond.title}</h3>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <PriceTicker value={bond.rate} format={RATE_FORMAT[bond.kind]} invert className="text-2xl font-semibold tracking-tight sm:text-[1.7rem]" />
        <span className="tnum text-xs font-semibold" style={{ color: bpsColor }}>
          {fmt.bps(bond.changeBps)}
        </span>
      </div>
      <Sparkline data={bond.history} color={NEON.purple} height={56} className="mt-4" />
      <div className="hairline my-4" />
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Stat label="Preço unitário" value={fmt.brl(bond.unitPrice)} />
        <Stat label="Invest. mínimo" value={fmt.brl(bond.minimumInvestment)} />
      </dl>
    </GlassCard>
  );
});
