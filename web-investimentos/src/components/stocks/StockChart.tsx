"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStockHistory } from "@/hooks/useStockHistory";
import { chartFmt, decimal, fmt } from "@/lib/format";
import { PERIODS, type Period } from "@/lib/market/periods";
import type { Quote } from "@/lib/market/types";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

// SVG do Recharts não aceita var() em atributos: as cores vêm do tema ativo.
const PALETTE = {
  light: { up: "#047857", down: "#b91c1c", grid: "#e2e8f0", axis: "#64748b" },
  dark: { up: "#34d399", down: "#f87171", grid: "#233047", axis: "#94a3b8" },
} as const;

const PERIOD_LABEL: Record<Period, string> = {
  "1D": "no dia",
  "5D": "em 5 dias",
  "1M": "em 1 mês",
  "6M": "em 6 meses",
  "1Y": "em 1 ano",
  ALL: "desde o início",
};

interface ChartPoint {
  i: number;
  t: number;
  price: number;
}

/**
 * Gráfico com dados reais do Yahoo Finance. O eixo X usa a posição do ponto
 * (não o horário) para não deixar buracos em noites e fins de semana.
 * No 1D, o último ponto é a cotação mais recente recebida.
 */
export function StockChart({ quote }: { quote: Quote }) {
  const [period, setPeriod] = useState<Period>("1D");
  const history = useStockHistory(quote.symbol);
  const theme = useTheme();
  const colors = PALETTE[theme];

  const data = useMemo<ChartPoint[]>(() => {
    if (history.status !== "ready") return [];
    const series = [...(history.data.series[period] ?? [])];
    const last = series[series.length - 1];
    if (period === "1D" && quote.marketTime && (!last || quote.marketTime > last.t)) {
      series.push({ t: quote.marketTime, price: quote.price });
    }
    return series.map((p, i) => ({ i, ...p }));
  }, [history, period, quote.marketTime, quote.price]);

  const baseline =
    period === "1D" ? (history.status === "ready" ? history.data.previousClose : undefined) ?? quote.previousClose : data[0]?.price;
  const lastPrice = data[data.length - 1]?.price ?? quote.price;
  const change = baseline ? ((lastPrice - baseline) / baseline) * 100 : 0;
  const color = change >= 0 ? colors.up : colors.down;
  const gradientId = `area-${quote.symbol}-${change >= 0 ? "up" : "down"}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Período do gráfico" className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={period === p}
              onClick={() => setPeriod(p)}
              className={cn(
                "tnum min-w-10 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors sm:min-w-11",
                period === p ? "bg-surface text-fg shadow-card-sm" : "text-muted hover:text-fg",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        {data.length > 1 && (
          <p className="text-sm text-muted">
            <span className={cn("tnum font-semibold", change >= 0 ? "text-up" : "text-down")}>{fmt.pct(change)}</span> {PERIOD_LABEL[period]}
          </p>
        )}
      </div>

      <div className="mt-4 h-64 sm:h-80">
        {history.status === "loading" ? (
          <div className="h-full animate-pulse rounded-xl bg-surface-2" aria-label="Carregando gráfico" />
        ) : data.length < 2 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted">
            {history.status === "error" ? "Não foi possível carregar o histórico agora." : "Sem dados para este período."}
          </div>
        ) : (
          <div className="h-full" role="img" aria-label={`Gráfico de ${quote.symbol} ${PERIOD_LABEL[period]}: ${fmt.pct(change)}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="i"
                  type="number"
                  domain={[0, data.length - 1]}
                  tickFormatter={(i: number) => (data[Math.round(i)] ? chartFmt.axis(data[Math.round(i)].t, period) : "")}
                  tick={{ fill: colors.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  orientation="right"
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => decimal(v)}
                  tick={{ fill: colors.axis, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                {period === "1D" && baseline && (
                  <ReferenceLine y={baseline} ifOverflow="extendDomain" stroke={colors.axis} strokeDasharray="4 4" strokeOpacity={0.6} />
                )}
                <Tooltip
                  cursor={{ stroke: colors.axis, strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    const point = payload?.[0]?.payload as ChartPoint | undefined;
                    if (!active || !point) return null;
                    return (
                      <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
                        <p className="text-muted">{chartFmt.tooltip(point.t, period)}</p>
                        <p className="tnum mt-0.5 text-sm font-semibold">
                          {quote.symbol === "IBOV" ? fmt.points(point.price) : fmt.brl(point.price)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  isAnimationActive={false}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: color }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-subtle">
        Fonte: Yahoo Finance (atraso de até 15 min).
        {period === "1D" && baseline ? ` Linha tracejada: fechamento anterior (${fmt.brl(baseline)}).` : ""}
      </p>
    </div>
  );
}
