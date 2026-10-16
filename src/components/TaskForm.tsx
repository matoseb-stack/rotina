import { useId, useState, type FormEvent } from 'react'
import { fromMinutes, suggestPeriod, toMinutes, type Period } from '../lib/dates'
import type { Task } from '../lib/store'
import { TimePicker } from './TimePicker'

export type TaskData = Omit<Task, 'id'>

const SUGGESTIONS: { title: string; time: string }[] = [
  { title: 'Beber água', time: '08:00' },
  { title: 'Alongar', time: '07:00' },
  { title: 'Meditar', time: '06:30' },
  { title: 'Tomar remédio', time: '08:00' },
  { title: 'Almoço', time: '12:30' },
  { title: 'Exercício', time: '18:00' },
  { title: 'Estudar', time: '19:00' },
  { title: 'Ler', time: '21:30' },
  { title: 'Dormir', time: '23:00' },
]

const REMINDERS: { value: number | null; label: string }[] = [
  { value: null, label: 'Sem aviso' },
  { value: 0, label: 'Na hora' },
  { value: 5, label: '5 min antes' },
  { value: 15, label: '15 min antes' },
  { value: 30, label: '30 min antes' },
]

interface TaskFormProps {
  initial?: TaskData
  submitLabel: string
  onSubmit: (data: TaskData) => void
  onCancel?: () => void
}

export function TaskForm({ initial, submitLabel, onSubmit, onCancel }: TaskFormProps) {
  const id = useId()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [time, setTime] = useState(initial?.time ?? '08:00')
  const [period, setPeriod] = useState<Period>(initial?.period ?? suggestPeriod(initial?.time ?? '08:00'))
  const [reminder, setReminder] = useState<number | null>(initial ? initial.reminder : 0)

  const changeTime = (t: string, p: Period) => {
    setTime(t)
    setPeriod(p)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const clean = title.trim()
    if (!clean || !time) return
    onSubmit({ title: clean, time, period, reminder })
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <label className="form-label" htmlFor={`${id}-title`}>
          O que você vai fazer?
        </label>
        <input
          id={`${id}-title`}
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Regar as plantas"
          maxLength={80}
          required
          autoComplete="off"
        />
        {!initial && (
          <div className="chip-row" role="group" aria-label="Sugestões">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.title}
                type="button"
                className="chip chip-soft"
                aria-pressed={title === s.title}
                onClick={() => {
                  setTitle(s.title)
                  changeTime(s.time, suggestPeriod(s.time))
                }}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form-section">
        <p className="form-label">Que horas?</p>
        <TimePicker time={time} period={period} onChange={changeTime} />
      </div>

      <div className="form-section">
        <p className="form-label" id={`${id}-reminder`}>
          Avisar
        </p>
        <div className="chip-row" role="group" aria-labelledby={`${id}-reminder`}>
          {REMINDERS.map((r) => (
            <button
              key={r.label}
              type="button"
              className="chip"
              aria-pressed={reminder === r.value}
              onClick={() => setReminder(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
        {reminder !== null && (
          <p className="form-hint">Aviso às {fromMinutes(toMinutes(time) - reminder)}, no navegador e no WhatsApp, se estiver conectado.</p>
        )}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
