import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './estilos.css'

createRoot(document.getElementById('raiz') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
 * O cache local da arte (ver `public/sw.js`).
 *
 * Fora do site publicado, não: em `pnpm dev` um service worker no meio do
 * caminho só atrapalha o recarregamento, e no build de arquivo único ele seria
 * um segundo arquivo, que é justamente o que aquele build não quer.
 *
 * Registra depois do `load` pra não disputar rede com a primeira tela, e falha
 * calado: sem cache o jogo funciona igual. É melhoria, não dependência.
 */
if (!__ARQUIVO_UNICO__ && import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
