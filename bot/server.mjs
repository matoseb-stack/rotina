// Bot de WhatsApp da Rotina Inteligente (sem dependências, Node 18+).
//
// O site envia a rotina para POST /api/rotina sempre que ela muda.
// A cada 20 segundos o bot confere os horários e manda o aviso pelo WhatsApp.
//
// Variáveis de ambiente:
//   BOT_TOKEN           código de acesso que o site usa (obrigatório)
//   PORT                porta HTTP (padrão 8787)
//   TZ_NAME             fuso dos horários (padrão: o enviado pelo site, ou America/Sao_Paulo)
//   ALLOWED_ORIGIN      origem do site liberada no CORS (padrão *)
//   DATA_FILE           onde guardar a rotina (padrão ./data.json)
//   WHATSAPP_PROVIDER   callmebot | cloud | log (padrão callmebot)
//   CALLMEBOT_PHONE     seu número, ex. +5511912345678
//   CALLMEBOT_APIKEY    chave recebida do CallMeBot
//   WA_TOKEN            WhatsApp Cloud API: token de acesso
//   WA_PHONE_NUMBER_ID  WhatsApp Cloud API: ID do número que envia
//   WA_TO               WhatsApp Cloud API: número que recebe, ex. 5511912345678

import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'

const env = process.env
const PORT = Number(env.PORT || 8787)
const TOKEN = env.BOT_TOKEN
const DATA_FILE = env.DATA_FILE || new URL('./data.json', import.meta.url).pathname
const PROVIDER = env.WHATSAPP_PROVIDER || 'callmebot'
const ORIGIN = env.ALLOWED_ORIGIN || '*'
const WINDOW_MINUTES = 10

if (!TOKEN) {
  console.error('Defina BOT_TOKEN (um código longo e secreto) antes de iniciar o bot.')
  process.exit(1)
}

/* ---------------- Estado ---------------- */

let state = { tasks: [], done: [], date: '', timezone: '', sent: { date: '', ids: [] } }
try {
  state = { ...state, ...JSON.parse(readFileSync(DATA_FILE, 'utf8')) }
} catch {
  // primeira execução
}
const save = () => writeFileSync(DATA_FILE, JSON.stringify(state, null, 2))

/* ---------------- Horário local ---------------- */

function localNow() {
  const timeZone = env.TZ_NAME || state.timezone || 'America/Sao_Paulo'
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) }
}

const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function reminderText(task) {
  if (!task.reminder) return `Rotina Inteligente: hora de "${task.title}" (${task.time}).`
  return `Rotina Inteligente: em ${task.reminder} min, "${task.title}" às ${task.time}.`
}

/* ---------------- Envio pelo WhatsApp ---------------- */

async function sendWhatsApp(text) {
  if (PROVIDER === 'log') {
    console.log(`[whatsapp] ${text}`)
    return
  }
  if (PROVIDER === 'cloud') {
    // Mensagens de texto livre só chegam se você falou com o número nas últimas 24h.
    // Para avisos fora dessa janela, a Meta exige um modelo (template) aprovado.
    const res = await fetch(`https://graph.facebook.com/v21.0/${env.WA_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: env.WA_TO, type: 'text', text: { body: text } }),
    })
    if (!res.ok) throw new Error(`WhatsApp Cloud API: ${res.status} ${await res.text()}`)
    return
  }
  const params = new URLSearchParams({ phone: env.CALLMEBOT_PHONE || '', text, apikey: env.CALLMEBOT_APIKEY || '' })
  const res = await fetch(`https://api.callmebot.com/whatsapp.php?${params}`)
  if (!res.ok) throw new Error(`CallMeBot: ${res.status} ${await res.text()}`)
}

/* ---------------- Verificação periódica ---------------- */

async function tick() {
  const now = localNow()
  if (state.sent.date !== now.date) state.sent = { date: now.date, ids: [] }
  // "Feito" só vale para o dia em que o site sincronizou.
  const done = new Set(state.date === now.date ? state.done : [])
  const sent = new Set(state.sent.ids)

  for (const task of state.tasks) {
    if (task.reminder === null || task.reminder === undefined || done.has(task.id) || sent.has(task.id)) continue
    const target = toMinutes(task.time) - task.reminder
    const late = (((now.minutes - target) % 1440) + 1440) % 1440
    if (late >= WINDOW_MINUTES) continue

    state.sent.ids.push(task.id)
    save()
    try {
      await sendWhatsApp(reminderText(task))
      console.log(`Aviso enviado: ${task.title} (${task.time})`)
    } catch (err) {
      console.error(`Falha ao avisar "${task.title}":`, err.message)
    }
  }
}

setInterval(() => tick().catch((e) => console.error(e)), 20_000)
tick().catch((e) => console.error(e))

/* ---------------- HTTP ---------------- */

function reply(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 200_000) reject(new Error('Rotina grande demais.'))
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        reject(new Error('JSON inválido.'))
      }
    })
  })
}

const validTask = (t) =>
  t && typeof t.id === 'string' && typeof t.title === 'string' && /^\d{2}:\d{2}$/.test(t.time) &&
  (t.reminder === null || typeof t.reminder === 'number')

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return reply(res, 204)
  if (req.method === 'GET' && req.url === '/health') return reply(res, 200, { ok: true, tarefas: state.tasks.length })

  if (req.headers.authorization !== `Bearer ${TOKEN}`) return reply(res, 401, 'Código de acesso inválido.')

  try {
    if (req.method === 'POST' && req.url === '/api/rotina') {
      const body = await readBody(req)
      if (!Array.isArray(body.tasks) || !body.tasks.every(validTask)) return reply(res, 400, 'Rotina inválida.')
      state.tasks = body.tasks.map(({ id, title, time, reminder }) => ({ id, title: title.slice(0, 80), time, reminder }))
      state.done = Array.isArray(body.done) ? body.done.filter((d) => typeof d === 'string') : []
      state.date = typeof body.date === 'string' ? body.date : ''
      if (typeof body.timezone === 'string') state.timezone = body.timezone
      save()
      return reply(res, 200, { ok: true })
    }
    if (req.method === 'POST' && req.url === '/api/teste') {
      await sendWhatsApp('Rotina Inteligente: o servidor do bot está funcionando.')
      return reply(res, 200, { ok: true })
    }
    return reply(res, 404, 'Rota não encontrada.')
  } catch (err) {
    return reply(res, 500, err.message)
  }
}).listen(PORT, () => console.log(`Bot da Rotina Inteligente ouvindo na porta ${PORT} (envio: ${PROVIDER})`))
