export const TABS = [
  { id: "acoes", label: "Ações", title: "B3 · Ações", icon: "chart" },
  { id: "tesouro", label: "Tesouro", title: "Tesouro Direto", icon: "shield" },
  { id: "noticias", label: "Notícias", title: "Notícias do mercado", icon: "news" },
] as const;

export type Tab = (typeof TABS)[number];
export type TabId = Tab["id"];
