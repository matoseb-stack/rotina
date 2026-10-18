# Rotina Inteligente

Organizador de rotina diária simples, com estética natural, que avisa você pelo WhatsApp na hora de cada tarefa.
Vite + React + TypeScript, CSS puro com variáveis. A rotina fica salva no `localStorage` do navegador.

**Site:** https://matoseb-stack.github.io/rotina/

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

Na hora de cada tarefa o bot manda uma mensagem no WhatsApp. Responda:

- **1** (ou "feito") para marcar a tarefa como feita, inclusive no site;
- **2** para lembrar de novo em 10 minutos;
- **hoje** para ver a rotina do dia.

Se você não responder, ele lembra mais uma vez depois de 15 minutos (`FOLLOWUP_MINUTES`).

O bot fica na pasta `bot/` (Node 18+, sem dependências) e usa a WhatsApp Cloud API, da Meta, que é o que permite
receber as respostas. O passo a passo completo, com cada tela da Meta e do Railway, está no site em
**Avisos → Passo a passo para criar o bot**.

Há também o **aviso simples** pelo [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/), sem servidor:
só avisa (não recebe o "1") e funciona enquanto o site estiver aberto.

### Variáveis do servidor

| Variável | Para quê |
|---|---|
| `BOT_TOKEN` | Código que o site usa para falar com o bot (obrigatório) |
| `WHATSAPP_PROVIDER` | `cloud` (responde ao "1"), `callmebot` (só envia) ou `log` (só imprime, para testes) |
| `WA_TOKEN`, `WA_PHONE_NUMBER_ID` | Token permanente e ID do número na WhatsApp Cloud API |
| `WA_TO` | Seu WhatsApp, só números (ex. `5511912345678`) |
| `WA_VERIFY_TOKEN` | Palavra que você inventa para validar o webhook na Meta |
| `WA_APP_SECRET` | Chave secreta do app; o bot recusa chamadas que não vêm da Meta |
| `WA_TEMPLATE`, `WA_TEMPLATE_LANG` | Modelo aprovado para os avisos (`lembrete_tarefa`, `pt_BR`) |
| `FOLLOWUP_MINUTES` | Minutos até o segundo aviso (padrão 15; 0 desliga) |
| `TZ_NAME` | Fuso dos horários (ex. `America/Sao_Paulo`) |
| `ALLOWED_ORIGIN` | Endereço do site liberado (`https://matoseb-stack.github.io`) |
| `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY` | Se usar `callmebot` |
| `PORT`, `DATA_FILE` | Porta HTTP (8787) e arquivo onde a rotina fica salva |

Rotas: `POST /api/rotina` e `GET /api/estado` (site, com `BOT_TOKEN`), `POST /api/teste`, `GET|POST /webhook` (Meta)
e `GET /health`.

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
