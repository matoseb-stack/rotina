import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dateKey, type Period } from './dates'

export interface Task {
  id: string
  title: string
  time: string // HH:MM
  period: Period
}

/** Registro de um dia: quais tarefas foram feitas e quantas existiam. */
export interface DayRecord {
  done: string[]
  total: number
}

interface State {
  tasks: Task[]
  history: Record<string, DayRecord>
}

const STORAGE_KEY = 'rotina-inteligente:v1'

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

function exampleState(): State {
  const task = (title: string, time: string, period: Period): Task => ({ id: newId(), title, time, period })
  return {
    tasks: [
      task('Beber água e alongar', '07:00', 'manha'),
      task('Café da manhã', '07:30', 'manha'),
      task('Bloco de foco', '14:00', 'tarde'),
      task('Caminhada curta', '17:30', 'tarde'),
      task('Ler 20 minutos', '22:00', 'noite'),
    ],
    history: {},
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as State
      if (Array.isArray(parsed.tasks) && parsed.history) return parsed
    }
  } catch {
    // localStorage indisponível ou dado corrompido: recomeça com o exemplo.
  }
  return exampleState()
}

/** Atualiza o registro de hoje com as tarefas atuais (o passado fica intacto). */
function withToday(state: State, today: string, done?: string[]): State {
  const ids = new Set(state.tasks.map((t) => t.id))
  const current = done ?? state.history[today]?.done ?? []
  return {
    ...state,
    history: {
      ...state.history,
      [today]: { done: current.filter((id) => ids.has(id)), total: state.tasks.length },
    },
  }
}

/** Data de hoje que se atualiza sozinha ao virar o dia. */
function useToday(): string {
  const [today, setToday] = useState(dateKey)
  useEffect(() => {
    const check = () => setToday(dateKey())
    const timer = window.setInterval(check, 30_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  return today
}

interface RoutineContext {
  today: string
  tasks: Task[]
  history: Record<string, DayRecord>
  doneToday: Set<string>
  addTask: (data: Omit<Task, 'id'>) => void
  updateTask: (id: string, data: Omit<Task, 'id'>) => void
  removeTask: (id: string) => void
  toggleDone: (id: string) => void
}

const Ctx = createContext<RoutineContext | null>(null)

export function RoutineProvider({ children }: { children: ReactNode }) {
  const today = useToday()
  const [state, setState] = useState<State>(() => withToday(load(), dateKey()))

  // Novo dia: cria o registro vazio de hoje (o "feito" recomeça do zero).
  useEffect(() => {
    setState((s) => (s.history[today] ? s : withToday(s, today, [])))
  }, [today])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // sem armazenamento: o app continua funcionando na sessão atual
    }
  }, [state])

  const addTask = useCallback(
    (data: Omit<Task, 'id'>) => setState((s) => withToday({ ...s, tasks: [...s.tasks, { id: newId(), ...data }] }, today)),
    [today],
  )
  const updateTask = useCallback(
    (id: string, data: Omit<Task, 'id'>) =>
      setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { id, ...data } : t)) })),
    [],
  )
  const removeTask = useCallback(
    (id: string) => setState((s) => withToday({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }, today)),
    [today],
  )
  const toggleDone = useCallback(
    (id: string) =>
      setState((s) => {
        const done = s.history[today]?.done ?? []
        return withToday(s, today, done.includes(id) ? done.filter((x) => x !== id) : [...done, id])
      }),
    [today],
  )

  const value = useMemo<RoutineContext>(
    () => ({
      today,
      tasks: state.tasks,
      history: state.history,
      doneToday: new Set(state.history[today]?.done ?? []),
      addTask,
      updateTask,
      removeTask,
      toggleDone,
    }),
    [today, state, addTask, updateTask, removeTask, toggleDone],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRoutine(): RoutineContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRoutine precisa estar dentro de <RoutineProvider>')
  return ctx
}

/** Percentual concluído de um registro (null quando não há registro). */
export function percentOf(record?: DayRecord): number | null {
  if (!record || record.total === 0) return null
  return Math.round((Math.min(record.done.length, record.total) / record.total) * 100)
}
