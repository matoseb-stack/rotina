"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartFmt, decimal, fmt } from "@/lib/format";
import { buildHistory, PERIODS, type HistoryPoint, type Period } from "@/lib/market/history";
import type { Quote } from "@/lib/market/types";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

// SVG do Recharts não aceita var() em atributos: as cores vêm do tema ativo.
const PALETTE = {
  light: { up: "#047857", down: "#b91c1c", grid: "#e2e8f0", axis: "#64748b" },
  dark: { up: "#34d399", down: "#f87171", grid: "#233047", axis: "#94a3b8" },
} as const;

const PERIOD_LABEL: Record<Period, string> = {
  "1D": "hoje",
  "5D": "em 5 dias",
  "1M": "em 1 mês",
  "6M": "em 6 meses",
  "1Y": "em 1 ano",
  ALL: "em 5 anos",
};

/**
 * Gráfico de área com seletor de período. Histórico simulado e determinístico
 * por ativo; o último ponto acompanha o preço ao vivo a cada tick.
 */
export function StockChart({ quote }: { quote: Quote }) {
  const [period, setPeriod] = useState<Period>("1D");
  const theme = useTheme();
  const colors = PALETTE[theme];

  const data = useMemo(() => buildHistory(quote, period, Date.now()), [quote, period]);
  const first = period === "1D" ? quote.previousClose : data[0].price;
  const change = ((quote.price - first) / first) * 100;
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
        <p className="text-sm text-muted">
          <span className={cn("tnum font-semibold", change >= 0 ? "text-up" : "text-down")}>{fmt.pct(change)}</span> {PERIOD_LABEL[period]}
        </p>
      </div>

      <div className="mt-4 h-64 sm:h-80" role="img" aria-label={`Gráfico de ${quote.symbol} ${PERIOD_LABEL[period]}: ${fmt.pct(change)}`}>
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
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => chartFmt.axis(v, period)}
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
              width={52}
            />
            {period === "1D" && (
              <ReferenceLine y={quote.previousClose} stroke={colors.axis} strokeDasharray="4 4" strokeOpacity={0.6} />
            )}
            <Tooltip
              cursor={{ stroke: colors.axis, strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as HistoryPoint | undefined;
                if (!active || !point) return null;
                return (
                  <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop">
                    <p className="text-muted">{chartFmt.tooltip(point.t, period)}</p>
                    <p className="tnum mt-0.5 text-sm font-semibold">{fmt.brl(point.price)}</p>
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
      {period === "1D" && (
        <p className="mt-2 text-xs text-subtle">Linha tracejada: fechamento anterior ({fmt.brl(quote.previousClose)}).</p>
      )}
    </div>
  );
}
