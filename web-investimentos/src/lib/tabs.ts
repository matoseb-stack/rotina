export const TABS = [
  { id: "acoes", label: "Ações", title: "B3 · Ações", icon: "chart" },
  { id: "internacional", label: "Internacional", title: "Mercado Internacional", icon: "globe" },
  { id: "cripto", label: "Cripto", title: "Criptomoedas", icon: "coin" },
  { id: "tesouro", label: "Tesouro", title: "Tesouro Direto", icon: "shield" },
  { id: "noticias", label: "Notícias", title: "Central de Notícias", icon: "news" },
] as const;

export type Tab = (typeof TABS)[number];
export type TabId = Tab["id"];
