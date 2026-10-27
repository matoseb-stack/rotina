import type { BondSeed, MacroIndicator, StockSeed } from "./types";

export const INDEX_SEED: StockSeed = { symbol: "IBOV", name: "Ibovespa", sector: "Índice", previousClose: 176_608, volatility: 0.0005, about: "Principal índice da B3, formado pelas ações mais negociadas.", brandColor: "#1D4ED8" };

export const STOCK_SEEDS: StockSeed[] = [
  { symbol: "PETR4", name: "Petrobras PN", sector: "Petróleo e Gás", previousClose: 53.88, volatility: 0.0016, about: "Maior empresa de energia do país: exploração e produção de petróleo e gás, refino e distribuição.", brandColor: "#008542" },
  { symbol: "VALE3", name: "Vale ON", sector: "Mineração", previousClose: 64.38, volatility: 0.0015, about: "Uma das maiores mineradoras do mundo, líder na produção de minério de ferro e níquel.", brandColor: "#007E7A" },
  { symbol: "ITUB4", name: "Itaú Unibanco PN", sector: "Bancos", previousClose: 41.7, volatility: 0.0011, about: "Maior banco privado da América Latina, com atuação em varejo, atacado e gestão de investimentos.", brandColor: "#EC7000" },
  { symbol: "WEGE3", name: "WEG ON", sector: "Bens Industriais", previousClose: 44.53, volatility: 0.0013, about: "Fabricante global de motores elétricos, equipamentos de energia e automação industrial.", brandColor: "#00579D" },
  { symbol: "BBAS3", name: "Banco do Brasil ON", sector: "Bancos", previousClose: 17.47, volatility: 0.0013, about: "Banco de economia mista, referência em crédito agrícola e serviços para o setor público.", brandColor: "#465EFF" },
  { symbol: "BBDC4", name: "Bradesco PN", sector: "Bancos", previousClose: 15.95, volatility: 0.0015, about: "Um dos maiores bancos privados do Brasil, com forte presença em seguros e varejo.", brandColor: "#CC092F" },
  { symbol: "ABEV3", name: "Ambev ON", sector: "Bebidas", previousClose: 15.37, volatility: 0.001, about: "Maior cervejaria da América Latina, dona de marcas como Brahma, Skol e Antarctica.", brandColor: "#1A3A6E" },
  { symbol: "B3SA3", name: "B3 ON", sector: "Serviços Financeiros", previousClose: 15.07, volatility: 0.0016, about: "Bolsa de valores do Brasil: opera a negociação, compensação e custódia de ativos.", brandColor: "#00A6A6" },
  { symbol: "RENT3", name: "Localiza ON", sector: "Aluguel de Carros", previousClose: 31.67, volatility: 0.002, about: "Maior locadora de veículos e gestora de frotas da América Latina.", brandColor: "#00A859" },
  { symbol: "SUZB3", name: "Suzano ON", sector: "Papel e Celulose", previousClose: 47.4, volatility: 0.0014, about: "Maior produtora mundial de celulose de eucalipto, com papéis para diversos usos.", brandColor: "#4B8C3E" },
  { symbol: "PRIO3", name: "PRIO ON", sector: "Petróleo e Gás", previousClose: 71.14, volatility: 0.0022, about: "Petroleira independente focada na revitalização de campos maduros de petróleo.", brandColor: "#F58220" },
  { symbol: "MGLU3", name: "Magazine Luiza ON", sector: "Varejo", previousClose: 5.3, volatility: 0.0032, about: "Varejista multicanal com lojas físicas, e-commerce e marketplace.", brandColor: "#0086FF" },
  { symbol: "AXIA3", name: "Axia Energia ON", sector: "Energia Elétrica", previousClose: 50.8, volatility: 0.0015, about: "Antiga Eletrobras: maior empresa de geração e transmissão de energia elétrica da América Latina.", brandColor: "#00A3E0" },
  { symbol: "RDOR3", name: "Rede D'Or ON", sector: "Saúde", previousClose: 35.02, volatility: 0.0017, about: "Maior rede de hospitais privados do Brasil.", brandColor: "#003B71" },
  { symbol: "EMBJ3", name: "Embraer ON", sector: "Aeroespacial", previousClose: 96.2, volatility: 0.0021, about: "Fabricante de aeronaves comerciais, executivas e de defesa.", brandColor: "#1B3C87" },
];

export const BOND_SEEDS: BondSeed[] = [
  { id: "selic-2029", kind: "selic", title: "Tesouro Selic 2029", maturity: "01/03/2029", openRate: 0.0921, openUnitPrice: 16_874.32, duration: 0.05 },
  { id: "selic-2031", kind: "selic", title: "Tesouro Selic 2031", maturity: "01/03/2031", openRate: 0.105, openUnitPrice: 16_712.1, duration: 0.08 },
  { id: "ipca-2035", kind: "ipca", title: "Tesouro IPCA+ 2035", maturity: "15/05/2035", openRate: 7.42, openUnitPrice: 2_048.55, duration: 7.2 },
  { id: "ipca-2045", kind: "ipca", title: "Tesouro IPCA+ 2045", maturity: "15/05/2045", openRate: 7.18, openUnitPrice: 1_022.3, duration: 13.5 },
  { id: "pre-2028", kind: "prefixado", title: "Tesouro Prefixado 2028", maturity: "01/01/2028", openRate: 13.95, openUnitPrice: 834.1, duration: 1.1 },
  { id: "pre-2032", kind: "prefixado", title: "Tesouro Prefixado 2032", maturity: "01/01/2032", openRate: 13.48, openUnitPrice: 455.7, duration: 4.3 },
];

export const MACRO: MacroIndicator[] = [
  { label: "Selic Meta", value: "13,75%" },
  { label: "CDI", value: "13,65%" },
  { label: "IPCA 12m", value: "4,58%" },
];
