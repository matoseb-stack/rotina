// Gera um único arquivo HTML (CSS e JS embutidos) com rotas por âncora (#rotina),
// para hospedagens que servem só uma página.
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const out = 'dist-artifact'
execSync(`npx vite build --outDir ${out} --base ./`, {
  stdio: 'inherit',
  env: { ...process.env, VITE_ROUTER: 'hash' },
})

const assets = readdirSync(`${out}/assets`)
const read = (ext) => readFileSync(`${out}/assets/${assets.find((f) => f.endsWith(ext))}`, 'utf8')
const css = read('.css')
const js = read('.js').replace(/<\/script/gi, '<\\/script')

const html = `<title>Rotina Inteligente</title>
<meta name="description" content="Rotina Inteligente: organize o dia sem esforço.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Nunito:wght@800&display=swap" rel="stylesheet">
<style>:root{color-scheme:light}${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`
writeFileSync(`${out}/rotina-inteligente.html`, html)
console.log(`${out}/rotina-inteligente.html (${(html.length / 1024).toFixed(0)} kB)`)
