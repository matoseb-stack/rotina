export type Market = "b3" | "us";
export type Currency = "BRL" | "USD";
export type AssetKind = "stock" | "etf" | "index" | "fx";

export interface StockSeed {
  symbol: string;
  name: string;
  sector: string;
  /** Padrão: ação da B3 em reais. */
  market?: Market;
  currency?: Currency;
  kind?: AssetKind;
  /** Símbolo no Yahoo Finance (padrão: "<TICKER>.SA" na B3, o próprio ticker nos EUA). */
  yahoo?: string;
  /** Busca de notícias internacionais (Google News) para ativos dos EUA. */
  newsQuery?: string;
  previousClose: number;
  /** Desvio-padrão do retorno a cada tick (1 s). */
  volatility: number;
  /** Descrição curta e didática da empresa. */
  about: string;
  /** Cor usada no monograma quando o logo não carrega. */
  brandColor: string;
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
  market: Market;
  currency: Currency;
  kind: AssetKind;
  about: string;
  brandColor: string;
  previousClose: number;
  open: number;
  price: number;
  dayLow: number;
  dayHigh: number;
  change: number;
  changePct: number;
  /** Preços do pregão (intraday, 5 em 5 min) usados no mini gráfico. */
  history: number[];
  volume?: number;
  /** Horário da última negociação (ms). */
  marketTime?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  /** true quando a fonte real falhou para este ativo e o valor é de referência. */
  stale?: boolean;
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
  /** Data de referência informada pelo Banco Central (dd/mm/aaaa). */
  date?: string;
}

/** Pregão regular da B3 (ms), para saber se o mercado está aberto. */
export interface TradingSession {
  start: number;
  end: number;
}

/** O que /api/market/quotes.json entrega. */
export interface MarketPayload {
  source: "yahoo" | "simulado";
  fetchedAt: number;
  /** Última negociação entre os ativos da B3 (ms). */
  marketTime: number | null;
  /** Pregão regular da B3. */
  session: TradingSession | null;
  /** Pregão regular de Nova York (NYSE/Nasdaq). */
  usSession: TradingSession | null;
  index: Quote;
  stocks: Quote[];
  /** Ações americanas (Big Techs). */
  us: Quote[];
  /** ETFs globais listados nos EUA. */
  etfs: Quote[];
  /** S&P 500 e Nasdaq Composite. */
  global: Quote[];
  /** Dólar comercial (USD/BRL). */
  fx: Quote;
  macro: MacroIndicator[];
  macroSource: "bcb" | "referencia";
  notice?: string;
}

/** Série de preços de um ativo por período: /api/market/history/<TICKER>.json. */
export interface HistoryPayload {
  symbol: string;
  fetchedAt: number;
  series: Partial<Record<"1D" | "5D" | "1M" | "6M" | "1Y" | "ALL", { t: number; price: number }[]>>;
  previousClose?: number;
  error?: string;
}

/** Estado imutável do simulador (usado para o Tesouro e como reserva). */
export interface SimulatedSnapshot {
  tick: number;
  updatedAt: number;
  index: Quote;
  stocks: Quote[];
  bonds: Bond[];
  macro: MacroIndicator[];
}

/** Estado do mercado no cliente: cotações reais + status do carregamento. */
export interface MarketSnapshot extends MarketPayload {
  status: "loading" | "ready";
}
