export const NEON = {
  lime: "#C6FF00",
  cyan: "#00F0FF",
  purple: "#B026FF",
  pink: "#FF2BD6",
  red: "#FF3B6B",
} as const;

export const TABS = [
  { id: "b3", number: "01", label: "B3 / Ações", short: "B3", subtitle: "Blue chips em tempo real", accent: NEON.lime, icon: "chart" },
  { id: "movers", number: "02", label: "Top Gainers/Losers", short: "Destaques", subtitle: "Maiores altas e baixas", accent: NEON.cyan, icon: "bars" },
  { id: "tesouro", number: "03", label: "Tesouro Direto", short: "Tesouro", subtitle: "Selic · IPCA+ · Prefixado", accent: NEON.purple, icon: "shield" },
  { id: "news", number: "04", label: "Intelligence Wire", short: "Notícias", subtitle: "Folha Mercado ao vivo", accent: NEON.pink, icon: "wire" },
] as const;

export type Tab = (typeof TABS)[number];
export type TabId = Tab["id"];
export type TabIcon = Tab["icon"];

export const trendColor = (value: number) => (value >= 0 ? NEON.lime : NEON.red);
