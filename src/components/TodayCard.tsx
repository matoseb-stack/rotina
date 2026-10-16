import { useState } from 'react'
import { PERIODS, formatLongDate } from '../lib/dates'
import { useRoutine, type Task } from '../lib/store'
import { ProgressRing } from './ProgressRing'
import { PeriodIcon } from './TimePicker'
import { TaskItem } from './TaskItem'
import { TaskSheet } from './TaskSheet'

interface TodayCardProps {
  /** Mostra o botão de nova tarefa e os botões de editar/excluir. */
  editable?: boolean
  headingLevel?: 'h1' | 'h2'
}

export function TodayCard({ editable = false, headingLevel = 'h2' }: TodayCardProps) {
  const { today, tasks, doneToday, toggleDone, addTask, updateTask, removeTask } = useRoutine()
  // null = fechado, 'new' = nova tarefa, Task = editando
  const [sheet, setSheet] = useState<'new' | Task | null>(null)
  const Heading = headingLevel
  const date = new Date(`${today}T12:00:00`)
  const doneCount = tasks.filter((t) => doneToday.has(t.id)).length

  return (
    <section className={`card today-card${editable ? ' today-card-full' : ''}`} aria-labelledby="today-title">
      <div className="today-head">
        <div>
          <Heading id="today-title" className="today-title">
            Hoje
          </Heading>
          <p className="today-date">{formatLongDate(date)}</p>
        </div>
        <ProgressRing done={doneCount} total={tasks.length} />
      </div>

      {editable && (
        <button type="button" className="btn btn-primary btn-add" onClick={() => setSheet('new')}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova tarefa
        </button>
      )}

      {tasks.length === 0 ? (
        <p className="empty">Nenhuma tarefa ainda. Comece adicionando a primeira.</p>
      ) : (
        PERIODS.map((period) => {
          const items = tasks
            .filter((t) => t.period === period.id)
            // Na noite, a madrugada (00h–04h) vem depois das 23h.
            .sort((a, b) => sortKey(a, period.id).localeCompare(sortKey(b, period.id)))
          if (items.length === 0) return null
          return (
            <div className="period" key={period.id}>
              <h3 className="period-title">
                <PeriodIcon period={period.id} />
                {period.label}
              </h3>
              <ul className="task-list">
                {items.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    done={doneToday.has(task.id)}
                    editable={editable}
                    onToggle={() => toggleDone(task.id)}
                    onEdit={() => setSheet(task)}
                    onRemove={() => removeTask(task.id)}
                  />
                ))}
              </ul>
            </div>
          )
        })
      )}

      {sheet && (
        <TaskSheet
          key={sheet === 'new' ? 'new' : sheet.id}
          initial={sheet === 'new' ? undefined : sheet}
          onSave={(data) => (sheet === 'new' ? addTask(data) : updateTask(sheet.id, data))}
          onClose={() => setSheet(null)}
        />
      )}
    </section>
  )
}

function sortKey(task: Task, period: string): string {
  if (period === 'noite' && task.time < '05:00') return `1${task.time}`
  return `0${task.time}`
}
