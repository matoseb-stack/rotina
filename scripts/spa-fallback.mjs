// Copia index.html para 404.html: hospedagens estáticas (GitHub Pages, etc.)
// servem o app mesmo ao recarregar /rotina ou /progresso.
import { copyFileSync } from 'node:fs'
copyFileSync('dist/index.html', 'dist/404.html')
