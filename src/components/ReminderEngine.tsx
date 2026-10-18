import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  REMINDER_EVENT,
  announce,
  confirmationKey,
  dueTasks,
  fetchConfirmations,
  getConfig,
  loadSeen,
  loadSent,
  reminderText,
  saveSeen,
  saveSent,
  sendWhatsApp,
  sendsWhatsAppFromSite,
  showBrowserNotification,
  syncBot,
  useReminderConfig,
} from '../lib/reminders'
import { useRoutine } from '../lib/store'

export type BotStatus = { state: 'idle' | 'ok' | 'error'; at?: string; message?: string }

let botStatus: BotStatus = { state: 'idle' }
const statusListeners = new Set<() => void>()

export function setBotStatus(status: BotStatus) {
  botStatus = status
  statusListeners.forEach((l) => l())
}

export function useBotStatus(): BotStatus {
  return useSyncExternalStore(
    (l) => {
      statusListeners.add(l)
      return () => statusListeners.delete(l)
    },
    () => botStatus,
  )
}

const clock = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** Envia a rotina ao servidor do bot e atualiza o status mostrado na página de avisos. */
export function syncNow(tasks: Parameters<typeof syncBot>[0], done: string[], date: string) {
  return syncBot(tasks, done, date)
    .then(() => setBotStatus({ state: 'ok', at: clock() }))
    .catch((e: Error) =>
      setBotStatus({
        state: 'error',
        message: e.message === 'Failed to fetch' ? 'Não foi possível falar com o servidor. Confira o endereço.' : e.message,
      }),
    )
}

/**
 * Confere a cada 20 segundos se alguma tarefa precisa de aviso
 * e mantém o servidor do bot sincronizado com a rotina.
 */
export function ReminderEngine() {
  const { tasks, doneToday, today, setDone } = useRoutine()
  const config = useReminderConfig()
  const latest = useRef({ tasks, doneToday, today })
  latest.current = { tasks, doneToday, today }

  useEffect(() => {
    const tick = () => {
      const { tasks, doneToday, today } = latest.current
      const sent = loadSent(today)
      const due = dueTasks(tasks, doneToday, sent, new Date())
      if (due.length === 0) return
      const cfg = getConfig()
      for (const task of due) {
        sent.add(task.id)
        const text = reminderText(task)
        announce(text)
        if (cfg.browser) showBrowserNotification(task.title, text)
        if (sendsWhatsAppFromSite(cfg)) sendWhatsApp(cfg.whatsapp.phone, cfg.whatsapp.apiKey, text).catch(() => {})
      }
      saveSent(sent, today)
    }
    tick()
    const timer = window.setInterval(tick, 20_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  // Sincroniza com o servidor do bot (com uma pequena espera para juntar mudanças).
  useEffect(() => {
    if (!config.bot.enabled || !config.bot.url) return
    const timer = window.setTimeout(() => {
      syncNow(tasks, [...doneToday], today)
    }, 800)
    return () => window.clearTimeout(timer)
  }, [tasks, doneToday, today, config.bot])

  // Busca as tarefas confirmadas com "1" no WhatsApp e marca como feitas aqui.
  useEffect(() => {
    if (!config.bot.enabled || !config.bot.url) return
    const pull = async () => {
      try {
        const { date, confirmations } = await fetchConfirmations()
        const { today, tasks } = latest.current
        if (date !== today) return
        const seen = loadSeen(today)
        const fresh = confirmations.filter((c) => !seen.has(confirmationKey(c)))
        if (fresh.length === 0) return
        for (const c of fresh) {
          seen.add(confirmationKey(c))
          setDone(c.id, true)
          const task = tasks.find((t) => t.id === c.id)
          if (task) announce(`Rotina Inteligente: "${task.title}" confirmada pelo WhatsApp.`)
        }
        saveSeen(today, seen)
      } catch {
        // servidor fora do ar: tenta de novo no próximo ciclo
      }
    }
    pull()
    const timer = window.setInterval(pull, 30_000)
    document.addEventListener('visibilitychange', pull)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', pull)
    }
  }, [config.bot, setDone])

  return null
}

/** Faixa que mostra os avisos dentro da página. */
export function ReminderToast() {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    let timer: number | undefined
    const onAviso = (e: Event) => {
      setText((e as CustomEvent<string>).detail)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setText(null), 10_000)
    }
    window.addEventListener(REMINDER_EVENT, onAviso)
    return () => {
      window.removeEventListener(REMINDER_EVENT, onAviso)
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {text && (
        <div className="toast">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="bell">
            <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
            <path d="M10 20.5a2 2 0 0 0 4 0" />
          </svg>
          <span>{text.replace('Rotina Inteligente: ', '')}</span>
          <button type="button" className="icon-btn" aria-label="Fechar aviso" onClick={() => setText(null)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
