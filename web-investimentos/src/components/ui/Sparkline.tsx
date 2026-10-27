import { memo, useId } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  color: string;
  height?: number;
  className?: string;
}

const W = 100;
const H = 40;
const PAD = 3;

/** Mini gráfico em SVG puro, escalável e sem dependências. */
export const Sparkline = memo(function Sparkline({ data, color, height = 64, className }: SparklineProps) {
  const gradientId = `spark${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (data.length < 2) return <div className={className} style={{ height }} aria-hidden />;

  let min = Infinity;
  let max = -Infinity;
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => PAD + (H - PAD * 2) * (1 - (v - min) / range);

  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join("");
  const area = `${line}L${W},${H}L0,${H}Z`;
  const lastY = (y(data[data.length - 1]) / H) * 100;

  return (
    <div className={cn("relative", className)} style={{ height }} aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.3" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={1.8} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      {/* Ponto final em HTML para não deformar com o preserveAspectRatio="none". */}
      <span
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: "100%", top: `${lastY}%`, background: color, boxShadow: `0 0 0 4px ${color}33, 0 0 12px ${color}` }}
      />
    </div>
  );
});
