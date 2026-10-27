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

/** Tons sóbrios que funcionam nos dois temas (texto na cor, fundo com 10% de opacidade). */
export const CATEGORY_COLORS: Record<NewsCategory, string> = {
  Copom: "#7C3AED",
  "Câmbio": "#0891B2",
  "Política Fiscal": "#DB2777",
  "Inflação": "#D97706",
  Tesouro: "#4F46E5",
  Empresas: "#059669",
  Commodities: "#CA8A04",
  Economia: "#64748B",
};

/** Manchete da Folha sobre um ativo específico (página de tópico ou busca). */
export interface AssetNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: number | null;
}

export interface AssetNewsFeed {
  symbol: string;
  items: AssetNewsItem[];
  /** Página da Folha com mais notícias sobre a empresa. */
  moreUrl: string;
  fetchedAt: number;
  error?: string;
}
