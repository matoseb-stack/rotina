/** De onde vêm as notícias de cada ativo (compartilhado entre servidor e cliente). */
export interface CompanySource {
  /** Slug de www1.folha.uol.com.br/folha-topicos/<slug>/ (curadoria da própria Folha). */
  topic?: string;
  /** Termo de busca para empresas sem página de tópico. */
  query: string;
  /** Na busca, só entram manchetes que citam um destes nomes (com maiúsculas: "Localiza" ≠ "localiza"). */
  keywords: string[];
}

export const COMPANY_SOURCES: Record<string, CompanySource> = {
  PETR4: { topic: "petrobras", query: "Petrobras", keywords: ["Petrobras"] },
  VALE3: { topic: "vale", query: "Vale mineradora", keywords: ["Vale"] },
  ITUB4: { topic: "itau", query: "Itaú Unibanco", keywords: ["Itaú", "Itau"] },
  WEGE3: { query: "WEG", keywords: ["WEG", "Weg"] },
  BBAS3: { topic: "banco-do-brasil", query: "Banco do Brasil", keywords: ["Banco do Brasil"] },
  BBDC4: { topic: "bradesco", query: "Bradesco", keywords: ["Bradesco"] },
  ABEV3: { topic: "ambev", query: "Ambev", keywords: ["Ambev"] },
  B3SA3: { topic: "b3", query: "B3 bolsa", keywords: ["B3"] },
  RENT3: { query: "Localiza", keywords: ["Localiza"] },
  SUZB3: { query: "Suzano celulose", keywords: ["Suzano"] },
  PRIO3: { query: "PRIO petroleira", keywords: ["Prio", "PRIO", "PetroRio"] },
  MGLU3: { query: "Magazine Luiza", keywords: ["Magazine Luiza", "Magalu"] },
  ELET3: { topic: "eletrobras", query: "Eletrobras", keywords: ["Eletrobras"] },
  RDOR3: { query: "Rede D'Or hospitais", keywords: ["Rede D'Or", "Rede Dor"] },
  EMBR3: { topic: "embraer", query: "Embraer", keywords: ["Embraer"] },
};

export function companyMoreUrl(symbol: string): string {
  const source = COMPANY_SOURCES[symbol];
  if (source?.topic) return `https://www1.folha.uol.com.br/folha-topicos/${source.topic}/`;
  return `https://search.folha.uol.com.br/search?q=${encodeURIComponent(source?.query ?? symbol)}&site=todos`;
}

