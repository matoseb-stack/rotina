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

const dayMonth = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", timeZone: TIME_ZONE });
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: "short", year: "2-digit", timeZone: TIME_ZONE });
const dateTime = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIME_ZONE });
const dateLong = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "short", year: "numeric", timeZone: TIME_ZONE });

/** Rótulos de eixo/tooltip conforme a granularidade do período. */
export const chartFmt = {
  axis(ms: number, period: string): string {
    if (period === "1D") return hourFmt.format(ms);
    if (period === "5D" || period === "1M") return dayMonth.format(ms);
    return monthYear.format(ms).replace(". de ", "/").replace(" de ", "/");
  },
  tooltip(ms: number, period: string): string {
    return period === "1D" || period === "5D" ? dateTime.format(ms) : dateLong.format(ms);
  },
};

const decimal2 = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const decimal = (v: number) => decimal2.format(v);
export const signedBrl = (v: number) => `${v >= 0 ? "+" : "−"}${currency.format(Math.abs(v))}`;
