import type { NewsCategory, NewsImpact, NewsItem } from "./types";

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Regras em ordem de prioridade: a primeira que casar define a categoria. */
const RULES: { category: NewsCategory; filter: NewsItem["filter"]; pattern: RegExp }[] = [
  { category: "Copom", filter: "macro", pattern: /\b(copom|selic|banco central|galipolo|politica monetaria|taxa basica|juros basicos)\b/ },
  { category: "Câmbio", filter: "cambio", pattern: /\b(dolar|cambio|cambial|euro|moeda americana|real se (valoriza|desvaloriza))\b/ },
  { category: "Tesouro", filter: "tesouro", pattern: /\b(tesouro direto|titulos? publicos?|ntn-?b|prefixad\w*|renda fixa|cdbs?|lcis?|lcas?|cras?|cris?|debentures?|curva de juros|juros futuros|di futuro)\b/ },
  { category: "Política Fiscal", filter: "macro", pattern: /\b(fiscal|arcabouco|orcamento|gastos? publicos?|haddad|fazenda|tribut\w*|impostos?|imposto de renda|deficit|superavit|divida publica|ldo|loa|reforma)\b/ },
  { category: "Inflação", filter: "macro", pattern: /\b(inflacao|ipca|igp-?m|inpc|precos ao consumidor)\b/ },
  { category: "Commodities", filter: "acoes", pattern: /\b(petroleo|brent|minerio|cafe|acucar|soja|milho|ouro|commodit\w*|boi gordo)\b/ },
  { category: "Empresas", filter: "acoes", pattern: /\b(bolsa|ibovespa|acoes|acao|b3|lucro|prejuizo|balanco|trimestre|resultado|dividendos?|ipo|fusao|aquisicao|empresa|companhia|petrobras|vale|itau|bradesco|weg|ambev|embraer)\b/ },
];

const HIGH_IMPACT = /\b(copom|selic|banco central|dolar|ibovespa|fiscal|arcabouco|ipca|inflacao|juros|petrobras|vale|recessao|pib|rating)\b/;
const MEDIUM_IMPACT = /\b(lucro|balanco|trimestre|resultado|dividendos?|petroleo|minerio|tesouro|emprego|desemprego|varejo|credito)\b/;

export function classify(title: string, body: string): Pick<NewsItem, "category" | "filter" | "impact"> {
  const headline = normalize(title);
  const text = `${headline} ${normalize(body)}`;
  // A manchete pesa mais que o corpo: tenta nela primeiro.
  const rule = RULES.find((r) => r.pattern.test(headline)) ?? RULES.find((r) => r.pattern.test(text));
  const impact: NewsImpact = HIGH_IMPACT.test(headline) ? "alto" : MEDIUM_IMPACT.test(text) ? "medio" : "baixo";
  return rule ? { category: rule.category, filter: rule.filter, impact } : { category: "Economia", filter: "macro", impact };
}

/** Primeira frase, limitada a ~170 caracteres: o "resumo executivo de 1 linha". */
export function executiveSummary(text: string, max = 170): string {
  const first = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  return first.length <= max ? first : `${first.slice(0, max).replace(/\s+\S*$/, "")}…`;
}
