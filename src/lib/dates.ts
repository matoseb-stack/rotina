export type Period = 'manha' | 'tarde' | 'noite'

export const PERIODS: { id: Period; label: string }[] = [
  { id: 'manha', label: 'Manhã' },
  { id: 'tarde', label: 'Tarde' },
  { id: 'noite', label: 'Noite' },
]

const pad = (n: number) => String(n).padStart(2, '0')

/** Data local no formato AAAA-MM-DD. */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** Horas oferecidas no seletor de cada período (a noite atravessa a madrugada). */
export const PERIOD_HOURS: Record<Period, number[]> = {
  manha: [5, 6, 7, 8, 9, 10, 11],
  tarde: [12, 13, 14, 15, 16, 17],
  noite: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4],
}

/** Sugere o período a partir do horário: 5h–11h manhã, 12h–17h tarde, resto noite. */
export function suggestPeriod(time: string): Period {
  const hour = Number(time.split(':')[0])
  if (Number.isNaN(hour)) return 'manha'
  if (hour >= 5 && hour < 12) return 'manha'
  if (hour >= 12 && hour < 18) return 'tarde'
  return 'noite'
}

/** "07:30" -> 450 */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** 450 -> "07:30" (dá a volta no dia) */
export function fromMinutes(total: number): string {
  const t = ((total % 1440) + 1440) % 1440
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`
}

export function pad2(n: number): string {
  return pad(n)
}

export function formatLongDate(d: Date): string {
  const text = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatWeekday(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
}
