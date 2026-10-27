import { BOND_SEEDS, INDEX_SEED, MACRO, STOCK_SEEDS } from "./seeds";
import type { Bond, BondSeed, MarketSnapshot, Quote, StockSeed } from "./types";

const HISTORY_SIZE = 60;

function pushHistory(history: number[], value: number): number[] {
  const next = history.length >= HISTORY_SIZE ? history.slice(1) : history.slice();
  next.push(value);
  return next;
}

/** Normal padrão via Box-Muller. */
function gaussian(random: () => number): number {
  const u = 1 - random();
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function quoteFrom(seed: StockSeed, price: number, prev?: Quote): Quote {
  const change = price - seed.previousClose;
  return {
    symbol: seed.symbol,
    name: seed.name,
    sector: seed.sector,
    about: seed.about,
    brandColor: seed.brandColor,
    previousClose: seed.previousClose,
    open: prev?.open ?? price,
    price,
    dayLow: Math.min(prev?.dayLow ?? price, price),
    dayHigh: Math.max(prev?.dayHigh ?? price, price),
    change,
    changePct: (change / seed.previousClose) * 100,
    history: prev ? pushHistory(prev.history, price) : [price],
  };
}

function bondFrom(seed: BondSeed, rate: number, prev?: Bond): Bond {
  // No Tesouro Selic a "taxa" é só o spread, então o PU quase não reage.
  const sensitivity = seed.kind === "selic" ? seed.duration : seed.duration / (1 + rate / 100);
  const unitPrice = seed.openUnitPrice * (1 - (sensitivity * (rate - seed.openRate)) / 100);
  return {
    id: seed.id,
    kind: seed.kind,
    title: seed.title,
    maturity: seed.maturity,
    openRate: seed.openRate,
    rate,
    unitPrice,
    changeBps: (rate - seed.openRate) * 100,
    // Regra do Tesouro Direto: 1% do PU, com piso de R$ 30.
    minimumInvestment: Math.max(unitPrice * 0.01, 30),
    history: prev ? pushHistory(prev.history, rate) : [rate],
  };
}

/**
 * Passeio aleatório com reversão à média. O estado inicial é determinístico
 * (igual no servidor e no cliente, sem erro de hidratação); a aleatoriedade
 * só entra a partir do primeiro tick, que roda no navegador.
 */
export class MarketSimulator {
  private opens: Map<string, number> | null = null;
  private snapshot: MarketSnapshot;

  constructor(private readonly random: () => number = Math.random) {
    this.snapshot = MarketSimulator.initialSnapshot();
  }

  static initialSnapshot(): MarketSnapshot {
    const stocks = STOCK_SEEDS.map((s) => quoteFrom(s, s.previousClose));
    return {
      tick: 0,
      updatedAt: 0,
      index: quoteFrom(INDEX_SEED, INDEX_SEED.previousClose),
      stocks,
      bonds: BOND_SEEDS.map((b) => bondFrom(b, b.openRate)),
      macro: MACRO,
    };
  }

  step(now: number): MarketSnapshot {
    const prev = this.snapshot;
    if (!this.opens) {
      // Abre o "pregão" com um gap aleatório para já existirem altas e baixas.
      this.opens = new Map([INDEX_SEED, ...STOCK_SEEDS].map((s) => [s.symbol, s.previousClose * (1 + (this.random() * 2 - 1) * 0.035)]));
    }
    const opens = this.opens;
    const move = (seed: StockSeed, q: Quote): number => {
      const open = opens.get(seed.symbol)!;
      const base = prev.tick === 0 ? open : q.price;
      const reversion = ((open - base) / base) * 0.01;
      return Math.max(0.01, base * (1 + gaussian(this.random) * seed.volatility + reversion));
    };

    const stocks = STOCK_SEEDS.map((seed, i) => quoteFrom(seed, move(seed, prev.stocks[i]), prev.tick === 0 ? undefined : prev.stocks[i]));
    const index = quoteFrom(INDEX_SEED, move(INDEX_SEED, prev.index), prev.tick === 0 ? undefined : prev.index);
    const bonds = BOND_SEEDS.map((seed, i) => {
      const step = seed.kind === "selic" ? 0.0004 : 0.006;
      const rate = prev.bonds[i].rate;
      const next = rate + gaussian(this.random) * step + (seed.openRate - rate) * 0.05;
      return bondFrom(seed, next, prev.tick === 0 ? undefined : prev.bonds[i]);
    });

    this.snapshot = {
      tick: prev.tick + 1,
      updatedAt: now,
      index,
      stocks,
      bonds,
      macro: prev.macro,
    };
    return this.snapshot;
  }
}
