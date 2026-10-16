import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH permite publicar em subpasta (ex.: GitHub Pages em /rotina/).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
