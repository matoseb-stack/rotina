import { memo, useId } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  up: boolean;
  height?: number;
  className?: string;
}

const W = 100;
const H = 40;

/** Mini gráfico em SVG puro; usa as cores do tema via currentColor. */
export const Sparkline = memo(function Sparkline({ data, up, height = 40, className }: SparklineProps) {
  const gradientId = `spark${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (data.length < 2) return <div className={className} style={{ height }} aria-hidden />;
  let min = Infinity;
  let max = -Infinity;
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const line = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${((i / (data.length - 1)) * W).toFixed(2)},${(2 + (H - 4) * (1 - (v - min) / range)).toFixed(2)}`)
    .join("");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("w-full", up ? "text-up" : "text-down", className)}
      style={{ height }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${W},${H}L0,${H}Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
});
