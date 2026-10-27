import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ChangeChip({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors duration-300",
        up ? "bg-neon-lime/10 text-neon-lime" : "bg-neon-red/10 text-neon-red",
        className,
      )}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {fmt.pct(value)}
    </span>
  );
}
