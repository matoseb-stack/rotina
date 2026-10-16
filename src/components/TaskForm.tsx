import { useId, useState, type FormEvent } from 'react'
import { PERIODS, suggestPeriod, type Period } from '../lib/dates'
import type { Task } from '../lib/store'

interface TaskFormProps {
  initial?: Omit<Task, 'id'>
  submitLabel: string
  onSubmit: (data: Omit<Task, 'id'>) => void
  onCancel?: () => void
}

export function TaskForm({ initial, submitLabel, onSubmit, onCancel }: TaskFormProps) {
  const id = useId()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [time, setTime] = useState(initial?.time ?? '08:00')
  const [period, setPeriod] = useState<Period>(initial?.period ?? suggestPeriod(initial?.time ?? '08:00'))

  const handleTime = (value: string) => {
    setTime(value)
    if (value) setPeriod(suggestPeriod(value))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const clean = title.trim()
    if (!clean || !time) return
    onSubmit({ title: clean, time, period })
    if (!initial) {
      setTitle('')
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="field field-grow">
        <label htmlFor={`${id}-title`}>Tarefa</label>
        <input
          id={`${id}-title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Regar as plantas"
          maxLength={80}
          required
          autoFocus={Boolean(initial)}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-time`}>Horário</label>
        <input id={`${id}-time`} type="time" value={time} onChange={(e) => handleTime(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor={`${id}-period`}>Período</label>
        <select id={`${id}-period`} value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          {PERIODS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="task-form-actions">
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
