import { useId, useState } from 'react'
import type { Task } from '../lib/store'

interface TaskItemProps {
  task: Task
  done: boolean
  editable?: boolean
  onToggle: () => void
  onEdit?: () => void
  onRemove?: () => void
}

function reminderLabel(reminder: number | null): string | null {
  if (reminder === null) return null
  return reminder === 0 ? 'Aviso na hora' : `Aviso ${reminder} min antes`
}

export function TaskItem({ task, done, editable = false, onToggle, onEdit, onRemove }: TaskItemProps) {
  const id = useId()
  const [confirming, setConfirming] = useState(false)
  const reminder = reminderLabel(task.reminder)

  return (
    <li className={`task${done ? ' task-done' : ''}`}>
      <input id={id} type="checkbox" className="task-check" checked={done} onChange={onToggle} />
      <label htmlFor={id} className="task-label">
        <span className="task-title">{task.title}</span>
        <span className="task-time">
          {reminder && (
            <svg viewBox="0 0 24 24" className="bell" role="img" aria-label={reminder}>
              <title>{reminder}</title>
              <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
              <path d="M10 20.5a2 2 0 0 0 4 0" />
            </svg>
          )}
          {task.time}
        </span>
      </label>
      {editable && confirming && (
        <div className="task-confirm" role="group" aria-label={`Excluir ${task.title}?`}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={onRemove} autoFocus>
            Excluir
          </button>
        </div>
      )}
      {editable && !confirming && (
        <div className="task-actions">
          <button type="button" className="icon-btn" onClick={onEdit} aria-label={`Editar ${task.title}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
              <path d="M13.5 6.5l4 4" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setConfirming(true)}
            aria-label={`Excluir ${task.title}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7h14" />
              <path d="M10 7V4h4v3" />
              <path d="M7 7l1 13h8l1-13" />
            </svg>
          </button>
        </div>
      )}
    </li>
  )
}
