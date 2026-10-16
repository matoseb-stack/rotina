import { useId, useState } from 'react'
import { PERIODS, PERIOD_HOURS, pad2, type Period } from '../lib/dates'

const MINUTES = [0, 10, 15, 20, 30, 40, 45, 50]

/** Hora sugerida ao trocar de período, quando a atual não pertence a ele. */
const DEFAULT_HOUR: Record<Period, number> = { manha: 7, tarde: 14, noite: 20 }

interface TimePickerProps {
  time: string
  period: Period
  onChange: (time: string, period: Period) => void
}

export function PeriodIcon({ period }: { period: Period }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="period-icon">
      {period === 'manha' && (
        <>
          <path d="M4 18h16" />
          <path d="M7.5 18a4.5 4.5 0 0 1 9 0" />
          <path d="M12 6v3M5.6 9.6l2 2M18.4 9.6l-2 2" />
        </>
      )}
      {period === 'tarde' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </>
      )}
      {period === 'noite' && <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />}
    </svg>
  )
}

export function TimePicker({ time, period, onChange }: TimePickerProps) {
  const id = useId()
  const [hourStr, minuteStr] = time.split(':')
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  const [typing, setTyping] = useState(!MINUTES.includes(minute))

  const set = (h: number, m: number, p: Period = period) => onChange(`${pad2(h)}:${pad2(m)}`, p)

  const choosePeriod = (p: Period) => {
    const h = PERIOD_HOURS[p].includes(hour) ? hour : DEFAULT_HOUR[p]
    set(h, minute, p)
  }

  return (
    <div className="time-picker">
      <div className="time-display" aria-live="polite">
        <span className="time-big">{time}</span>
        <span className="time-period">
          <PeriodIcon period={period} />
          {PERIODS.find((p) => p.id === period)?.label}
        </span>
      </div>

      <div className="segmented" role="group" aria-label="Período">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="segment"
            aria-pressed={period === p.id}
            onClick={() => choosePeriod(p.id)}
          >
            <PeriodIcon period={p.id} />
            {p.label}
          </button>
        ))}
      </div>

      <p className="picker-label" id={`${id}-hours`}>
        Hora
      </p>
      <div className="chip-grid chip-grid-hours" role="group" aria-labelledby={`${id}-hours`}>
        {PERIOD_HOURS[period].map((h) => (
          <button
            key={h}
            type="button"
            className="chip"
            aria-pressed={hour === h}
            aria-label={`${h} horas`}
            onClick={() => set(h, minute)}
          >
            {pad2(h)}h
          </button>
        ))}
      </div>

      <p className="picker-label" id={`${id}-minutes`}>
        Minutos
      </p>
      <div className="chip-grid chip-grid-minutes" role="group" aria-labelledby={`${id}-minutes`}>
        {MINUTES.map((m) => (
          <button
            key={m}
            type="button"
            className="chip"
            aria-pressed={!typing && minute === m}
            aria-label={`${m} minutos`}
            onClick={() => {
              setTyping(false)
              set(hour, m)
            }}
          >
            :{pad2(m)}
          </button>
        ))}
      </div>

      <div className="time-exact">
        {typing ? (
          <label className="field field-inline" htmlFor={`${id}-exact`}>
            <span>Horário exato</span>
            <input
              id={`${id}-exact`}
              type="time"
              value={time}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number)
                if (!Number.isNaN(h) && !Number.isNaN(m)) {
                  const p = PERIOD_HOURS[period].includes(h) ? period : (Object.keys(PERIOD_HOURS) as Period[]).find((k) => PERIOD_HOURS[k].includes(h)) ?? period
                  set(h, m, p)
                }
              }}
            />
          </label>
        ) : (
          <button type="button" className="link-btn" onClick={() => setTyping(true)}>
            Outro minuto? Digitar horário exato
          </button>
        )}
      </div>
    </div>
  )
}
