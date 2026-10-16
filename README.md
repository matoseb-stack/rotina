# Rotina Inteligente

Organizador de rotina diária simples, com estética natural.
Vite + React + TypeScript, CSS puro com variáveis. Os dados ficam no `localStorage` do navegador (sem backend).

## Rodar

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (normalmente http://localhost:5173).

## Páginas

- `/` Início: apresentação e o cartão "Hoje" funcionando.
- `/rotina` Minha rotina: adicionar, editar, excluir e marcar tarefas. O período (Manhã/Tarde/Noite) é sugerido pelo horário.
- `/progresso` Progresso: gráfico dos últimos 7 dias e sequência de dias com 100%.

As tarefas se repetem todo dia. O "feito" recomeça a cada novo dia, e o histórico de cada data fica guardado.

## Publicar (build estático)

```bash
npm run build
```

Envie a pasta `dist/` para qualquer hospedagem estática (Netlify, Vercel, Cloudflare Pages, GitHub Pages).
O build já gera um `404.html` igual ao `index.html`, para que `/rotina` e `/progresso` funcionem ao recarregar a página.

Se o site ficar numa subpasta (ex.: GitHub Pages em `usuario.github.io/rotina/`), defina o caminho base no build:

```bash
BASE_PATH=/rotina/ npm run build
```

## Estrutura

```
src/
  components/  Logo, Header, Footer, TodayCard, TaskItem, TaskForm, ProgressRing, WeekChart
  pages/       Home, Rotina, Progresso, Privacidade
  lib/         store.tsx (estado + localStorage), dates.ts, router.tsx (roteador mínimo)
public/favicon.svg
```
