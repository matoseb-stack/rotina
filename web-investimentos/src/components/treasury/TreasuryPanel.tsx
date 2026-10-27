"use client";

import { useMarketData, useTreasuryData } from "@/hooks/useMarketData";
import { fmt } from "@/lib/format";
import type { Bond, BondKind } from "@/lib/market/types";
import { cn } from "@/lib/utils";
import { LivePrice } from "@/components/ui/LivePrice";

const GROUPS: { kind: BondKind; title: string; description: string }[] = [
  { kind: "selic", title: "Tesouro Selic", description: "Pós-fixado: rende a taxa Selic + um pequeno spread. Baixa oscilação, indicado para reserva de emergência." },
  { kind: "ipca", title: "Tesouro IPCA+", description: "Híbrido: paga a inflação (IPCA) + uma taxa real fixa. Protege o poder de compra no longo prazo." },
  { kind: "prefixado", title: "Tesouro Prefixado", description: "Taxa fixa definida na compra. Você sabe quanto vai receber se levar até o vencimento." },
];

const RATE_FORMAT: Record<BondKind, (r: number) => string> = {
  selic: (r) => `Selic + ${fmt.rate(r, 4)}`,
  ipca: (r) => `IPCA + ${fmt.rate(r)}`,
  prefixado: (r) => `${fmt.rate(r)} a.a.`,
};

export function TreasuryPanel() {
  const bonds = useTreasuryData((s) => s.bonds);
  const macro = useMarketData((s) => s.macro);
  const macroSource = useMarketData((s) => s.macroSource);

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-3 gap-3 sm:gap-4">
        {macro.map((m) => (
          <div key={m.label} className="card p-3 sm:p-5">
            <dt className="text-xs text-muted sm:text-sm">{m.label}</dt>
            <dd className="tnum mt-1 text-lg font-semibold tracking-tight sm:text-2xl">{m.value}</dd>
            {m.date && <dd className="mt-0.5 text-[11px] text-subtle">ref. {m.date}</dd>}
          </div>
        ))}
      </dl>
      <p className="-mt-3 text-xs text-subtle">
        {macroSource === "bcb" ? "Indicadores reais do Banco Central (SGS)." : "Indicadores de referência (Banco Central indisponível)."}{" "}
        Taxas e preços dos títulos abaixo são <strong className="font-medium">simulados</strong>.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {GROUPS.map((g) => (
          <section key={g.kind} aria-labelledby={`grupo-${g.kind}`} className="flex flex-col gap-3">
            <div className="px-1">
              <h2 id={`grupo-${g.kind}`} className="text-base font-semibold">
                {g.title}
              </h2>
              <p className="mt-0.5 text-sm text-muted">{g.description}</p>
            </div>
            {bonds
              .filter((b) => b.kind === g.kind)
              .map((b) => (
                <BondCard key={b.id} bond={b} />
              ))}
          </section>
        ))}
      </div>

      <p className="text-xs text-subtle">
        Taxa subindo derruba o preço do título (marcação a mercado): por isso alta de taxa aparece em vermelho para quem já investiu.
      </p>
    </div>
  );
}

function BondCard({ bond }: { bond: Bond }) {
  const rateUp = bond.changeBps > 0;
  return (
    <article className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{bond.title}</h3>
        <span className="text-xs text-muted">Venc. {bond.maturity}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <LivePrice value={bond.rate} format={RATE_FORMAT[bond.kind]} className="text-xl font-semibold tracking-tight" />
        <span
          className={cn("tnum rounded-md px-1.5 py-0.5 text-xs font-semibold", rateUp ? "bg-down-soft text-down" : "bg-up-soft text-up")}
          title="Variação da taxa desde a abertura, em pontos-base (1 bp = 0,01 p.p.)"
        >
          {fmt.bps(bond.changeBps)}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-sm">
        <div>
          <dt className="text-xs text-muted">Preço unitário</dt>
          <dd className="tnum font-medium">{fmt.brl(bond.unitPrice)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Invest. mínimo</dt>
          <dd className="tnum font-medium">{fmt.brl(bond.minimumInvestment)}</dd>
        </div>
      </dl>
    </article>
  );
}
