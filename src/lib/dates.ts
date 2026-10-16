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

/** Sugere o período a partir do horário: antes das 12h manhã, antes das 18h tarde. */
export function suggestPeriod(time: string): Period {
  const hour = Number(time.split(':')[0])
  if (Number.isNaN(hour) || hour < 12) return 'manha'
  if (hour < 18) return 'tarde'
  return 'noite'
}

export function formatLongDate(d: Date): string {
  const text = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatWeekday(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
}
