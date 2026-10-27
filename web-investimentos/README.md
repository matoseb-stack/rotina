# Painel de Investimentos · Web

**🔗 Link público: https://matoseb-stack.github.io/rotina/investimentos/**

Painel de investimentos com **cotações e gráficos reais da B3**, visual
**clean e institucional**, temas **claro e escuro** e notícias da
**Folha de S.Paulo**. Funciona no navegador de qualquer laptop, PC ou celular
(iPhone/Android) e pode ser instalado como app (PWA).

![Ações, tema claro](docs/acoes-claro.jpg)

| Deep-dive da ação | Tema escuro |
|---|---|
| ![Modal da ação](docs/modal-acao.jpg) | ![Ações, tema escuro](docs/acoes-escuro.jpg) |

![iPhone](docs/iphone.jpg)

> **De onde vêm os dados**
>
> | O quê | Fonte | Atualização |
> |---|---|---|
> | Cotações, variação, volume, 52 semanas | **Yahoo Finance** (B3, atraso de até 15 min) | a cada 60 s na Vercel · a cada 15 min no GitHub Pages durante o pregão |
> | Gráficos 1D · 5D · 1M · 6M · 1Y · ALL | **Yahoo Finance** (histórico real) | 5 min na Vercel · 15 min no GitHub Pages |
> | Selic Meta, CDI, IPCA 12m | **Banco Central** (SGS: séries 432, 4389, 13522) | 1 h |
> | Notícias gerais e por ação | **Folha de S.Paulo** | 15 min na Vercel · 1 h no GitHub Pages |
> | Taxas dos títulos do Tesouro Direto | **simuladas** (o Tesouro desativou a API pública) | 1 s |
>
> Se o Yahoo Finance ficar indisponível, o painel avisa e mostra valores de
> referência ou simulados, sempre sinalizados.

---

## 🚀 Colocar no ar e ganhar um link público

Escolha **uma** das opções. As duas geram um endereço `https://...` que abre em
qualquer navegador, inclusive no celular.

### Opção A: Vercel (cotações mais frescas, ~3 minutos)

Na Vercel o servidor busca as cotações a cada 60 s e as notícias a cada 15 min,
sem precisar de rebuild.

1. Acesse **https://vercel.com** e entre com sua conta do **GitHub**.
2. Clique em **Add New… → Project** e escolha o repositório **`rotina`**
   (se não aparecer, clique em *Adjust GitHub App Permissions* e libere o repositório).
3. Em **Root Directory**, clique em *Edit* e selecione **`web-investimentos`**.
   O *Framework Preset* deve ser detectado como **Next.js**. Não mude mais nada.
4. Clique em **Deploy**. Em ~1 minuto aparece o link, algo como
   `https://rotina-xxxx.vercel.app`.
5. Pronto. Cada `git push` na branch principal publica uma nova versão
   automaticamente. Outras branches ganham links de *preview*.

### Opção B: GitHub Pages (já configurado neste repositório)

O link **https://matoseb-stack.github.io/rotina/investimentos/** é publicado
pelo workflow `.github/workflows/investimentos.yml`. Ele:

- gera o painel como site estático, já com cotações, gráficos e notícias do momento;
- publica **só** a pasta `/investimentos` na branch `gh-pages`, sem mexer no
  app Rotina que fica na raiz;
- roda a cada push que altera `web-investimentos/`.

Para o link se **atualizar sozinho** (a cada 15 min no pregão e de hora em
hora fora dele), o workflow precisa estar na branch padrão: **faça o merge
desta branch na `main`**. O GitHub só executa agendamentos (`schedule`) a
partir da branch padrão.

Para publicar em outro repositório/fork: **Settings → Pages → Deploy from a
branch → `gh-pages` / `(root)`**, depois **Actions → Publicar Painel de
Investimentos → Run workflow**. O endereço fica
`https://<usuario>.github.io/<repositorio>/investimentos/`.

### Instalar como app no celular

- **iPhone (Safari):** abra o link → botão **Compartilhar** → **Adicionar à Tela de Início**.
- **Android (Chrome):** abra o link → menu **⋮** → **Instalar app**.

---

## Rodando localmente

```bash
cd web-investimentos
npm install
npm run dev                 # http://localhost:3000
npm run build && npm start  # produção (servidor Next, igual à Vercel)
npm run build:static        # export estático em ./out (igual ao GitHub Pages)
```

Para testar no celular na mesma rede Wi-Fi: `npx next start -H 0.0.0.0` e abra
`http://<ip-do-computador>:3000`.

Stack: Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Recharts 3 ·
framer-motion · TypeScript.

---

## O que tem no painel

### Ações (B3)
- Resumo do dia: **Ibovespa** com a curva do pregão e as **3 maiores altas e baixas**.
- **Grid de cards** das 15 principais ações (2 colunas no celular, 3 no tablet,
  4 no desktop), ordenável por A–Z, maiores altas ou maiores baixas.
- Cada card mostra logo, ticker, preço, variação, uma faixa verde/vermelha
  discreta e o **gráfico real do pregão**.
- **Modal deep-dive** ao clicar:
  1. **Cabeçalho:** logo, nome, ticker, preço e variação ao vivo.
  2. **Gráfico real (Recharts)** com períodos `1D · 5D · 1M · 6M · 1Y · ALL`,
     tooltip, linha do fechamento anterior e variação no período.
  3. **Notícias do ativo (Folha de S.Paulo)** à direita, com título, resumo,
     horário e link direto para a matéria (`target="_blank"`).
  4. Abertura, mínima, máxima, fechamento anterior, volume, faixa de 52
     semanas e um "Sobre a empresa".

### Tesouro Direto
Indicadores no topo (Selic Meta, CDI, IPCA 12m) e uma coluna por tipo:
**Selic**, **IPCA+** e **Prefixado**. Cada coluna explica o título em uma frase
e mostra taxa, variação em bps, preço unitário e investimento mínimo.

### Notícias
Manchetes de Mercado da Folha com filtros **Macro · Câmbio · Tesouro · Ações**.
Cada item abre a matéria original na Folha.

---

## Como funciona

### Temas claro/escuro
- Cores definidas como variáveis CSS em `src/app/globals.css` (`:root` = claro,
  `[data-theme="dark"]` = escuro) e expostas ao Tailwind via `@theme inline`
  (`bg-surface`, `text-muted`, `text-up`, `text-down`...).
- Um script inline no `<head>` aplica o tema salvo (ou o do sistema) **antes da
  primeira pintura**, sem "piscar" o tema errado. O botão ☀️/🌙 no topo alterna
  e salva a escolha.

### Cotações e gráficos reais
- `src/lib/market/real/` consulta a API pública de gráficos do Yahoo Finance
  (`PETR4.SA`, `^BVSP`...) no **servidor ou no build**. O navegador não acessa
  o Yahoo direto (sem CORS).
- `/api/market/quotes.json`: preço, variação, abertura, mínima/máxima,
  volume, faixa de 52 semanas e a curva do dia de cada ativo + Selic/CDI/IPCA
  do Banco Central.
- `/api/market/history/<TICKER>.json`: as 6 séries do gráfico (1D em 5 min,
  5D em 30 min, 1M/6M/1Y diários, ALL mensal).
- No navegador, `src/lib/market/store.ts` recarrega as cotações a cada 60 s
  (só com a aba visível). Componentes leem com `useMarketData(seletor)`
  (`useSyncExternalStore`), e só quem usa o dado re-renderiza.

### Notícias da Folha
| Arquivo gerado | Origem |
|---|---|
| `/api/news.json` | RSS de Mercado da Folha (`feeds.folha.uol.com.br/mercado/rss091.xml`) |
| `/api/asset-news/<TICKER>.json` | Página de tópico da empresa na Folha (ex.: `/folha-topicos/petrobras/`) ou a busca da Folha, filtrada para seções de negócios que citam a empresa |

- Os dois são *Route Handlers* estáticos: viram arquivos JSON no build
  (GitHub Pages) e são revalidados a cada 15 min no servidor (Vercel).
- Só links de domínios da Folha são aceitos. Se o RSS geral falhar, a aba de
  notícias mostra manchetes **simuladas** com o selo "Simulado", nunca
  atribuídas à Folha. As notícias por ativo não têm conteúdo simulado: sem
  resultado, o modal oferece o link para a página da empresa na Folha.
- Logos das empresas: ícones públicos da [brapi.dev](https://brapi.dev),
  com monograma na cor da marca como reserva.

### Estrutura

```
src/
├── app/
│   ├── layout.tsx                    # fonte, PWA, script de tema
│   ├── globals.css                   # design system (tokens claro/escuro)
│   ├── manifest.ts
│   └── api/
│       ├── market/quotes.json/route.ts     # cotações reais + macro (BCB)
│       ├── market/history/[file]/route.ts  # histórico real por ativo
│       ├── news.json/route.ts              # notícias gerais (Folha · Mercado)
│       └── asset-news/[file]/route.ts      # notícias por ativo
├── components/
│   ├── layout/      AppHeader · BottomNav
│   ├── theme/       ThemeToggle
│   ├── stocks/      StocksPanel · StockCard · StockModal · StockChart · AssetNews
│   ├── treasury/    TreasuryPanel
│   ├── news/        NewsPanel
│   └── ui/          StockLogo · LivePrice/TickDot · ChangeChip · Sparkline · Icon
├── hooks/           useMarketData · useStockHistory · useNewsFeed · useAssetNews · useNow
└── lib/
    ├── market/      seeds · simulator · store · history
    ├── news/        folha · companies · company-sources · classify · mock · types
    ├── theme.ts · base-path.ts · format.ts · tabs.ts
```

> Em ambientes que exigem proxy HTTP para sair à internet, rode o build com
> `NODE_USE_ENV_PROXY=1` (Node 22+). Sem isso, o `fetch` do Node ignora o
> proxy e cotações e notícias caem no modo de reserva.
