import { PERIODS, addDays, formatWeekday } from '../lib/dates'
import { useRoutine } from '../lib/store'
import { LogoMark } from './Logo'

/** Folha para impressão: tarefas por horário e um quadrinho por dia da semana. Só aparece no papel. */
export function PrintSheet() {
  const { today, tasks } = useRoutine()
  const date = new Date(`${today}T12:00:00`)
  // Semana de segunda a domingo que contém hoje.
  const monday = addDays(date, -((date.getDay() + 6) % 7))
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const range = `${monday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })} a ${days[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`

  return (
    <section className="print-sheet" aria-hidden="true">
      <header className="print-head">
        <LogoMark size={36} />
        <div>
          <h1>Minha rotina</h1>
          <p>Semana de {range}</p>
        </div>
      </header>

      <table className="print-table">
        <thead>
          <tr>
            <th className="print-time">Horário</th>
            <th className="print-task">Tarefa</th>
            {days.map((d) => (
              <th key={d.toISOString()} className="print-day">
                {formatWeekday(d)}
                <span>{d.getDate()}</span>
              </th>
            ))}
          </tr>
        </thead>
        {PERIODS.map((period) => {
          const items = tasks
            .filter((t) => t.period === period.id)
            .sort((a, b) => sortKey(a.time, period.id).localeCompare(sortKey(b.time, period.id)))
          if (items.length === 0) return null
          return (
            <tbody key={period.id}>
              <tr className="print-period">
                <th colSpan={9}>{period.label}</th>
              </tr>
              {items.map((task) => (
                <tr key={task.id}>
                  <td className="print-time">{task.time}</td>
                  <td className="print-task">{task.title}</td>
                  {days.map((d) => (
                    <td key={d.toISOString()} className="print-day">
                      <span className="print-box" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )
        })}
      </table>

      <div className="print-notes">
        <p>Anotações</p>
        <span />
        <span />
        <span />
      </div>
    </section>
  )
}

// Na noite, a madrugada (00h–04h) vem depois das 23h.
function sortKey(time: string, period: string): string {
  return (period === 'noite' && time < '05:00' ? '1' : '0') + time
}
