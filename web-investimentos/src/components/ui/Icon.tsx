type IconName =
  | "chart" | "shield" | "news" | "sun" | "moon" | "external" | "close"
  | "refresh" | "arrow-up" | "arrow-down" | "info" | "globe" | "bolt" | "sparkles" | "filter" | "coin";

const PATHS: Record<IconName, string> = {
  chart: "M3 17l5-5 4 4 8-9M14 7h6v6",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z",
  news: "M5 4h11a1 1 0 011 1v14a1 1 0 001 1H6a2 2 0 01-2-2V5a1 1 0 011-1zM17 8h2a1 1 0 011 1v9a2 2 0 01-2 2M8 8h5M8 12h5M8 16h3",
  sun: "M12 4V2M12 22v-2M4.9 4.9L3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4M12 17a5 5 0 100-10 5 5 0 000 10z",
  moon: "M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
  close: "M6 6l12 12M18 6L6 18",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
  "arrow-up": "M12 19V5M6 11l6-6 6 6",
  "arrow-down": "M12 5v14M6 13l6 6 6-6",
  info: "M12 16v-4M12 8h.01M12 21a9 9 0 100-18 9 9 0 000 18z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 010 18M12 3a14 14 0 000 18",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  sparkles: "M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z",
  filter: "M3 5h18l-7 8v6l-4 2v-8L3 5z",
  coin: "M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 8h4a2 2 0 010 4h-4h4.5a2 2 0 010 4h-4.5V8zM11 6.5V8M11 16v1.5",
};

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}
