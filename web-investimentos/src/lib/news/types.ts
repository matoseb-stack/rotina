export type NewsCategory =
  | "Copom"
  | "Fed & BCs"
  | "Inflação"
  | "Política Fiscal"
  | "Política"
  | "Câmbio"
  | "Renda Fixa"
  | "Empresas"
  | "Commodities"
  | "Mercados"
  | "Economia";

/** Filtros rápidos da central de notícias. */
export type NewsFilter = "all" | "macro" | "acoes" | "global" | "rendafixa";

export type NewsImpact = "alto" | "medio" | "neutro";

export interface NewsSourceRef {
  /** id em NEWS_SOURCES (ex.: "valor", "bloomberg"). */
  id: string;
  name: string;
}

export interface NewsItem {
  id: string;
  title: string;
  /** Resumo de uma linha (vazio quando o feed não traz descrição). */
  summary: string;
  url: string;
  publishedAt: number;
  category: NewsCategory;
  filter: Exclude<NewsFilter, "all">;
  impact: NewsImpact;
  source: NewsSourceRef;
  lang: "pt" | "en";
  /** Intermediário do link, quando não é direto (ex.: "Google News"). */
  via?: string;
  /** Conteúdo de demonstração (nunca atribuído a um veículo real). */
  simulated?: boolean;
}

export interface NewsSourceStatus {
  id: string;
  name: string;
  ok: boolean;
  count: number;
}

export interface NewsFeed {
  items: NewsItem[];
  fetchedAt: number;
  sources: NewsSourceStatus[];
  /** true quando nenhuma fonte respondeu e o feed é de demonstração. */
  simulated: boolean;
  notice?: string;
}

export const FOLHA_MERCADO_URL = "https://www1.folha.uol.com.br/mercado/";

export const NEWS_FILTERS: { id: NewsFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "macro", label: "Macro & Política" },
  { id: "acoes", label: "B3 / Ações" },
  { id: "global", label: "EUA & Global" },
  { id: "rendafixa", label: "Renda Fixa / Câmbio" },
];

/** Tons sóbrios que funcionam nos dois temas (texto na cor, fundo com 10% de opacidade). */
export const CATEGORY_COLORS: Record<NewsCategory, string> = {
  Copom: "#7C3AED",
  "Fed & BCs": "#2563EB",
  "Inflação": "#D97706",
  "Política Fiscal": "#DB2777",
  Política: "#64748B",
  "Câmbio": "#0891B2",
  "Renda Fixa": "#4F46E5",
  Empresas: "#059669",
  Commodities: "#CA8A04",
  Mercados: "#0D9488",
  Economia: "#64748B",
};

/** Manchete sobre um ativo específico (Folha para a B3, imprensa global para os EUA). */
export interface AssetNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: number | null;
  /** Veículo que publicou (quando o feed agrega vários). */
  source?: string;
}

export interface AssetNewsFeed {
  symbol: string;
  items: AssetNewsItem[];
  /** Quem fornece as manchetes (ex.: "Folha de S.Paulo", "Reuters, Bloomberg, CNBC..."). */
  sourceLabel: string;
  lang: "pt" | "en";
  /** Página com mais notícias sobre o ativo. */
  moreUrl: string;
  moreLabel: string;
  fetchedAt: number;
  error?: string;
}
