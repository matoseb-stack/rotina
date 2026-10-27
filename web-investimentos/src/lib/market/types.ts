export interface StockSeed {
  symbol: string;
  name: string;
  sector: string;
  previousClose: number;
  /** Desvio-padrão do retorno a cada tick (1 s). */
  volatility: number;
}

export type BondKind = "selic" | "ipca" | "prefixado";

export interface BondSeed {
  id: string;
  kind: BondKind;
  title: string;
  maturity: string;
  /** Spread sobre a Selic, juro real sobre o IPCA ou taxa nominal (% a.a.). */
  openRate: number;
  openUnitPrice: number;
  /** Duration aproximada em anos: move o PU quando a taxa oscila. */
  duration: number;
}

export interface Quote {
  symbol: string;
  name: string;
  sector: string;
  previousClose: number;
  price: number;
  dayLow: number;
  dayHigh: number;
  change: number;
  changePct: number;
  history: number[];
}

export interface Bond {
  id: string;
  kind: BondKind;
  title: string;
  maturity: string;
  openRate: number;
  rate: number;
  unitPrice: number;
  changeBps: number;
  minimumInvestment: number;
  history: number[];
}

export interface MacroIndicator {
  label: string;
  value: string;
}

/** Estado imutável do mercado num instante. Um objeto novo por tick. */
export interface MarketSnapshot {
  tick: number;
  updatedAt: number;
  index: Quote;
  stocks: Quote[];
  blueChips: Quote[];
  bonds: Bond[];
  macro: MacroIndicator[];
}
