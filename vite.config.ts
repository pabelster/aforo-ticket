import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** GitHub Pages project site: https://pabelster.github.io/aforo-ticket/ */
const pagesBase = '/aforo-ticket/'

function githubPagesSpaFallback(): Plugin {
  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    closeBundle() {
      const indexPath = resolve('dist/index.html')
      if (!existsSync(indexPath)) return
      copyFileSync(indexPath, resolve('dist/404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Production assets are served from /aforo-ticket/. The dev server stays at /
  // so existing local URLs (including the phone scanner) keep working.
  base: command === 'build' ? pagesBase : '/',
  plugins: [react(), basicSsl(), githubPagesSpaFallback()],
  server: {
    host: true,
    port: 5173,
  },
}))

