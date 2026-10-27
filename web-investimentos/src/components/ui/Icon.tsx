import type { TabIcon } from "@/lib/tabs";

type IconName = TabIcon | "external" | "close" | "refresh" | "arrow-left" | "arrow-right";

const PATHS: Record<IconName, string> = {
  chart: "M3 17l5-5 4 4 8-9M14 7h6v6",
  bars: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zM9 12l2 2 4-4",
  wire: "M4 5h16M4 10h10M4 15h16M4 20h7M18 18l2 2 2-2",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
  close: "M6 6l12 12M18 6L6 18",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
  "arrow-left": "M15 6l-6 6 6 6",
  "arrow-right": "M9 6l6 6-6 6",
};

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}
