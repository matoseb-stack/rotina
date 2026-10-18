import { useId, useState, type FormEvent, type ReactNode } from 'react'
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
const SITE_ORIGIN = 'https://matoseb-stack.github.io'

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

/** Prévia da conversa com o bot. */
function ChatPreview() {
  return (
    <div className="chat" aria-label="Exemplo de conversa com o bot">
      <p className="bubble bubble-bot">
        Hora de <strong>Caminhada curta</strong> (17:30).
        <br />
        Responda <strong>1</strong> quando fizer ou <strong>2</strong> para lembrar em 10 min.
      </p>
      <p className="bubble bubble-me">1</p>
      <p className="bubble bubble-bot">
        Feito: <strong>Caminhada curta</strong>. Faltam 2 tarefa(s) hoje.
      </p>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="guide-step">
      <span className="guide-n" aria-hidden="true">
        {n}
      </span>
      <div>
        <h4>{title}</h4>
        {children}
      </div>
    </li>
  )
}

function Guide() {
  return (
    <details className="guide">
      <summary>Passo a passo para criar o bot (uns 30 minutos)</summary>
      <div className="guide-body">
        <p className="muted">
          O bot usa a API oficial do WhatsApp, da Meta. É ela que permite receber o seu "1". Faça no navegador (de
          preferência no computador) e guarde num bloco de notas os códigos marcados como <em>anote</em>.
        </p>

        <h3 className="guide-part">Parte 1. Criar o número do bot na Meta</h3>
        <ol className="guide-list">
          <Step n={1} title="Crie o app">
            <p>
              Entre em <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">developers.facebook.com/apps</a>{' '}
              com sua conta do Facebook, toque em <b>Criar app</b> e escolha o uso <b>WhatsApp</b> (ou o tipo{' '}
              <b>Empresa</b>). Siga até o fim, criando uma conta empresarial se ele pedir.
            </p>
          </Step>
          <Step n={2} title="Pegue o número de teste">
            <p>
              No app, abra <b>WhatsApp → Configuração da API</b>. A Meta já cria um número de teste gratuito.{' '}
              <em>Anote</em> o <b>ID do número de telefone</b>.
            </p>
          </Step>
          <Step n={3} title="Cadastre o seu WhatsApp">
            <p>
              Na mesma tela, em <b>Para</b>, adicione o seu número e confirme com o código que chega no WhatsApp.
            </p>
          </Step>
          <Step n={4} title="Gere o token permanente">
            <p>
              O token que aparece na tela expira em 24 horas. Para um que não expira, abra{' '}
              <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer">
                Configurações do negócio → Usuários do sistema
              </a>
              , adicione um usuário <b>Administrador</b>, atribua a ele o app e a conta do WhatsApp (controle total) e toque
              em <b>Gerar token</b> com as permissões <code>whatsapp_business_messaging</code> e{' '}
              <code>whatsapp_business_management</code>. <em>Anote</em> o token.
            </p>
          </Step>
          <Step n={5} title="Copie a chave secreta do app">
            <p>
              Em <b>Configurações do app → Básico</b>, toque em <b>Mostrar</b> na <b>Chave secreta do aplicativo</b>.{' '}
              <em>Anote</em>.
            </p>
          </Step>
          <Step n={6} title="Crie o modelo do aviso (recomendado)">
            <p>
              A Meta só entrega mensagem livre se você escreveu para o bot nas últimas 24 horas. Com um modelo aprovado,
              o aviso chega a qualquer hora. No <b>Gerenciador do WhatsApp → Modelos de mensagem</b>, crie:
            </p>
            <ul className="guide-facts">
              <li>
                Categoria <b>Utilidade</b>, nome <code>lembrete_tarefa</code>, idioma <b>Português (BR)</b>
              </li>
              <li>
                Texto: <code>Hora de {'{{1}}'} ({'{{2}}'}). Responda 1 quando fizer ou 2 para lembrar em 10 min.</code>
              </li>
            </ul>
            <p className="muted">A aprovação costuma levar minutos. A Meta pode cobrar por mensagens de modelo; confira os preços dela.</p>
          </Step>
        </ol>

        <h3 className="guide-part">Parte 2. Colocar o bot no ar</h3>
        <ol className="guide-list" start={7}>
          <Step n={7} title="Publique o servidor">
            <p>
              Em <a href="https://railway.com" target="_blank" rel="noreferrer">railway.com</a>, entre com o GitHub e toque
              em <b>New Project → Deploy from GitHub repo → matoseb-stack/rotina</b>. No serviço criado, em{' '}
              <b>Settings</b>, coloque <b>Root Directory</b> = <code>bot</code> e, em <b>Networking</b>, toque em{' '}
              <b>Generate Domain</b>. <em>Anote</em> o endereço. O Railway tem um período de teste e depois cobra um valor
              mensal; qualquer serviço que rode Node o tempo todo também serve.
            </p>
          </Step>
          <Step n={8} title="Preencha as variáveis">
            <p>
              Em <b>Variables</b>, adicione:
            </p>
            <dl className="vars">
              <dt>BOT_TOKEN</dt>
              <dd>uma senha longa que você inventa</dd>
              <dt>WHATSAPP_PROVIDER</dt>
              <dd>
                <code>cloud</code>
              </dd>
              <dt>WA_TOKEN</dt>
              <dd>o token permanente (passo 4)</dd>
              <dt>WA_PHONE_NUMBER_ID</dt>
              <dd>o ID do número (passo 2)</dd>
              <dt>WA_TO</dt>
              <dd>seu WhatsApp só com números, ex. 5511912345678</dd>
              <dt>WA_VERIFY_TOKEN</dt>
              <dd>outra palavra que você inventa</dd>
              <dt>WA_APP_SECRET</dt>
              <dd>a chave secreta (passo 5)</dd>
              <dt>WA_TEMPLATE</dt>
              <dd>
                <code>lembrete_tarefa</code> (se fez o passo 6)
              </dd>
              <dt>TZ_NAME</dt>
              <dd>
                <code>America/Sao_Paulo</code>
              </dd>
              <dt>ALLOWED_ORIGIN</dt>
              <dd>
                <code>{SITE_ORIGIN}</code>
              </dd>
            </dl>
          </Step>
          <Step n={9} title="Ligue o webhook na Meta">
            <p>
              No app da Meta, abra <b>WhatsApp → Configuração → Webhook → Editar</b>. Em <b>URL de retorno</b>, coloque o
              endereço do passo 7 seguido de <code>/webhook</code>; em <b>Token de verificação</b>, o seu{' '}
              <code>WA_VERIFY_TOKEN</code>. Toque em <b>Verificar e salvar</b> e, em <b>Campos do webhook</b>, assine{' '}
              <b>messages</b>.
            </p>
          </Step>
        </ol>

        <h3 className="guide-part">Parte 3. Conectar ao site</h3>
        <ol className="guide-list" start={10}>
          <Step n={10} title="Cole aqui embaixo e teste">
            <p>
              Preencha o endereço e o <code>BOT_TOKEN</code>, toque em <b>Ligar bot</b> e depois em <b>Enviar teste</b>. No
              WhatsApp, mande <b>hoje</b> para o bot: ele responde com a sua rotina.
            </p>
          </Step>
        </ol>
      </div>
    </details>
  )
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
      setWaMessage('Cole a chave (apikey) que o CallMeBot enviou para o seu WhatsApp.')
      return
    }
    setConfig((c) => ({ ...c, whatsapp: { enabled: true, phone: `+${digits}`, apiKey: apiKey.trim() } }))
    setWaMessage('Avisos simples ligados. Envie uma mensagem de teste para conferir.')
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
    if (!botToken.trim()) {
      setBotMessage('Cole o BOT_TOKEN que você colocou nas variáveis do servidor.')
      return
    }
    setConfig((c) => ({ ...c, bot: { enabled: true, url: botUrl.trim(), token: botToken.trim() } }))
    setBotMessage(null)
    await syncNow(tasks, [...doneToday], today)
  }

  const testServer = async () => {
    setBotMessage('Pedindo ao bot para enviar um teste…')
    try {
      await testBot()
      setBotMessage('O bot enviou a mensagem de teste. Confira o WhatsApp.')
    } catch (err) {
      setBotMessage((err as Error).message)
    }
  }

  return (
    <div className="container page avisos">
      <div className="page-head">
        <h1 className="page-title">Avisos</h1>
        <div className="pills">
          <StatusPill on={botReady}>{botReady ? 'Bot de WhatsApp ligado' : 'Bot de WhatsApp desligado'}</StatusPill>
          <StatusPill on={config.browser}>{config.browser ? 'Navegador ativo' : 'Navegador desligado'}</StatusPill>
        </div>
      </div>

      <div className="avisos-grid">
        <div className="stack-lg">
          <section className="card" aria-labelledby={`${id}-bot`}>
            <div className="card-head">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="card-icon">
                <path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.4 18.6L4.5 19.5Z" />
                <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2L9 9.5Z" />
              </svg>
              <h2 id={`${id}-bot`} className="card-title">
                Bot de WhatsApp
              </h2>
            </div>
            <p className="muted">
              Na hora de cada tarefa o bot manda uma mensagem. Responda <strong>1</strong> quando fizer e a tarefa fica
              marcada aqui no site. Se não responder, ele lembra de novo 15 minutos depois. Funciona com o site fechado.
            </p>
            <ChatPreview />
            <Guide />

            <form className="stack" onSubmit={saveBot}>
              <div className="field">
                <label htmlFor={`${id}-url`}>Endereço do bot</label>
                <input
                  id={`${id}-url`}
                  className="input"
                  type="url"
                  inputMode="url"
                  placeholder="https://rotina-bot.up.railway.app"
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
                  {config.bot.enabled ? 'Salvar e sincronizar' : 'Ligar bot'}
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
                  {botStatus.state === 'ok' ? `Rotina enviada ao bot às ${botStatus.at}.` : botStatus.message}
                </p>
              )}
              {botMessage && (
                <p className="form-hint" role="status">
                  {botMessage}
                </p>
              )}
            </form>
          </section>

          <details className="card details">
            <summary>
              <span className="card-title">Aviso simples pelo WhatsApp</span>
              <span className="muted">Sem servidor, só avisa e não recebe o "1"</span>
            </summary>
            <p className="muted">
              Usa o{' '}
              <a href={CALLMEBOT_GUIDE} target="_blank" rel="noreferrer">
                CallMeBot
              </a>
              , gratuito: salve o número do bot nos contatos, mande a mensagem que a página dele indica e cole aqui a chave
              (apikey) que ele responder. Os avisos saem enquanto o site estiver aberto em alguma aba. Com o bot de
              WhatsApp ligado, este aviso simples fica desativado para não repetir mensagens.
            </p>
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
                <label htmlFor={`${id}-key`}>Chave do CallMeBot (apikey)</label>
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
                        setWaMessage('Aviso simples desligado.')
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
          </details>
        </div>

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
        </div>
      </div>
    </div>
  )
}
