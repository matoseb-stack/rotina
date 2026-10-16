# 🌿 Rotina Inteligente

Protótipo de um organizador de rotina simples, com visual natural e calmo.

## O que faz

- **Adicione tarefas com horário** — início, fim (opcional), cor e anotação.
- **Repetição**: todo dia, dias úteis, toda semana ou só uma vez.
- **Três vistas**: **Dia** (lista com progresso e checkbox de "feito"), **Semana** e **Mês**.
- **Eventos futuros**: marque compromissos em qualquer data; os próximos aparecem na lateral.
- Tudo fica salvo no próprio navegador (`localStorage`). Sem login, sem servidor.

## Conectores

| Conector | Status | O que faz |
|---|---|---|
| 📅 Calendário | ativo | Exporta a rotina em `.ics` (Google Agenda, Apple, Outlook), importa `.ics` e abre qualquer item direto no Google Agenda. |
| 💬 WhatsApp | em breve | Hoje: envia o resumo do dia via `wa.me`. Futuro: bot com lembretes e criação de tarefas por mensagem. |

O código dos conectores fica em `js/connectors.js`. O ponto de encaixe do bot de
WhatsApp é `Conectores.WhatsApp.bot` (preencher `endpoint` e implementar `sincronizar`).

## Rodar

É um site estático: abra `index.html` no navegador.

Para publicar no **GitHub Pages**: *Settings → Pages → Deploy from a branch*, escolha a
branch e a pasta `/ (root)`.

## Estrutura

```
index.html          página
css/style.css       visual (tons de papel, folha e terra)
js/app.js           rotina, vistas dia/semana/mês, formulário
js/connectors.js    calendário (.ics / Google) e WhatsApp
```
