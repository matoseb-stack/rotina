import { useSyncExternalStore } from 'react'
import { dateKey, fromMinutes, toMinutes } from './dates'
import type { Task } from './store'

/* ---------------- Configuração dos avisos ---------------- */

export interface ReminderConfig {
  browser: boolean
  whatsapp: { enabled: boolean; phone: string; apiKey: string }
  /** Servidor do bot: envia os avisos mesmo com o site fechado. */
  bot: { enabled: boolean; url: string; token: string }
}

const CONFIG_KEY = 'rotina-inteligente:avisos'
const SENT_KEY = 'rotina-inteligente:avisos-enviados'

const DEFAULT_CONFIG: ReminderConfig = {
  browser: false,
  whatsapp: { enabled: false, phone: '', apiKey: '' },
  bot: { enabled: false, url: '', token: '' },
}

function readConfig(): ReminderConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<ReminderConfig>
      return {
        browser: saved.browser ?? false,
        whatsapp: { ...DEFAULT_CONFIG.whatsapp, ...saved.whatsapp },
        bot: { ...DEFAULT_CONFIG.bot, ...saved.bot },
      }
    }
  } catch {
    // sem armazenamento: usa o padrão
  }
  return DEFAULT_CONFIG
}

let config = readConfig()
const listeners = new Set<() => void>()

export function getConfig(): ReminderConfig {
  return config
}

export function setConfig(update: (c: ReminderConfig) => ReminderConfig) {
  config = update(config)
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  } catch {
    // ignora
  }
  listeners.forEach((l) => l())
}

export function useReminderConfig(): ReminderConfig {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => config,
  )
}

/** O site manda o WhatsApp direto apenas quando o servidor do bot não está cuidando disso. */
export function sendsWhatsAppFromSite(c: ReminderConfig): boolean {
  return c.whatsapp.enabled && Boolean(c.whatsapp.phone && c.whatsapp.apiKey) && !c.bot.enabled
}

/* ---------------- Quais tarefas avisar agora ---------------- */

/** Janela para não perder um aviso quando o navegador atrasa os timers de abas em segundo plano. */
export const WINDOW_MINUTES = 10

export function reminderTime(task: Task): string | null {
  if (task.reminder === null) return null
  return fromMinutes(toMinutes(task.time) - task.reminder)
}

export function dueTasks(tasks: Task[], done: Set<string>, sent: Set<string>, now: Date): Task[] {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return tasks.filter((t) => {
    if (t.reminder === null || done.has(t.id) || sent.has(t.id)) return false
    const target = toMinutes(t.time) - t.reminder
    const late = (((nowMin - target) % 1440) + 1440) % 1440
    return late < WINDOW_MINUTES
  })
}

export function reminderText(task: Task): string {
  if (!task.reminder) return `Rotina Inteligente: hora de "${task.title}" (${task.time}).`
  return `Rotina Inteligente: em ${task.reminder} min, "${task.title}" às ${task.time}.`
}

/* ---------------- Registro do que já foi avisado hoje ---------------- */

export function loadSent(today = dateKey()): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(SENT_KEY) ?? 'null') as { date: string; ids: string[] } | null
    if (saved?.date === today) return new Set(saved.ids)
  } catch {
    // ignora
  }
  return new Set()
}

export function saveSent(ids: Set<string>, today = dateKey()) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify({ date: today, ids: [...ids] }))
  } catch {
    // ignora
  }
}

/* ---------------- Canais ---------------- */

/** Só os dígitos, com código do país: "+55 (11) 91234-5678" -> "5511912345678". */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Envia pelo CallMeBot (serviço gratuito de WhatsApp para uso pessoal).
 * A API não libera leitura da resposta pelo navegador, então o envio é "dispare e esqueça":
 * quem confirma que chegou é a mensagem de teste.
 */
export async function sendWhatsApp(phone: string, apiKey: string, text: string): Promise<void> {
  const params = new URLSearchParams({ phone: `+${normalizePhone(phone)}`, text, apikey: apiKey.trim() })
  await fetch(`https://api.callmebot.com/whatsapp.php?${params}`, { mode: 'no-cors' })
}

export function browserNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function showBrowserNotification(title: string, body: string) {
  if (!browserNotificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: `${import.meta.env.BASE_URL}favicon.svg`, tag: body })
  } catch {
    // alguns navegadores de celular só notificam via service worker
  }
}

/* ---------------- Servidor do bot ---------------- */

function botUrl(path: string): string {
  return config.bot.url.replace(/\/+$/, '') + path
}

async function botRequest(path: string, body: unknown): Promise<void> {
  const res = await fetch(botUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.bot.token}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `O servidor respondeu ${res.status}.`)
  }
}

export function syncBot(tasks: Task[], done: string[], date: string) {
  return botRequest('/api/rotina', {
    tasks,
    done,
    date,
    seen: [...loadSeen(date)],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
}

/* ---------------- Confirmações vindas do WhatsApp ("1") ---------------- */

export interface Confirmation {
  id: string
  at: number
}

const SEEN_KEY = 'rotina-inteligente:confirmacoes-vistas'
export const confirmationKey = (c: Confirmation) => `${c.id}@${c.at}`

export function loadSeen(date: string): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(SEEN_KEY) ?? 'null') as { date: string; keys: string[] } | null
    if (saved?.date === date) return new Set(saved.keys)
  } catch {
    // ignora
  }
  return new Set()
}

export function saveSeen(date: string, keys: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify({ date, keys: [...keys] }))
  } catch {
    // ignora
  }
}

export async function fetchConfirmations(): Promise<{ date: string; confirmations: Confirmation[] }> {
  const res = await fetch(botUrl('/api/estado'), { headers: { Authorization: `Bearer ${config.bot.token}` } })
  if (!res.ok) throw new Error(`O servidor respondeu ${res.status}.`)
  return res.json()
}

export function testBot() {
  return botRequest('/api/teste', {})
}

/* ---------------- Aviso dentro da página ---------------- */

export const REMINDER_EVENT = 'rotina:aviso'

export function announce(text: string) {
  window.dispatchEvent(new CustomEvent<string>(REMINDER_EVENT, { detail: text }))
}
