import type { Quote } from "./types";

export const PERIODS = ["1D", "5D", "1M", "6M", "1Y", "ALL"] as const;
export type Period = (typeof PERIODS)[number];

export interface HistoryPoint {
  t: number;
  price: number;
}

interface PeriodSpec {
  points: number;
  /** Passo entre pontos, em ms. */
  stepMs: number;
  /** Volatilidade por passo (log-retorno). */
  vol: number;
  /** Amplitude do ponto inicial em relação ao preço atual. */
  startRange: number;
}

const DAY = 86_400_000;
const SPECS: Record<Exclude<Period, "1D">, PeriodSpec> = {
  "5D": { points: 5 * 14, stepMs: 30 * 60_000, vol: 0.004, startRange: 0.05 },
  "1M": { points: 22, stepMs: DAY, vol: 0.016, startRange: 0.09 },
  "6M": { points: 126, stepMs: DAY, vol: 0.016, startRange: 0.22 },
  "1Y": { points: 252, stepMs: DAY, vol: 0.017, startRange: 0.32 },
  ALL: { points: 260, stepMs: 7 * DAY, vol: 0.038, startRange: 0.65 },
};

/** PRNG determinístico (mulberry32): o mesmo ativo + período gera sempre o mesmo desenho. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function gaussian(rand: () => number): number {
  return Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
}

/**
 * Ponte browniana em escala log: começa em `start`, termina exatamente em `end`.
 * Assim o desenho é estável entre ticks e o último ponto acompanha o preço ao vivo.
 */
function bridge(rand: () => number, n: number, vol: number, start: number, end: number): number[] {
  const walk = [0];
  for (let i = 1; i < n; i++) walk.push(walk[i - 1] + gaussian(rand) * vol);
  const target = Math.log(end / start);
  const drift = target - walk[n - 1];
  return walk.map((w, i) => start * Math.exp(w + (drift * i) / (n - 1)));
}

/** Pregão da B3 (10h–17h BRT) de hoje, até o instante atual. */
function intradayTimes(now: number): number[] {
  const brt = new Date(now - 3 * 3_600_000);
  const open = Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), brt.getUTCDate(), 13, 0); // 10h BRT
  const close = open + 7 * 3_600_000;
  const end = Math.min(Math.max(now, open + 30 * 60_000), close);
  const times: number[] = [];
  for (let t = open; t < end; t += 5 * 60_000) times.push(t);
  times.push(end);
  return times;
}

/** Datas retroativas pulando fins de semana (para períodos diários). */
function tradingTimes(now: number, points: number, stepMs: number): number[] {
  const times: number[] = [];
  let t = now;
  while (times.length < points) {
    const day = new Date(t - 3 * 3_600_000).getUTCDay();
    if (stepMs >= 7 * DAY || (day !== 0 && day !== 6)) times.push(t);
    t -= stepMs;
  }
  return times.reverse();
}

/**
 * Série histórica simulada do ativo. Determinística por ativo/período, ancorada
 * no fechamento anterior (1D) e no preço ao vivo (último ponto).
 */
export function buildHistory(quote: Quote, period: Period, now: number): HistoryPoint[] {
  const rand = mulberry32(hashString(`${quote.symbol}:${period}`));
  if (period === "1D") {
    const times = intradayTimes(now);
    const n = Math.max(times.length, 2);
    const prices = bridge(rand, n, 0.0022, quote.open || quote.previousClose, quote.price);
    return times.map((t, i) => ({ t, price: prices[Math.min(i, prices.length - 1)] }));
  }
  const spec = SPECS[period];
  const start = quote.price * (1 + (rand() * 2 - 1) * spec.startRange);
  const times = tradingTimes(now, spec.points, spec.stepMs);
  const prices = bridge(rand, spec.points, spec.vol, start, quote.price);
  return times.map((t, i) => ({ t, price: prices[i] }));
}
