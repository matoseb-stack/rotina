import { classify } from "./classify";
import { FOLHA_MERCADO_URL, type NewsFeed, type NewsItem } from "./types";

/**
 * Manchetes fictícias usadas só quando nenhum veículo responde (offline,
 * bloqueio de rede). Ficam marcadas como "Simulado" e nunca são atribuídas
 * a um veículo real.
 */
const TEMPLATES: { title: string; excerpt: string }[] = [
  { title: "Copom sinaliza manutenção da Selic e reforça cautela com expectativas de inflação", excerpt: "Comunicado destaca que o comitê seguirá vigilante." },
  { title: "Dólar recua com fluxo estrangeiro para a Bolsa e alívio no exterior", excerpt: "A moeda americana perde força frente ao real." },
  { title: "Ibovespa sobe puxado por bancos e Petrobras após dados de atividade", excerpt: "Volume negociado fica acima da média." },
  { title: "Fed mantém juros e Powell diz que decisões seguirão os dados", excerpt: "Wall Street reage com alta das Big Techs." },
  { title: "Tesouro Direto: taxas de títulos IPCA+ voltam a superar 7% ao ano", excerpt: "Prêmio dos papéis atrelados à inflação segue alto." },
  { title: "Nvidia e Microsoft lideram ganhos no S&P 500 com otimismo sobre IA", excerpt: "Nasdaq renova máxima." },
];

export function buildMockFeed(now = Date.now(), notice?: string): NewsFeed {
  const items: NewsItem[] = TEMPLATES.map((t, i) => ({
    id: `mock-${i}`,
    title: t.title,
    summary: t.excerpt,
    url: FOLHA_MERCADO_URL,
    publishedAt: now - (i * 11 + 3) * 60_000,
    source: { id: "simulado", name: "Simulado" },
    lang: "pt",
    simulated: true,
    ...classify(t.title, t.excerpt),
  }));
  return { items, fetchedAt: now, sources: [], simulated: true, notice };
}
