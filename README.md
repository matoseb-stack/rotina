# Rotina Inteligente

Organizador de rotina diária simples, com estética natural, que avisa você pelo WhatsApp na hora de cada tarefa.
Vite + React + TypeScript, CSS puro com variáveis. A rotina fica salva no `localStorage` do navegador.

**Site:** https://matoseb-stack.github.io/rotina/ (depois de ativar o GitHub Pages, veja abaixo)

## Rodar

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (normalmente http://localhost:5173).

## Páginas

- `/` Início: apresentação e o cartão "Hoje" funcionando.
- `/rotina` Minha rotina: "Nova tarefa" abre uma janela com sugestões prontas, seletor de horário por período
  (Manhã, Tarde, Noite), escolha de hora e minutos com um toque e quando avisar (na hora, 5, 15 ou 30 min antes).
- `/progresso` Progresso: gráfico dos últimos 7 dias e sequência de dias com 100%.
- `/avisos` Avisos: conectar o bot de WhatsApp, avisos no navegador e o servidor do bot.

As tarefas se repetem todo dia. O "feito" recomeça a cada novo dia, e o histórico de cada data fica guardado.
Tarefa marcada como feita não gera aviso.

## Bot de WhatsApp

Há dois jeitos de receber os avisos, e os dois usam o [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/)
(gratuito, para uso pessoal):

1. **Direto do site.** Em *Avisos*, siga os passos para liberar o bot no seu WhatsApp, cole seu número e a chave
   (apikey) e toque em *Enviar teste*. Funciona enquanto o site estiver aberto em alguma aba.
2. **Servidor do bot** (pasta `bot/`), para receber os avisos mesmo com o site fechado. O site envia a rotina ao
   servidor sempre que ela muda, e o servidor manda as mensagens.

### Rodar o servidor do bot

Node 18 ou mais novo, sem dependências:

```bash
cd bot
BOT_TOKEN=um-codigo-longo-e-secreto \
CALLMEBOT_PHONE=+5511912345678 \
CALLMEBOT_APIKEY=sua-chave \
ALLOWED_ORIGIN=https://matoseb-stack.github.io \
npm start
```

Publique em qualquer serviço que rode Node o tempo todo (Railway, Fly.io, um VPS ou um Raspberry Pi em casa).
Planos gratuitos que "dormem" sem acesso (como o free do Render) podem atrasar ou perder avisos.
Depois, em *Avisos → Servidor do bot*, cole o endereço público e o `BOT_TOKEN`.

| Variável | Para quê |
|---|---|
| `BOT_TOKEN` | Código que o site usa para falar com o servidor (obrigatório) |
| `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY` | Seu número e a chave do CallMeBot |
| `WHATSAPP_PROVIDER` | `callmebot` (padrão), `cloud` (WhatsApp Cloud API da Meta) ou `log` (só imprime, para testes) |
| `WA_TOKEN`, `WA_PHONE_NUMBER_ID`, `WA_TO` | Dados da WhatsApp Cloud API, se usar `cloud` |
| `TZ_NAME` | Fuso dos horários (padrão: o do navegador que sincronizou, ou `America/Sao_Paulo`) |
| `ALLOWED_ORIGIN` | Endereço do site liberado para sincronizar (padrão `*`) |
| `PORT`, `DATA_FILE` | Porta HTTP (8787) e arquivo onde a rotina fica salva |

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` gera o site a cada push e o envia para a branch `gh-pages`.
Falta só ligar o Pages, uma vez:

1. No GitHub, abra **Settings → Pages**.
2. Em *Build and deployment*, escolha **Deploy from a branch**, branch **gh-pages**, pasta **/ (root)**, e salve.
3. Em 1 ou 2 minutos o site abre em `https://matoseb-stack.github.io/rotina/`.

Repositório privado só tem GitHub Pages em planos pagos (Pro, Team ou Enterprise). No plano gratuito, torne o
repositório público em *Settings → General → Danger Zone*.

Para outra hospedagem estática, rode `npm run build` e envie a pasta `dist/`. O build gera um `404.html` para
`/rotina` e `/progresso` funcionarem ao recarregar. Em subpasta, use `BASE_PATH=/subpasta/ npm run build`.

## Estrutura

```
src/
  components/  Logo, Header, Footer, TodayCard, TaskItem, TaskForm, TaskSheet, TimePicker,
               ProgressRing, WeekChart, ReminderEngine
  pages/       Home, Rotina, Progresso, Avisos, Privacidade
  lib/         store.tsx (rotina), reminders.ts (avisos e WhatsApp), dates.ts, router.tsx
bot/           servidor do bot de WhatsApp (Node, sem dependências)
public/favicon.svg
```


## Painel de Investimentos (Android)

App Android nativo para tablet, em Jetpack Compose, com cotações em tempo real (dados simulados). Veja [`android-investimentos/`](android-investimentos/README.md).

## Painel de Investimentos (Web / PWA)

Versão web em Next.js + Tailwind, com tema claro/escuro, gráficos por ativo e notícias da Folha de S.Paulo. Publicada pelo mesmo workflow do GitHub Pages em `/investimentos`. Veja [`web-investimentos/`](web-investimentos/README.md) para colocar no ar (Vercel ou GitHub Pages).
