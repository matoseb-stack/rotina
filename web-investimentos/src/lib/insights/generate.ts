import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { fetchYahooChart } from "../market/real/yahoo";
import { quoteFromYahoo, QUOTES_REVALIDATE } from "../market/real/market";
import { DETAIL_SEEDS, FX_SEED, GLOBAL_INDEX_SEEDS, INDEX_SEED } from "../market/seeds";
import type { Quote, StockSeed } from "../market/types";
import { fetchAllNews } from "../news/aggregate";
import { fetchCompanyNews } from "../news/companies";
import { fetchGlobalAssetNews } from "../news/global-assets";
import type { AssetInsight, InsightSource } from "./types";

/** Modelo e validade do resumo: ajustáveis por variável de ambiente. */
const MODEL = process.env.INSIGHT_MODEL || "claude-opus-5-5";
const TTL_MS = Number(process.env.INSIGHT_TTL_MINUTES || 180) * 60_000;
/** Site já publicado (ex.: GitHub Pages): no export estático, reaproveita o resumo anterior se ainda valer. */
const REUSE_URL = process.env.INSIGHTS_REUSE_URL?.replace(/\/$/, "");

const hasCredentials = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const InsightSchema = z.object({
  direction: z.enum(["alta", "queda", "estavel"]),
  title: z.string().describe("Manchete curta do movimento, até ~80 caracteres, em português"),
  summary: z.string().describe("2 a 3 frases explicando o movimento de hoje"),
  drivers: z
    .array(
      z.object({
        text: z.string().describe("Um fator concreto, em uma frase"),
        sources: z.array(z.number().int()).describe("Números [n] das manchetes que sustentam o fator; vazio se vier só dos números"),
      }),
    )
    .describe("Até 3 fatores, do mais para o menos importante"),
  confidence: z.enum(["alta", "media", "baixa"]).describe("Quão bem as manchetes explicam o movimento"),
});

const SYSTEM = `Você é um analista de mercado que explica, em português do Brasil e para investidores pessoa física, por que uma ação ou ETF está subindo ou caindo hoje.

Use apenas os dados fornecidos: cotação, índice de referência, dólar, ações do mesmo setor e manchetes numeradas. Cite as manchetes pelo número quando elas sustentarem um fator. Se nenhuma manchete explica o movimento, diga isso com clareza e explique pelo que os números mostram (acompanha o índice, o setor ou o dólar; movimento isolado sem notícia identificada). Não invente fatos, números ou notícias que não estejam nos dados.

Seja direto e didático: frases curtas, sem jargão desnecessário. Não faça recomendação de compra ou venda nem previsão de preço.`;

const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2).replace(".", ",")}%`;

async function quoteOf(seed: StockSeed): Promise<Quote | null> {
  try {
    return quoteFromYahoo(seed, await fetchYahooChart(seed, "1d", "5m", QUOTES_REVALIDATE));
  } catch {
    return null;
  }
}

interface Context {
  seed: StockSeed;
  quote: Quote;
  benchmark: Quote | null;
  fx: Quote | null;
  peers: Quote[];
  headlines: InsightSource[];
  /** Manchetes com data, para o prompt. */
  headlineLines: string[];
}

async function buildContext(seed: StockSeed): Promise<Context | null> {
  const us = seed.market === "us";
  const benchmarkSeed = us ? GLOBAL_INDEX_SEEDS[0] : INDEX_SEED;
  const peerSeeds = DETAIL_SEEDS.filter((s) => s.symbol !== seed.symbol && s.sector === seed.sector && s.market === seed.market).slice(0, 3);
  const [quote, benchmark, fx, peers, assetNews, market] = await Promise.all([
    quoteOf(seed),
    quoteOf(benchmarkSeed),
    quoteOf(FX_SEED),
    Promise.all(peerSeeds.map(quoteOf)),
    us ? fetchGlobalAssetNews(seed.symbol) : fetchCompanyNews(seed.symbol),
    fetchAllNews().catch(() => null),
  ]);
  if (!quote || quote.stale) return null;

  const headlines: InsightSource[] = [];
  const headlineLines: string[] = [];
  const add = (title: string, url: string, source: string | undefined, when: number | null, summary?: string) => {
    if (headlines.some((h) => h.url === url)) return;
    headlines.push({ title, url, source });
    const date = when ? new Date(when).toISOString().slice(0, 16).replace("T", " ") + " UTC" : "data desconhecida";
    headlineLines.push(`[${headlines.length}] (${source ?? "fonte"}, ${date}) ${title}${summary ? ` — ${summary}` : ""}`);
  };
  for (const it of assetNews.items.slice(0, 8)) add(it.title, it.url, it.source ?? assetNews.sourceLabel, it.publishedAt, it.summary);
  // Contexto macro: manchetes recentes de alto impacto da região do ativo.
  for (const it of (market?.items ?? []).filter((i) => !i.simulated && i.impact === "alto" && (us ? i.filter === "global" : i.filter !== "global")).slice(0, 6)) {
    add(it.title, it.url, it.source.name, it.publishedAt, it.summary);
  }
  return { seed, quote, benchmark, fx, peers: peers.filter((p): p is Quote => p !== null && !p.stale), headlines, headlineLines };
}

function promptFor(c: Context): string {
  const q = c.quote;
  const money = (v: number) => `${q.currency === "USD" ? "US$" : "R$"} ${v.toFixed(2).replace(".", ",")}`;
  const lines = [
    `Ativo: ${q.symbol} — ${q.name} (${q.kind === "etf" ? `ETF que acompanha ${q.sector}` : `setor: ${q.sector}`}; ${q.market === "us" ? "bolsa dos EUA" : "B3"})`,
    `Hoje: ${pct(q.changePct)} (${money(q.price)}; fechamento anterior ${money(q.previousClose)}; abertura ${money(q.open)}; mínima ${money(q.dayLow)}; máxima ${money(q.dayHigh)})`,
    q.fiftyTwoWeekLow && q.fiftyTwoWeekHigh ? `Faixa de 52 semanas: ${money(q.fiftyTwoWeekLow)} a ${money(q.fiftyTwoWeekHigh)}` : "",
    c.benchmark ? `${c.benchmark.name} hoje: ${pct(c.benchmark.changePct)}` : "",
    c.fx ? `Dólar (USD/BRL) hoje: ${pct(c.fx.changePct)}` : "",
    c.peers.length ? `Mesmo setor: ${c.peers.map((p) => `${p.symbol} ${pct(p.changePct)}`).join("; ")}` : "Mesmo setor: sem pares acompanhados.",
    "Manchetes (as primeiras são sobre o ativo; as últimas, contexto de mercado):",
    ...(c.headlineLines.length ? c.headlineLines : ["(nenhuma manchete disponível)"]),
    `Explique por que ${q.symbol} está ${q.changePct > 0.15 ? "subindo" : q.changePct < -0.15 ? "caindo" : "estável"} hoje.`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** Texto automático (sem IA) com os números do dia: usado sem chave de API ou se a API falhar. */
function autoInsight(c: Context, notice: string): AssetInsight {
  const q = c.quote;
  const direction = q.changePct > 0.15 ? "alta" : q.changePct < -0.15 ? "queda" : "estavel";
  const verb = direction === "alta" ? "sobe" : direction === "queda" ? "cai" : "fica estável";
  const parts = [`${q.symbol} ${verb}${direction === "estavel" ? "" : ` ${pct(Math.abs(q.changePct)).replace("+", "")}`} hoje.`];
  if (c.benchmark) {
    const diff = q.changePct - c.benchmark.changePct;
    const same = Math.sign(q.changePct) === Math.sign(c.benchmark.changePct);
    parts.push(
      Math.abs(diff) < 0.5 && same
        ? `O movimento acompanha o ${c.benchmark.name} (${pct(c.benchmark.changePct)}).`
        : `O ${c.benchmark.name} varia ${pct(c.benchmark.changePct)}, então o ativo ${diff > 0 ? "vai melhor" : "vai pior"} que o mercado.`,
    );
  }
  const peersSame = c.peers.filter((p) => Math.sign(p.changePct) === Math.sign(q.changePct));
  if (c.peers.length && peersSame.length === c.peers.length) {
    parts.push(`O setor vai na mesma direção: ${c.peers.map((p) => `${p.symbol} ${pct(p.changePct)}`).join(", ")}.`);
  }
  const drivers = c.headlines.slice(0, 2).map((h) => ({ text: `Manchete recente: ${h.title}`, sources: [h] }));
  return {
    symbol: q.symbol,
    kind: "auto",
    direction,
    title: `${q.symbol} ${verb} ${direction === "estavel" ? "" : pct(Math.abs(q.changePct)).replace("+", "")}`.trim(),
    summary: parts.join(" "),
    drivers,
    changePct: q.changePct,
    generatedAt: Date.now(),
    notice,
  };
}

async function aiInsight(c: Context): Promise<AssetInsight> {
  const client = new Anthropic({ timeout: 60_000, maxRetries: 2 });
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    // Em caso de recusa dos classificadores de segurança, o servidor tenta o modelo recomendado.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    output_config: { effort: "low", format: betaZodOutputFormat(InsightSchema) },
    messages: [{ role: "user", content: promptFor(c) }],
  });
  if (response.stop_reason === "refusal") throw new Error("O modelo recusou o pedido.");
  const out = response.parsed_output;
  if (!out) throw new Error(`Resposta sem JSON válido (stop_reason: ${response.stop_reason}).`);
  const pick = (ns: number[]) => [...new Set(ns)].map((n) => c.headlines[n - 1]).filter((h): h is InsightSource => Boolean(h));
  return {
    symbol: c.quote.symbol,
    kind: "ai",
    direction: out.direction,
    title: out.title,
    summary: out.summary,
    drivers: out.drivers.slice(0, 3).map((d) => ({ text: d.text, sources: pick(d.sources) })),
    confidence: out.confidence,
    changePct: c.quote.changePct,
    generatedAt: Date.now(),
    model: response.model,
  };
}

/** Resumo anterior publicado: vale se for de IA, recente e da mesma direção/intensidade. */
async function reusable(symbol: string, changePct: number): Promise<AssetInsight | null> {
  if (!REUSE_URL) return null;
  try {
    const res = await fetch(`${REUSE_URL}/api/insights/${symbol}.json`, { signal: AbortSignal.timeout(8_000), cache: "no-store" });
    if (!res.ok) return null;
    const prev = (await res.json()) as AssetInsight;
    const fresh = Date.now() - prev.generatedAt < TTL_MS;
    const similar = Math.sign(prev.changePct) === Math.sign(changePct) && Math.abs(prev.changePct - changePct) < 1.5;
    return prev.kind === "ai" && fresh && similar ? prev : null;
  } catch {
    return null;
  }
}

export async function generateInsight(seed: StockSeed): Promise<AssetInsight | null> {
  const context = await buildContext(seed);
  if (!context) return null;
  const previous = await reusable(seed.symbol, context.quote.changePct);
  if (previous) return previous;
  if (!hasCredentials()) {
    return autoInsight(context, "Resumo de IA desativado: defina ANTHROPIC_API_KEY para ativar.");
  }
  try {
    return await aiInsight(context);
  } catch (error) {
    const reason =
      error instanceof Anthropic.AuthenticationError
        ? "chave da API inválida"
        : error instanceof Anthropic.RateLimitError
          ? "limite de uso da API atingido"
          : error instanceof Anthropic.APIError
            ? `API respondeu ${error.status}`
            : error instanceof Error
              ? error.message
              : "erro desconhecido";
    console.warn(`[insights] ${seed.symbol}: ${reason}`);
    return autoInsight(context, `Resumo de IA indisponível agora (${reason}).`);
  }
}
