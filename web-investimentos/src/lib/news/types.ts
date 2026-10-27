export type NewsCategory =
  | "Copom"
  | "Câmbio"
  | "Política Fiscal"
  | "Inflação"
  | "Tesouro"
  | "Empresas"
  | "Commodities"
  | "Economia";

export type NewsFilter = "all" | "macro" | "acoes" | "cambio" | "tesouro";

export type NewsImpact = "alto" | "medio" | "baixo";

export interface NewsSource {
  name: string;
  /** "folha" = manchete real do RSS; "simulado" = conteúdo de demonstração. */
  kind: "folha" | "simulado";
}

export interface NewsItem {
  id: string;
  title: string;
  /** Resumo executivo de uma linha. */
  summary: string;
  /** Trecho completo disponibilizado pelo feed, mostrado no leitor. */
  excerpt: string;
  url: string;
  author?: string;
  publishedAt: number;
  category: NewsCategory;
  filter: Exclude<NewsFilter, "all">;
  impact: NewsImpact;
  source: NewsSource;
}

export interface NewsFeed {
  items: NewsItem[];
  source: NewsSource["kind"];
  fetchedAt: number;
  /** Preenchido quando o feed real falhou e o simulado entrou no lugar. */
  notice?: string;
}

export const FOLHA_MERCADO_URL = "https://www1.folha.uol.com.br/mercado/";

export const NEWS_FILTERS: { id: NewsFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "macro", label: "Macro" },
  { id: "acoes", label: "Ações" },
  { id: "cambio", label: "Câmbio" },
  { id: "tesouro", label: "Tesouro" },
];

export const CATEGORY_COLORS: Record<NewsCategory, string> = {
  Copom: "#B026FF",
  "Câmbio": "#00F0FF",
  "Política Fiscal": "#FF2BD6",
  "Inflação": "#FF9F1C",
  Tesouro: "#8B7CFF",
  Empresas: "#C6FF00",
  Commodities: "#FFE600",
  Economia: "#7DD3FC",
};
