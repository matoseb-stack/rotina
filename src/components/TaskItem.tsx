import { useId, useState } from 'react'
import type { Task } from '../lib/store'
import { TaskForm } from './TaskForm'

interface TaskItemProps {
  task: Task
  done: boolean
  editable?: boolean
  onToggle: () => void
  onUpdate?: (data: Omit<Task, 'id'>) => void
  onRemove?: () => void
}

export function TaskItem({ task, done, editable = false, onToggle, onUpdate, onRemove }: TaskItemProps) {
  const id = useId()
  const [editing, setEditing] = useState(false)

  if (editing && onUpdate) {
    return (
      <li className="task task-editing">
        <TaskForm
          initial={task}
          submitLabel="Salvar"
          onSubmit={(data) => {
            onUpdate(data)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className={`task${done ? ' task-done' : ''}`}>
      <input id={id} type="checkbox" className="task-check" checked={done} onChange={onToggle} />
      <label htmlFor={id} className="task-label">
        <span className="task-title">{task.title}</span>
        <span className="task-time">{task.time}</span>
      </label>
      {editable && (
        <div className="task-actions">
          <button type="button" className="icon-btn" onClick={() => setEditing(true)} aria-label={`Editar ${task.title}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
              <path d="M13.5 6.5l4 4" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              if (window.confirm(`Excluir "${task.title}"?`)) onRemove?.()
            }}
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
