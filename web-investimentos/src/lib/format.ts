const LOCALE = "pt-BR";
const TIME_ZONE = "America/Sao_Paulo";

const currency = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "BRL" });
const points = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const clockFmt = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: TIME_ZONE,
});
const hourFmt = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIME_ZONE });
const fullDateFmt = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TIME_ZONE,
});

function fixed(value: number, decimals: number): string {
  return value.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export const fmt = {
  brl: (v: number) => currency.format(v),
  points: (v: number) => `${points.format(v)} pts`,
  pct: (v: number) => `${v >= 0 ? "+" : ""}${fixed(v, 2)}%`,
  rate: (v: number, decimals = 2) => `${fixed(v, decimals)}%`,
  bps: (v: number) => `${v >= 0 ? "+" : ""}${fixed(v, 1)} bps`,
  clock: (ms: number) => (ms ? clockFmt.format(ms) : "--:--:--"),
  hour: (ms: number) => hourFmt.format(ms),
  fullDate: (ms: number) => fullDateFmt.format(ms),
  relative(ms: number, now: number): string {
    const min = Math.round((now - ms) / 60_000);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h} h`;
    return `há ${Math.floor(h / 24)} d`;
  },
};
