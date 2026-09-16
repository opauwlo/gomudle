import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// ARQUIVO_UNICO=1 junta tudo num index.html só. Serve pra mandar o jogo por
// anexo ou publicar em lugar que não serve pasta de assets — o jogo é todo
// client-side, então isso funciona de verdade, não é curiosidade.
const arquivoUnico = process.env.ARQUIVO_UNICO === '1'

// `base` sai do ambiente porque o mesmo build vai pra dois lugares: a raiz de
// um domínio próprio e o subcaminho /gomudle/ do GitHub Pages. Sem isso, o
// Pages serve a página mas os assets dão 404.
export default defineConfig({
  base: process.env.BASE_PUBLICA ?? '/',
  plugins: [react(), tailwindcss(), ...(arquivoUnico ? [viteSingleFile()] : [])],
  build: {
    outDir: arquivoUnico ? 'dist-unico' : 'dist',
    assetsInlineLimit: 4096,
    // O dataset de cartas sozinho passa de 200 kB; o aviso padrão de 500 kB só
    // faria barulho em todo build.
    chunkSizeWarningLimit: 900,
  },
})
