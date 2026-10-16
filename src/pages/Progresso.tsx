import { WeekChart, type ChartDay } from '../components/WeekChart'
import { addDays, dateKey, formatWeekday } from '../lib/dates'
import { percentOf, useRoutine } from '../lib/store'

export function Progresso() {
  const { today, history } = useRoutine()
  const todayDate = new Date(`${today}T12:00:00`)

  const days: ChartDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(todayDate, i - 6)
    const key = dateKey(d)
    return { key, label: formatWeekday(d), percent: percentOf(history[key]), isToday: key === today }
  })

  // Sequência: dias seguidos com 100%. Hoje só conta quando já estiver completo.
  let streak = 0
  let cursor = percentOf(history[today]) === 100 ? todayDate : addDays(todayDate, -1)
  while (percentOf(history[dateKey(cursor)]) === 100) {
    streak++
    cursor = addDays(cursor, -1)
  }

  const recorded = days.filter((d) => d.percent !== null)
  const average = recorded.length
    ? Math.round(recorded.reduce((sum, d) => sum + (d.percent ?? 0), 0) / recorded.length)
    : 0

  return (
    <div className="container page">
      <h1 className="page-title">Progresso</h1>
      <div className="stats">
        <div className="card stat stat-streak">
          <span className="stat-value">{streak}</span>
          <span className="stat-label">{streak === 1 ? 'dia seguido com 100%' : 'dias seguidos com 100%'}</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{average}%</span>
          <span className="stat-label">média dos últimos 7 dias</span>
        </div>
      </div>
      <section className="card chart-card" aria-labelledby="chart-heading">
        <h2 id="chart-heading" className="card-title">
          Últimos 7 dias
        </h2>
        <WeekChart days={days} />
        <p className="hint">Dias sem registro aparecem com “–”.</p>
      </section>
    </div>
  )
}
