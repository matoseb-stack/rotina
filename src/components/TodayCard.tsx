import { PERIODS, formatLongDate } from '../lib/dates'
import { useRoutine } from '../lib/store'
import { ProgressRing } from './ProgressRing'
import { TaskForm } from './TaskForm'
import { TaskItem } from './TaskItem'

interface TodayCardProps {
  /** Mostra o formulário de nova tarefa e os botões de editar/excluir. */
  editable?: boolean
  headingLevel?: 'h1' | 'h2'
}

export function TodayCard({ editable = false, headingLevel = 'h2' }: TodayCardProps) {
  const { today, tasks, doneToday, toggleDone, addTask, updateTask, removeTask } = useRoutine()
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
        <div className="today-add">
          <h3 className="visually-hidden">Adicionar tarefa</h3>
          <TaskForm submitLabel="Adicionar" onSubmit={addTask} />
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="empty">Nenhuma tarefa ainda. Comece adicionando a primeira.</p>
      ) : (
        PERIODS.map((period) => {
          const items = tasks.filter((t) => t.period === period.id).sort((a, b) => a.time.localeCompare(b.time))
          if (items.length === 0) return null
          return (
            <div className="period" key={period.id}>
              <h3 className="period-title">{period.label}</h3>
              <ul className="task-list">
                {items.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    done={doneToday.has(task.id)}
                    editable={editable}
                    onToggle={() => toggleDone(task.id)}
                    onUpdate={(data) => updateTask(task.id, data)}
                    onRemove={() => removeTask(task.id)}
                  />
                ))}
              </ul>
            </div>
          )
        })
      )}
    </section>
  )
}
