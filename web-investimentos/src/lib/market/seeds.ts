import type { BondSeed, MacroIndicator, StockSeed } from "./types";

export const INDEX_SEED: StockSeed = { symbol: "IBOV", name: "Ibovespa", sector: "Índice", previousClose: 128_450, volatility: 0.0005 };

export const STOCK_SEEDS: StockSeed[] = [
  { symbol: "PETR4", name: "Petrobras PN", sector: "Petróleo e Gás", previousClose: 37.85, volatility: 0.0016 },
  { symbol: "VALE3", name: "Vale ON", sector: "Mineração", previousClose: 61.2, volatility: 0.0015 },
  { symbol: "ITUB4", name: "Itaú Unibanco PN", sector: "Bancos", previousClose: 35.4, volatility: 0.0011 },
  { symbol: "WEGE3", name: "WEG ON", sector: "Bens Industriais", previousClose: 52.3, volatility: 0.0013 },
  { symbol: "BBAS3", name: "Banco do Brasil ON", sector: "Bancos", previousClose: 27.9, volatility: 0.0013 },
  { symbol: "BBDC4", name: "Bradesco PN", sector: "Bancos", previousClose: 14.85, volatility: 0.0015 },
  { symbol: "ABEV3", name: "Ambev ON", sector: "Bebidas", previousClose: 13.4, volatility: 0.001 },
  { symbol: "B3SA3", name: "B3 ON", sector: "Serviços Financeiros", previousClose: 12.95, volatility: 0.0016 },
  { symbol: "RENT3", name: "Localiza ON", sector: "Aluguel de Carros", previousClose: 41.6, volatility: 0.002 },
  { symbol: "SUZB3", name: "Suzano ON", sector: "Papel e Celulose", previousClose: 56.1, volatility: 0.0014 },
  { symbol: "PRIO3", name: "PRIO ON", sector: "Petróleo e Gás", previousClose: 43.2, volatility: 0.0022 },
  { symbol: "MGLU3", name: "Magazine Luiza ON", sector: "Varejo", previousClose: 9.85, volatility: 0.0032 },
  { symbol: "ELET3", name: "Eletrobras ON", sector: "Energia Elétrica", previousClose: 42.7, volatility: 0.0015 },
  { symbol: "RDOR3", name: "Rede D'Or ON", sector: "Saúde", previousClose: 30.15, volatility: 0.0017 },
  { symbol: "EMBR3", name: "Embraer ON", sector: "Aeroespacial", previousClose: 68.4, volatility: 0.0021 },
];

export const BLUE_CHIPS = ["PETR4", "VALE3", "ITUB4", "WEGE3"];

export const BOND_SEEDS: BondSeed[] = [
  { id: "selic-2029", kind: "selic", title: "Tesouro Selic 2029", maturity: "01/03/2029", openRate: 0.0921, openUnitPrice: 16_874.32, duration: 0.05 },
  { id: "selic-2031", kind: "selic", title: "Tesouro Selic 2031", maturity: "01/03/2031", openRate: 0.105, openUnitPrice: 16_712.1, duration: 0.08 },
  { id: "ipca-2035", kind: "ipca", title: "Tesouro IPCA+ 2035", maturity: "15/05/2035", openRate: 7.42, openUnitPrice: 2_048.55, duration: 7.2 },
  { id: "ipca-2045", kind: "ipca", title: "Tesouro IPCA+ 2045", maturity: "15/05/2045", openRate: 7.18, openUnitPrice: 1_022.3, duration: 13.5 },
  { id: "pre-2028", kind: "prefixado", title: "Tesouro Prefixado 2028", maturity: "01/01/2028", openRate: 13.95, openUnitPrice: 834.1, duration: 1.1 },
  { id: "pre-2032", kind: "prefixado", title: "Tesouro Prefixado 2032", maturity: "01/01/2032", openRate: 13.48, openUnitPrice: 455.7, duration: 4.3 },
];

export const MACRO: MacroIndicator[] = [
  { label: "Selic Meta", value: "15,00%" },
  { label: "CDI", value: "14,90%" },
  { label: "IPCA 12m", value: "5,17%" },
];
