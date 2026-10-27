import { classify } from "./classify";
import { FOLHA_MERCADO_URL, type NewsFeed, type NewsItem } from "./types";

/**
 * Manchetes fictícias usadas quando o RSS real não está acessível
 * (offline, hospedagem estática, bloqueio de rede). Ficam marcadas como
 * "Simulado" e nunca são atribuídas à Folha.
 */
const TEMPLATES: { title: string; excerpt: string }[] = [
  { title: "Copom sinaliza manutenção da Selic e reforça cautela com expectativas de inflação", excerpt: "Comunicado destaca que o comitê seguirá vigilante e que a política monetária permanecerá contracionista por período prolongado. Mercado de juros futuros reage com queda nos vértices curtos." },
  { title: "Dólar recua com fluxo estrangeiro para a Bolsa e alívio no exterior", excerpt: "A moeda americana perde força frente ao real em dia de apetite por risco global. Analistas citam entrada de capital em ações de commodities e diferencial de juros elevado." },
  { title: "Ibovespa sobe puxado por bancos e Petrobras após dados de atividade", excerpt: "O principal índice da Bolsa brasileira avança com destaque para papéis do setor financeiro. Volume negociado fica acima da média dos últimos 20 pregões." },
  { title: "Governo apresenta ajustes no Orçamento para cumprir meta do arcabouço fiscal", excerpt: "Equipe econômica anuncia bloqueio adicional de despesas discricionárias. Agentes avaliam se o esforço será suficiente para estabilizar a dívida pública." },
  { title: "Tesouro Direto: taxas de títulos IPCA+ voltam a superar 7% ao ano", excerpt: "Prêmio dos papéis atrelados à inflação segue em patamar historicamente alto. Gestores apontam janela atrativa para investidores de longo prazo." },
  { title: "IPCA-15 desacelera e vem abaixo da mediana das projeções", excerpt: "Alimentação e combustíveis contribuíram para o alívio do indicador. Núcleos de inflação, porém, seguem pressionados por serviços." },
  { title: "Vale eleva produção de minério de ferro no trimestre e mantém guidance", excerpt: "Mineradora reporta embarques acima do esperado. Preço do minério na China segue como principal variável para os resultados." },
  { title: "Petróleo Brent avança com tensões na oferta e estoques menores nos EUA", excerpt: "A commodity sobe pelo terceiro pregão seguido. Ações de petroleiras listadas na B3 acompanham o movimento." },
  { title: "Curva de juros fecha inclinada com incerteza fiscal no radar", excerpt: "Taxas de DI futuro de prazo longo sobem enquanto as curtas recuam. Investidores aguardam detalhes sobre o cumprimento da meta de resultado primário." },
  { title: "Bancos projetam alta do lucro com crédito resiliente e inadimplência estável", excerpt: "Temporada de balanços do setor financeiro começa com expectativa de rentabilidade elevada. Provisões devem ficar estáveis no trimestre." },
];

const MOCK_SOURCE = { name: "Simulado", kind: "simulado" } as const;

export function buildMockFeed(now = Date.now(), notice?: string): NewsFeed {
  const items: NewsItem[] = TEMPLATES.map((t, i) => ({
    id: `mock-${i}`,
    title: t.title,
    summary: t.excerpt.split(/(?<=[.!?])\s+/)[0],
    excerpt: t.excerpt,
    // Sem link de matéria: o leitor aponta só para a capa de Mercado da Folha.
    url: FOLHA_MERCADO_URL,
    publishedAt: now - (i * 11 + 3) * 60_000,
    source: MOCK_SOURCE,
    ...classify(t.title, t.excerpt),
  }));
  return { items, source: "simulado", fetchedAt: now, notice };
}
