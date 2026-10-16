import { useId, useState, type FormEvent } from 'react'
import { syncNow, useBotStatus } from '../components/ReminderEngine'
import {
  browserNotificationsSupported,
  normalizePhone,
  reminderTime,
  sendWhatsApp,
  setConfig,
  testBot,
  useReminderConfig,
} from '../lib/reminders'
import { useRoutine } from '../lib/store'

const CALLMEBOT_GUIDE = 'https://www.callmebot.com/blog/free-api-whatsapp-messages/'

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)}>
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
      <span className="switch-label">{label}</span>
    </button>
  )
}

function StatusPill({ on, children }: { on: boolean; children: string }) {
  return <span className={`pill${on ? ' pill-on' : ''}`}>{children}</span>
}

export function Avisos() {
  const id = useId()
  const config = useReminderConfig()
  const { tasks, doneToday, today } = useRoutine()
  const botStatus = useBotStatus()

  const [phone, setPhone] = useState(config.whatsapp.phone)
  const [apiKey, setApiKey] = useState(config.whatsapp.apiKey)
  const [waMessage, setWaMessage] = useState<string | null>(null)
  const [botUrl, setBotUrl] = useState(config.bot.url)
  const [botToken, setBotToken] = useState(config.bot.token)
  const [botMessage, setBotMessage] = useState<string | null>(null)
  const [permission, setPermission] = useState(
    browserNotificationsSupported() ? Notification.permission : 'unsupported',
  )

  const whatsappReady = config.whatsapp.enabled && Boolean(config.whatsapp.phone && config.whatsapp.apiKey)
  const botReady = config.bot.enabled && Boolean(config.bot.url)

  const upcoming = tasks
    .filter((t) => t.reminder !== null && !doneToday.has(t.id))
    .map((t) => ({ task: t, at: reminderTime(t) ?? t.time }))
    .sort((a, b) => a.at.localeCompare(b.at))

  const toggleBrowser = async (on: boolean) => {
    if (on && permission !== 'granted' && browserNotificationsSupported()) {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') return
    }
    setConfig((c) => ({ ...c, browser: on }))
  }

  const saveWhatsApp = (e: FormEvent) => {
    e.preventDefault()
    const digits = normalizePhone(phone)
    if (digits.length < 12) {
      setWaMessage('Use o número completo com código do país e DDD, por exemplo +55 11 91234-5678.')
      return
    }
    if (!apiKey.trim()) {
      setWaMessage('Cole a chave (apikey) que o bot enviou para o seu WhatsApp.')
      return
    }
    setConfig((c) => ({ ...c, whatsapp: { enabled: true, phone: `+${digits}`, apiKey: apiKey.trim() } }))
    setWaMessage('WhatsApp conectado. Envie uma mensagem de teste para conferir.')
  }

  const testWhatsApp = async () => {
    setWaMessage('Enviando…')
    try {
      await sendWhatsApp(config.whatsapp.phone, config.whatsapp.apiKey, 'Rotina Inteligente: tudo certo! Seus avisos vão chegar por aqui.')
      setWaMessage('Mensagem enviada. Ela costuma chegar em até 1 minuto. Se não chegar, confira o número e a chave.')
    } catch {
      setWaMessage('Não foi possível enviar agora. Confira sua conexão e tente de novo.')
    }
  }

  const saveBot = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^https?:\/\//.test(botUrl.trim())) {
      setBotMessage('O endereço precisa começar com https://')
      return
    }
    setConfig((c) => ({ ...c, bot: { enabled: true, url: botUrl.trim(), token: botToken.trim() } }))
    setBotMessage(null)
    await syncNow(tasks, [...doneToday], today)
  }

  const testServer = async () => {
    setBotMessage('Pedindo ao servidor para enviar um teste…')
    try {
      await testBot()
      setBotMessage('O servidor enviou a mensagem de teste para o WhatsApp configurado nele.')
    } catch (err) {
      setBotMessage((err as Error).message)
    }
  }

  return (
    <div className="container page avisos">
      <div className="page-head">
        <h1 className="page-title">Avisos</h1>
        <div className="pills">
          <StatusPill on={config.browser}>{config.browser ? 'Navegador ativo' : 'Navegador desligado'}</StatusPill>
          <StatusPill on={whatsappReady || botReady}>
            {botReady ? 'Bot no servidor' : whatsappReady ? 'WhatsApp conectado' : 'WhatsApp desconectado'}
          </StatusPill>
        </div>
      </div>

      <div className="avisos-grid">
        <section className="card" aria-labelledby={`${id}-wa`}>
          <div className="card-head">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="card-icon">
              <path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.4 18.6L4.5 19.5Z" />
              <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2L9 9.5Z" />
            </svg>
            <h2 id={`${id}-wa`} className="card-title">
              Bot de WhatsApp
            </h2>
          </div>
          <p className="muted">
            O bot manda uma mensagem no seu WhatsApp na hora de cada tarefa (ou alguns minutos antes, como você escolher
            em cada uma).
          </p>

          <ol className="steps-list">
            <li>
              <strong>Libere o bot no seu WhatsApp.</strong> Siga o passo a passo do{' '}
              <a href={CALLMEBOT_GUIDE} target="_blank" rel="noreferrer">
                CallMeBot
              </a>
              : salve o número do bot nos contatos e mande para ele a mensagem que a página indica. Em seguida você recebe
              uma chave (apikey).
            </li>
            <li>
              <strong>Preencha seu número e a chave</strong> aqui embaixo e toque em Conectar.
            </li>
            <li>
              <strong>Envie um teste</strong> para confirmar que chegou.
            </li>
          </ol>

          <form className="stack" onSubmit={saveWhatsApp}>
            <div className="field">
              <label htmlFor={`${id}-phone`}>Seu WhatsApp</label>
              <input
                id={`${id}-phone`}
                className="input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+55 11 91234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor={`${id}-key`}>Chave do bot (apikey)</label>
              <input
                id={`${id}-key`}
                className="input"
                autoComplete="off"
                placeholder="Ex.: 123456"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="row-actions">
              <button type="submit" className="btn btn-primary">
                {whatsappReady ? 'Salvar' : 'Conectar'}
              </button>
              {whatsappReady && (
                <>
                  <button type="button" className="btn btn-outline" onClick={testWhatsApp}>
                    Enviar teste
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setConfig((c) => ({ ...c, whatsapp: { ...c.whatsapp, enabled: false } }))
                      setWaMessage('WhatsApp desconectado.')
                    }}
                  >
                    Desconectar
                  </button>
                </>
              )}
            </div>
            {waMessage && (
              <p className="form-hint" role="status">
                {waMessage}
              </p>
            )}
          </form>

          <p className="note">
            Com o site aberto (pode ser em outra aba), os avisos saem direto daqui. Para receber mesmo com o site fechado,
            ligue o servidor do bot abaixo.
          </p>
        </section>

        <div className="stack-lg">
          <section className="card" aria-labelledby={`${id}-next`}>
            <h2 id={`${id}-next`} className="card-title">
              Próximos avisos de hoje
            </h2>
            {upcoming.length === 0 ? (
              <p className="muted">Nenhum aviso pendente. Escolha "Avisar" ao criar ou editar uma tarefa.</p>
            ) : (
              <ul className="next-list">
                {upcoming.map(({ task, at }) => (
                  <li key={task.id}>
                    <span className="next-at">{at}</span>
                    <span className="next-title">{task.title}</span>
                    <span className="next-meta">{task.reminder === 0 ? 'na hora' : `${task.reminder} min antes`}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card" aria-labelledby={`${id}-browser`}>
            <h2 id={`${id}-browser`} className="card-title">
              Avisos no navegador
            </h2>
            {permission === 'unsupported' ? (
              <p className="muted">Este navegador não mostra notificações. Os avisos aparecem dentro da página.</p>
            ) : (
              <>
                <Switch checked={config.browser} onChange={toggleBrowser} label="Mostrar notificação neste aparelho" />
                {permission === 'denied' && (
                  <p className="form-hint">
                    As notificações estão bloqueadas. Libere nas configurações do site, no cadeado ao lado do endereço.
                  </p>
                )}
              </>
            )}
          </section>

          <details className="card details" open={config.bot.enabled}>
            <summary>
              <span className="card-title">Servidor do bot</span>
              <span className="muted">Avisa mesmo com o site fechado</span>
            </summary>
            <p className="muted">
              Publique a pasta <code>bot/</code> do projeto (instruções no README) e cole aqui o endereço e o código de
              acesso. A rotina passa a ser enviada para o servidor sempre que mudar, e é ele que manda os avisos.
            </p>
            <form className="stack" onSubmit={saveBot}>
              <div className="field">
                <label htmlFor={`${id}-url`}>Endereço do servidor</label>
                <input
                  id={`${id}-url`}
                  className="input"
                  type="url"
                  inputMode="url"
                  placeholder="https://meu-bot.onrender.com"
                  value={botUrl}
                  onChange={(e) => setBotUrl(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`${id}-token`}>Código de acesso (BOT_TOKEN)</label>
                <input
                  id={`${id}-token`}
                  className="input"
                  autoComplete="off"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                />
              </div>
              <div className="row-actions">
                <button type="submit" className="btn btn-primary">
                  {config.bot.enabled ? 'Salvar e sincronizar' : 'Ligar servidor'}
                </button>
                {config.bot.enabled && (
                  <>
                    <button type="button" className="btn btn-outline" onClick={testServer}>
                      Enviar teste
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setConfig((c) => ({ ...c, bot: { ...c.bot, enabled: false } }))}
                    >
                      Desligar
                    </button>
                  </>
                )}
              </div>
              {config.bot.enabled && botStatus.state !== 'idle' && (
                <p className={`form-hint${botStatus.state === 'error' ? ' form-error' : ''}`} role="status">
                  {botStatus.state === 'ok' ? `Rotina sincronizada às ${botStatus.at}.` : botStatus.message}
                </p>
              )}
              {botMessage && (
                <p className="form-hint" role="status">
                  {botMessage}
                </p>
              )}
            </form>
          </details>
        </div>
      </div>
    </div>
  )
}
