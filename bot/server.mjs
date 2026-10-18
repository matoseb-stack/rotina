// Bot de WhatsApp da Rotina Inteligente (sem dependências, Node 18+).
//
// - O site envia a rotina para POST /api/rotina sempre que ela muda.
// - A cada 20 segundos o bot confere os horários e manda o aviso pelo WhatsApp.
// - Com a WhatsApp Cloud API (WHATSAPP_PROVIDER=cloud), você responde "1" e a tarefa
//   fica marcada como feita. O site busca essas confirmações em GET /api/estado.
//
// Variáveis de ambiente:
//   BOT_TOKEN           código de acesso que o site usa (obrigatório)
//   PORT                porta HTTP (padrão 8787)
//   TZ_NAME             fuso dos horários (padrão: o enviado pelo site, ou America/Sao_Paulo)
//   ALLOWED_ORIGIN      origem do site liberada no CORS (padrão *)
//   DATA_FILE           onde guardar a rotina (padrão ./data.json)
//   WHATSAPP_PROVIDER   cloud | callmebot | log (padrão callmebot)
//   FOLLOWUP_MINUTES    lembra de novo se não responder (padrão 15; 0 desliga)
//
//   WhatsApp Cloud API (responder "1"):
//   WA_TOKEN            token de acesso (de preferência permanente, de usuário do sistema)
//   WA_PHONE_NUMBER_ID  ID do número que envia
//   WA_TO               seu número, só dígitos, ex. 5511912345678
//   WA_VERIFY_TOKEN     palavra-chave que você inventa para validar o webhook na Meta
//   WA_APP_SECRET       chave secreta do app na Meta (confere que o webhook veio da Meta)
//   WA_TEMPLATE         nome do modelo aprovado para os avisos (opcional, recomendado)
//   WA_TEMPLATE_LANG    idioma do modelo (padrão pt_BR)
//
//   CallMeBot (só envia, não recebe respostas):
//   CALLMEBOT_PHONE     seu número, ex. +5511912345678
//   CALLMEBOT_APIKEY    chave recebida do CallMeBot

import { createHmac, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'

const env = process.env
const PORT = Number(env.PORT || 8787)
const TOKEN = env.BOT_TOKEN
const DATA_FILE = env.DATA_FILE || new URL('./data.json', import.meta.url).pathname
const PROVIDER = env.WHATSAPP_PROVIDER || 'callmebot'
const ORIGIN = env.ALLOWED_ORIGIN || '*'
const FOLLOWUP_MINUTES = Number(env.FOLLOWUP_MINUTES ?? 15)
const SNOOZE_MINUTES = 10
const WINDOW_MINUTES = 10
const digits = (s) => String(s || '').replace(/\D/g, '')

/** Compara números; no Brasil a Meta às vezes envia o celular sem o 9 depois do DDD. */
function sameNumber(a, b) {
  const norm = (n) => {
    const d = digits(n)
    return d.length === 13 && d.startsWith('55') && d[4] === '9' ? d.slice(0, 4) + d.slice(5) : d
  }
  return norm(a) === norm(b)
}

if (!TOKEN) {
  console.error('Defina BOT_TOKEN (um código longo e secreto) antes de iniciar o bot.')
  process.exit(1)
}

/* ---------------- Estado ---------------- */

const emptyDay = (date) => ({ date, sent: [], pending: [], confirmations: [], snoozed: [] })

let state = { tasks: [], done: [], date: '', timezone: '', day: emptyDay('') }
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

/** Garante que o registro do dia é o de hoje (vira à meia-noite). */
function today() {
  const now = localNow()
  if (state.day?.date !== now.date) state.day = emptyDay(now.date)
  return now
}

/** Tarefas feitas hoje: o que o site mandou + o que você confirmou pelo WhatsApp. */
function doneToday(date) {
  const done = new Set(state.date === date ? state.done : [])
  for (const c of state.day.confirmations) done.add(c.id)
  return done
}

const taskById = (id) => state.tasks.find((t) => t.id === id)

/* ---------------- Envio pelo WhatsApp ---------------- */

async function cloudRequest(body) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${env.WA_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: digits(env.WA_TO), ...body }),
  })
  if (!res.ok) throw new Error(`WhatsApp Cloud API: ${res.status} ${await res.text()}`)
}

/** Mensagem de texto livre (a Meta só entrega se você escreveu para o bot nas últimas 24h). */
async function sendText(text) {
  if (PROVIDER === 'log') return console.log(`[whatsapp] ${text}`)
  if (PROVIDER === 'cloud') return cloudRequest({ type: 'text', text: { body: text } })
  const params = new URLSearchParams({ phone: env.CALLMEBOT_PHONE || '', text, apikey: env.CALLMEBOT_APIKEY || '' })
  const res = await fetch(`https://api.callmebot.com/whatsapp.php?${params}`)
  if (!res.ok) throw new Error(`CallMeBot: ${res.status} ${await res.text()}`)
}

/** Aviso de tarefa: usa o modelo aprovado, quando houver, para chegar a qualquer hora. */
async function sendReminder(task, prefix) {
  const text = `${prefix} *${task.title}* (${task.time}).\nResponda *1* quando fizer ou *2* para lembrar em ${SNOOZE_MINUTES} min.`
  if (PROVIDER === 'cloud' && env.WA_TEMPLATE) {
    return cloudRequest({
      type: 'template',
      template: {
        name: env.WA_TEMPLATE,
        language: { code: env.WA_TEMPLATE_LANG || 'pt_BR' },
        components: [{ type: 'body', parameters: [{ type: 'text', text: task.title }, { type: 'text', text: task.time }] }],
      },
    })
  }
  return sendText(text)
}

/* ---------------- Verificação periódica ---------------- */

async function tick() {
  const now = today()
  const done = doneToday(now.date)
  const sent = new Set(state.day.sent)
  const nowMs = Date.now()
  const jobs = []

  // 1. Avisos na hora marcada.
  for (const task of state.tasks) {
    if (task.reminder === null || task.reminder === undefined || done.has(task.id) || sent.has(task.id)) continue
    const target = toMinutes(task.time) - task.reminder
    const late = (((now.minutes - target) % 1440) + 1440) % 1440
    if (late >= WINDOW_MINUTES) continue
    state.day.sent.push(task.id)
    state.day.pending.push({ id: task.id, at: nowMs, followed: false })
    const prefix = task.reminder ? `Em ${task.reminder} min:` : 'Hora de'
    jobs.push(() => sendReminder(task, prefix))
  }

  // 2. "Lembrar em 10 min" (resposta 2).
  for (const s of state.day.snoozed.filter((s) => s.until <= nowMs)) {
    state.day.snoozed = state.day.snoozed.filter((x) => x !== s)
    const task = taskById(s.id)
    if (!task || done.has(task.id)) continue
    state.day.pending.push({ id: task.id, at: nowMs, followed: false })
    jobs.push(() => sendReminder(task, 'Lembrete:'))
  }

  // 3. Segundo aviso para quem ainda não respondeu.
  if (FOLLOWUP_MINUTES > 0) {
    for (const p of state.day.pending) {
      if (p.followed || done.has(p.id) || nowMs - p.at < FOLLOWUP_MINUTES * 60_000) continue
      p.followed = true
      const task = taskById(p.id)
      if (task) jobs.push(() => sendReminder(task, 'Ainda não confirmou:'))
    }
  }

  if (jobs.length) save()
  for (const job of jobs) {
    try {
      await job()
    } catch (err) {
      console.error('Falha ao enviar aviso:', err.message)
    }
  }
}

setInterval(() => tick().catch((e) => console.error(e)), 20_000)
tick().catch((e) => console.error(e))

/* ---------------- Respostas pelo WhatsApp ---------------- */

/** Última tarefa avisada que ainda não foi feita. */
function lastPending(done) {
  for (let i = state.day.pending.length - 1; i >= 0; i--) {
    const p = state.day.pending[i]
    if (!done.has(p.id) && taskById(p.id)) return taskById(p.id)
  }
  return null
}

async function handleReply(text) {
  const now = today()
  const done = doneToday(now.date)
  const answer = text.trim().toLowerCase()
  const task = lastPending(done)

  if (['1', 'feito', 'fiz', 'ok'].includes(answer)) {
    if (!task) return sendText('Nenhuma tarefa esperando confirmação agora. Bom trabalho!')
    state.day.confirmations.push({ id: task.id, at: Date.now() })
    save()
    const left = state.tasks.filter((t) => !doneToday(now.date).has(t.id)).length
    return sendText(`Feito: *${task.title}*. ${left === 0 ? 'Rotina de hoje completa!' : `Faltam ${left} tarefa(s) hoje.`}`)
  }
  if (answer === '2') {
    if (!task) return sendText('Nenhuma tarefa para adiar agora.')
    state.day.pending = state.day.pending.filter((p) => p.id !== task.id)
    state.day.snoozed.push({ id: task.id, until: Date.now() + SNOOZE_MINUTES * 60_000 })
    save()
    return sendText(`Combinado, lembro de *${task.title}* em ${SNOOZE_MINUTES} minutos.`)
  }
  if (answer === 'hoje') {
    const lines = [...state.tasks]
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((t) => `${done.has(t.id) ? '✅' : '⬜'} ${t.time} ${t.title}`)
    return sendText(lines.length ? `Sua rotina de hoje:\n${lines.join('\n')}` : 'Sua rotina está vazia.')
  }
  return sendText('Responda *1* para confirmar a última tarefa, *2* para lembrar em 10 min ou *hoje* para ver a rotina.')
}

function validSignature(raw, header) {
  if (!env.WA_APP_SECRET) return true
  if (!header?.startsWith('sha256=')) return false
  const expected = Buffer.from(`sha256=${createHmac('sha256', env.WA_APP_SECRET).update(raw).digest('hex')}`)
  const got = Buffer.from(header)
  return expected.length === got.length && timingSafeEqual(expected, got)
}

/** Mensagens recebidas no webhook da Meta; só valem as que vêm do seu número. */
function incomingTexts(payload) {
  const texts = []
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const msg of change.value?.messages ?? []) {
        if (!sameNumber(msg.from, env.WA_TO)) continue
        if (msg.type === 'text') texts.push(msg.text?.body ?? '')
        else if (msg.type === 'button') texts.push(msg.button?.text ?? '')
        else if (msg.type === 'interactive') texts.push(msg.interactive?.button_reply?.title ?? '')
      }
    }
  }
  return texts
}

/* ---------------- HTTP ---------------- */

function reply(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  })
  res.end(body === undefined ? '' : typeof body === 'string' && !type.includes('json') ? body : JSON.stringify(body))
}

function readRaw(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 500_000) reject(new Error('Conteúdo grande demais.'))
    })
    req.on('end', () => resolve(data))
  })
}

const parse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    throw new Error('JSON inválido.')
  }
}

const validTask = (t) =>
  t && typeof t.id === 'string' && typeof t.title === 'string' && /^\d{2}:\d{2}$/.test(t.time) &&
  (t.reminder === null || typeof t.reminder === 'number')

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (req.method === 'OPTIONS') return reply(res, 204)
  if (req.method === 'GET' && url.pathname === '/health') {
    return reply(res, 200, { ok: true, tarefas: state.tasks.length, envio: PROVIDER })
  }

  // Webhook da Meta: validação (GET) e mensagens recebidas (POST).
  if (url.pathname === '/webhook') {
    if (req.method === 'GET') {
      const ok = url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === env.WA_VERIFY_TOKEN
      return ok ? reply(res, 200, url.searchParams.get('hub.challenge') ?? '', 'text/plain') : reply(res, 403, 'Token inválido.')
    }
    if (req.method === 'POST') {
      const raw = await readRaw(req)
      if (!validSignature(raw, req.headers['x-hub-signature-256'])) return reply(res, 401, 'Assinatura inválida.')
      reply(res, 200, { ok: true }) // a Meta espera resposta rápida
      for (const text of incomingTexts(parse(raw))) {
        await handleReply(text).catch((err) => console.error('Falha ao responder:', err.message))
      }
      return
    }
  }

  if (req.headers.authorization !== `Bearer ${TOKEN}`) return reply(res, 401, 'Código de acesso inválido.')

  try {
    if (req.method === 'POST' && url.pathname === '/api/rotina') {
      const body = parse(await readRaw(req))
      if (!Array.isArray(body.tasks) || !body.tasks.every(validTask)) return reply(res, 400, 'Rotina inválida.')
      state.tasks = body.tasks.map(({ id, title, time, reminder }) => ({ id, title: title.slice(0, 80), time, reminder }))
      state.date = typeof body.date === 'string' ? body.date : ''
      const seen = new Set(Array.isArray(body.seen) ? body.seen : [])
      // O site manda o que está marcado nele. Confirmações do WhatsApp que ele ainda não viu continuam valendo.
      state.done = Array.isArray(body.done) ? body.done.filter((d) => typeof d === 'string') : []
      if (state.day.date === state.date) {
        state.day.confirmations = state.day.confirmations.filter((c) => !seen.has(`${c.id}@${c.at}`) || state.done.includes(c.id))
      }
      if (typeof body.timezone === 'string') state.timezone = body.timezone
      save()
      return reply(res, 200, { ok: true })
    }
    if (req.method === 'GET' && url.pathname === '/api/estado') {
      const now = today()
      return reply(res, 200, { date: now.date, confirmations: state.day.confirmations })
    }
    if (req.method === 'POST' && url.pathname === '/api/teste') {
      const sample = { title: 'Teste da Rotina Inteligente', time: '00:00' }
      await (PROVIDER === 'cloud' && env.WA_TEMPLATE
        ? sendReminder(sample, 'Hora de')
        : sendText('Rotina Inteligente: o bot está funcionando. Responda *hoje* para ver sua rotina.'))
      return reply(res, 200, { ok: true })
    }
    return reply(res, 404, 'Rota não encontrada.')
  } catch (err) {
    return reply(res, 500, err.message)
  }
}).listen(PORT, () => console.log(`Bot da Rotina Inteligente ouvindo na porta ${PORT} (envio: ${PROVIDER})`))
