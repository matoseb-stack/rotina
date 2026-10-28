/**
 * Veículos da central de notícias. Compartilhado entre servidor (feeds) e
 * cliente (nome, selo, cor). Todos os links levam à matéria original.
 */
export interface NewsSourceDef {
  id: string;
  name: string;
  /** Texto curto do selo (quando o ícone do site não carrega). */
  short: string;
  region: "br" | "intl";
  /** Portal especializado em cripto: notícias entram no filtro "Cripto". */
  crypto?: boolean;
  lang: "pt" | "en";
  color: string;
  /** Domínio oficial: valida links e busca o ícone do site. */
  domain: string;
  homepage: string;
  /** Feeds RSS/Atom oficiais. */
  feeds: string[];
  /** Busca no Google News (site:...) quando o veículo não tem RSS aberto. */
  googleNews?: string;
  /** Observação exibida na interface (ex.: limitações da fonte). */
  note?: string;
  /** Idade máxima das manchetes, em dias (padrão: 4). Para veículos que publicam pouco. */
  maxAgeDays?: number;
}

const gnews = (q: string) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

export const NEWS_SOURCES: NewsSourceDef[] = [
  {
    id: "valor", name: "Valor Econômico", short: "VALOR", region: "br", lang: "pt", color: "#0B5E3C",
    domain: "valor.globo.com", homepage: "https://valor.globo.com/", feeds: ["https://valor.globo.com/rss/valor"],
  },
  {
    id: "folha", name: "Folha de S.Paulo", short: "FOLHA", region: "br", lang: "pt", color: "#111111",
    domain: "folha.uol.com.br", homepage: "https://www1.folha.uol.com.br/mercado/", feeds: ["https://feeds.folha.uol.com.br/mercado/rss091.xml"],
  },
  {
    id: "infomoney", name: "InfoMoney", short: "IM", region: "br", lang: "pt", color: "#1E3A8A",
    domain: "infomoney.com.br", homepage: "https://www.infomoney.com.br/", feeds: ["https://www.infomoney.com.br/feed/"],
  },
  {
    id: "investing", name: "Investing.com Brasil", short: "INV", region: "br", lang: "pt", color: "#E9A000",
    domain: "br.investing.com", homepage: "https://br.investing.com/news/",
    feeds: ["https://br.investing.com/rss/news.rss", "https://br.investing.com/rss/news_25.rss"],
  },
  {
    id: "estadao", name: "Estadão Economia", short: "ESTADÃO", region: "br", lang: "pt", color: "#0F172A",
    domain: "estadao.com.br", homepage: "https://www.estadao.com.br/economia/",
    feeds: ["https://www.estadao.com.br/arc/outboundfeeds/feeds/rss/sections/economia/"],
    note: "O Broadcast (agência do Estadão) é exclusivo para assinantes do terminal; usamos o feed público de Economia do Estadão.",
  },
  {
    id: "bloomberg", name: "Bloomberg", short: "BBG", region: "intl", lang: "en", color: "#000000",
    domain: "bloomberg.com", homepage: "https://www.bloomberg.com/markets", feeds: ["https://feeds.bloomberg.com/markets/news.rss"],
  },
  {
    id: "reuters", name: "Reuters", short: "REUTERS", region: "intl", lang: "en", color: "#FF8000",
    domain: "reuters.com", homepage: "https://www.reuters.com/markets/", feeds: [],
    googleNews: gnews("site:reuters.com (markets OR business OR economy) when:2d"),
    note: "A Reuters encerrou seus feeds RSS; as manchetes vêm da busca do Google News e o link abre a matéria na Reuters.",
  },
  {
    id: "cnbc", name: "CNBC", short: "CNBC", region: "intl", lang: "en", color: "#005594",
    domain: "cnbc.com", homepage: "https://www.cnbc.com/markets/", feeds: ["https://www.cnbc.com/id/10000664/device/rss/rss.html"],
    googleNews: gnews("site:cnbc.com (markets OR stocks OR economy) when:2d"),
  },
  {
    id: "ft", name: "Financial Times", short: "FT", region: "intl", lang: "en", color: "#990F3D",
    domain: "ft.com", homepage: "https://www.ft.com/markets", feeds: ["https://www.ft.com/markets?format=rss"],
  },
  {
    id: "wsj", name: "Wall Street Journal", short: "WSJ", region: "intl", lang: "en", color: "#222222",
    domain: "wsj.com", homepage: "https://www.wsj.com/finance", feeds: ["https://feeds.content.dowjones.io/public/rss/RSSMarketsMain"],
  },
  {
    id: "coindesk", name: "CoinDesk", short: "CD", region: "intl", lang: "en", color: "#1A1A1A", crypto: true,
    domain: "coindesk.com", homepage: "https://www.coindesk.com/", feeds: ["https://www.coindesk.com/arc/outboundfeeds/rss"],
  },
  {
    id: "cointelegraph", name: "Cointelegraph Brasil", short: "CT", region: "br", lang: "pt", color: "#1D1D1B", crypto: true,
    domain: "cointelegraph.com.br", homepage: "https://cointelegraph.com.br/", feeds: ["https://cointelegraph.com.br/rss"],
  },
  {
    id: "criptofacil", name: "CriptoFácil", short: "CF", region: "br", lang: "pt", color: "#0B7A3E", crypto: true,
    domain: "criptofacil.com", homepage: "https://www.criptofacil.com/", feeds: ["https://www.criptofacil.com/feed/"],
    maxAgeDays: 45,
    note: "A CriptoFácil está publicando pouco: o feed oficial não traz matérias novas desde o fim de setembro de 2026, por isso as manchetes dela podem ser antigas.",
  },
];

export const SOURCE_BY_ID = new Map(NEWS_SOURCES.map((s) => [s.id, s]));

/** Ícone oficial do site (via serviço de favicons do Google). */
export const sourceIcon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
