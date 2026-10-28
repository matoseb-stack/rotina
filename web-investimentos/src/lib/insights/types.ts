/** Resumo "por que a ação está subindo ou caindo", servido em /api/insights/<TICKER>.json. */
export interface InsightSource {
  title: string;
  url: string;
  source?: string;
}

export interface AssetInsight {
  symbol: string;
  /** "ai" = gerado pelo Claude; "auto" = texto automático com os números (sem IA). */
  kind: "ai" | "auto";
  direction: "alta" | "queda" | "estavel";
  title: string;
  summary: string;
  drivers: { text: string; sources: InsightSource[] }[];
  confidence?: "alta" | "media" | "baixa";
  /** Variação do ativo quando o resumo foi gerado (para saber se ainda vale). */
  changePct: number;
  generatedAt: number;
  model?: string;
  /** Por que não há resumo de IA (sem chave, erro da API...). */
  notice?: string;
}
