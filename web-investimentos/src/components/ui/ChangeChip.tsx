import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Variação em % com seta e cor sóbria (verde alta, vermelho baixa). */
export function ChangeChip({ value, size = "sm", className }: { value: number; size?: "sm" | "md"; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-0.5 rounded-md font-semibold",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
        up ? "bg-up-soft text-up" : "bg-down-soft text-down",
        className,
      )}
    >
      <span aria-hidden className="text-[0.8em]">{up ? "▲" : "▼"}</span>
      {fmt.pct(value)}
    </span>
  );
}
