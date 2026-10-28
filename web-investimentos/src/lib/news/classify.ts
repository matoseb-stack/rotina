import type { NewsCategory, NewsImpact, NewsItem } from "./types";

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Regras em ordem de prioridade (português e inglês): a primeira que casar define a categoria. */
const RULES: { category: NewsCategory; pattern: RegExp }[] = [
  { category: "Cripto", pattern: /\b(bitcoin|btc|ethereum|ether|solana|cardano|xrp|ripple|tether|usdt|usdc|stablecoins?|cripto\w*|crypto\w*|blockchain|halving|defi|altcoins?|memecoins?|binance|coinbase|tokeniza\w*)\b/ },
  { category: "Fed & BCs", pattern: /\b(fed|fomc|federal reserve|powell|banco central europeu|bce|ecb|lagarde|bank of japan|boj|bank of england)\b/ },
  { category: "Copom", pattern: /\b(copom|selic|galipolo|banco central|politica monetaria|juros basicos)\b/ },
  { category: "Inflação", pattern: /\b(inflacao|ipca(-15)?|igp-?m|inpc|cpi|pce|inflation|consumer prices)\b/ },
  { category: "Câmbio", pattern: /\b(dolar|cambio|cambial|currenc(y|ies)|dollar|forex|yen|yuan|euro)\b/ },
  { category: "Renda Fixa", pattern: /\b(tesouro direto|titulos publicos|tesouro nacional|ntn-?b|renda fixa|cdbs?|lcis?|lcas?|cras?|cris?|debentures?|treasur(y|ies)|bonds?|yields?|juros futuros|di futuro|curva de juros|credito privado)\b/ },
  { category: "Política Fiscal", pattern: /\b(fiscal|arcabouco|orcamento|haddad|deficit|superavit|divida publica|tribut\w*|impostos?|imposto de renda|budget|tariffs?|tarifas?|shutdown|debt ceiling)\b/ },
  { category: "Commodities", pattern: /\b(petroleo|brent|oil|crude|opec|opep|gold|ouro|minerio|iron ore|soja|milho|cafe|acucar|copper|cobre|commodit\w*)\b/ },
  { category: "Empresas", pattern: /\b(lucro|prejuizo|balanco|resultados?|trimestre|earnings|revenue|profit|ipo|merger|acquisition|aquisicao|fusao|dividendos?|dividends?|guidance|ceo)\b/ },
  { category: "Mercados", pattern: /\b(bolsas?|ibovespa|acoes|acao|papeis|stocks?|wall street|s&p|nasdaq|dow|shares|markets?|rally|selloff|sell-off)\b/ },
  { category: "Política", pattern: /\b(eleic\w*|elections?|stf|congresso|senado|camara|lula|bolsonaro|tse|trump|white house|casa branca|governo)\b/ },
];

/** Termos que puxam uma notícia brasileira para o filtro "EUA & Global". */
const GLOBAL_TERMS = /\b(eua|estados unidos|wall street|nasdaq|s&p|dow jones|fed|trump|china|europa|global|apple|nvidia|microsoft|tesla|amazon|alphabet|google|meta)\b/;

const HIGH_IMPACT = /\b(halving|sec|etfs? (de|of) (bitcoin|ether\w*|solana|xrp)|spot etf|hack\w*|liquida\w*|all-time high|recorde|copom|selic|fomc|fed|federal reserve|powell|galipolo|cpi|ipca|payrolls?|inflation|inflacao|juros|interest rates?|rate (cut|hike)s?|recess\w*|pib|gdp|circuit breaker|default|tariffs?|tarifas?|crash\w*|plunge\w*|tumbl\w*|soar\w*|surge\w*|dispara\w*|desaba\w*|derrete\w*|despenca\w*|ibovespa|s&p 500|dolar|dollar)\b/;
const MEDIUM_IMPACT = /\b(earnings|lucro|resultados?|balanco|dividend\w*|guidance|petroleo|oil|bolsas?|stocks?|acoes|shares|yields?|treasur(y|ies)|bonds?|minerio|commodit\w*|credito|emprego|desemprego|jobs)\b/;

export function classify(
  title: string,
  body: string,
  region: "br" | "intl" = "br",
  cryptoSource = false,
): Pick<NewsItem, "category" | "filter" | "impact"> {
  const headline = normalize(title);
  const text = `${headline} ${normalize(body)}`;
  // Portais de cripto: tudo é "Cripto". Nos demais, a manchete pesa mais que o corpo.
  const rules = cryptoSource ? RULES : RULES.filter((r) => r.category !== "Cripto" || r.pattern.test(headline));
  const category = cryptoSource
    ? "Cripto"
    : ((rules.find((r) => r.pattern.test(headline)) ?? rules.find((r) => r.pattern.test(text)))?.category ?? "Economia");
  const impact: NewsImpact = HIGH_IMPACT.test(headline) ? "alto" : MEDIUM_IMPACT.test(text) ? "medio" : "neutro";
  return { category, filter: filterFor(category, region, text), impact };
}

function filterFor(category: NewsCategory, region: "br" | "intl", text: string): NewsItem["filter"] {
  if (category === "Cripto") return "cripto";
  if (category === "Câmbio" || category === "Renda Fixa") return "rendafixa";
  if (region === "intl" || category === "Fed & BCs") return "global";
  if (category === "Empresas" || category === "Commodities" || category === "Mercados") return GLOBAL_TERMS.test(text) ? "global" : "acoes";
  return GLOBAL_TERMS.test(text) && category !== "Copom" ? "global" : "macro";
}
