/*
 * Cache local da arte das cartas.
 *
 * A arte de uma carta nunca muda: o endereço carrega o código da carta, a
 * largura e a qualidade, então cada endereço é um arquivo imutável. Isso é o
 * caso perfeito pra cache-primeiro — pedir de novo ao CDN uma imagem que já
 * está no disco é gastar rede pra receber o mesmo byte.
 *
 * O que ganha: quem volta no dia seguinte, quem troca de modo e volta, e quem
 * digita "luffy" pela segunda vez não baixa nada. E, com a arte já guardada, a
 * rodada continua jogável sem rede.
 *
 * **Este service worker NÃO toca no app.** HTML, JavaScript e CSS passam
 * direto, sem cache, sem interceptação. É de propósito: service worker
 * servindo app shell guardado é o jeito clássico de deixar alguém presa numa
 * versão antiga do site sem entender por quê, e um cache de imagem não vale
 * esse preço. Aqui ele só conhece as três fontes de arte.
 */

// Trocar o nome invalida tudo de uma vez — é a saída se um dia entrar coisa
// errada aqui. O `activate` apaga as versões anteriores.
const CACHE = 'arte-v1'

/** As três fontes de `src/jogo/imagens.ts`, e nada além delas. */
const FONTES = new Set(['wsrv.nl', 'cdn.statically.io', 'en.onepiece-cardgame.com'])

/**
 * Teto de imagens guardadas. O jogo tem 937 cartas em três tamanhos, e guardar
 * tudo seria pedir meio giga de disco de quem só quis jogar. 400 cobre com
 * folga uma pessoa que joga todo dia: a arte do dia, a lista de busca que ela
 * usa e o que ela já viu na semana.
 */
const TETO = 400

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      for (const nome of await caches.keys()) {
        if (nome.startsWith('arte-') && nome !== CACHE) await caches.delete(nome)
      }
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request
  if (pedido.method !== 'GET') return

  let endereco
  try {
    endereco = new URL(pedido.url)
  } catch {
    return
  }
  if (!FONTES.has(endereco.hostname)) return

  evento.respondWith(servir(evento))
})

async function servir(evento) {
  const pedido = evento.request
  const cache = await caches.open(CACHE)

  const guardada = await cache.match(pedido)
  if (guardada) return guardada

  const resposta = await fetch(pedido)

  // A imagem vem de outra origem e o `<img>` pede sem CORS, então a resposta
  // chega OPACA: o navegador desenha, mas não deixa ler o status daqui. Ou
  // seja, não dá pra distinguir a arte que veio da que voltou 404.
  //
  // Guardar mesmo assim é escolha, e o risco é limitado: uma imagem quebrada
  // no cache faz a `<img>` falhar, o jogo conta a falha e depois de três
  // cartas troca de fonte (ver `seletorDeFonte`) — e a fonte nova tem outro
  // endereço, ou seja, outra chave de cache. O pior caso é uma carta servida
  // pelo CDN reserva, não o jogo sem arte.
  if (resposta.status === 200 || resposta.type === 'opaque') {
    evento.waitUntil(guardar(cache, pedido, resposta.clone()))
  }

  return resposta
}

async function guardar(cache, pedido, resposta) {
  await cache.put(pedido, resposta)

  // Sai a mais velha primeiro. `cache.keys()` devolve na ordem de inserção,
  // então a fila já vem pronta — não precisa guardar data de acesso à parte.
  const chaves = await cache.keys()
  for (let i = 0; i < chaves.length - TETO; i++) {
    await cache.delete(chaves[i])
  }
}
