export function LiveBadge({ label = "AO VIVO", color = "#C6FF00" }: { label?: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] font-medium tracking-[0.18em]"
      style={{ color, borderColor: `${color}55` }}
    >
      <span className="size-2 animate-live-dot rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
      {label}
    </span>
  );
}
