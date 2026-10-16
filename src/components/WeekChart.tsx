export interface ChartDay {
  key: string
  label: string
  percent: number | null
  isToday: boolean
}

const WIDTH = 560
const HEIGHT = 240
const TOP = 28
const BOTTOM = 36
const PLOT = HEIGHT - TOP - BOTTOM

export function WeekChart({ days }: { days: ChartDay[] }) {
  const slot = WIDTH / days.length
  const barWidth = Math.min(44, slot * 0.56)

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="chart-title">
        <title id="chart-title">Porcentagem de tarefas concluídas nos últimos 7 dias</title>
        {[0, 50, 100].map((v) => {
          const y = TOP + PLOT - (PLOT * v) / 100
          return <line key={v} x1="0" x2={WIDTH} y1={y} y2={y} className="chart-grid" />
        })}
        {days.map((day, i) => {
          const x = i * slot + (slot - barWidth) / 2
          const value = day.percent ?? 0
          const h = Math.max((PLOT * value) / 100, day.percent === null ? 0 : 4)
          const y = TOP + PLOT - h
          return (
            <g key={day.key}>
              <rect x={x} y={TOP} width={barWidth} height={PLOT} rx={barWidth / 2.6} className="chart-track" />
              {day.percent !== null && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx={Math.min(barWidth / 2.6, h / 2)}
                  className={day.percent === 100 ? 'chart-bar chart-bar-full' : 'chart-bar'}
                />
              )}
              <text x={x + barWidth / 2} y={TOP - 10} className="chart-value" textAnchor="middle">
                {day.percent === null ? '–' : `${day.percent}%`}
              </text>
              <text
                x={x + barWidth / 2}
                y={HEIGHT - 12}
                className={day.isToday ? 'chart-label chart-label-today' : 'chart-label'}
                textAnchor="middle"
              >
                {day.isToday ? 'hoje' : day.label}
              </text>
            </g>
          )
        })}
      </svg>
      <table className="visually-hidden">
        <caption>Concluído por dia</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.isToday ? 'Hoje' : d.label}</th>
              <td>{d.percent === null ? 'sem registro' : `${d.percent}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
