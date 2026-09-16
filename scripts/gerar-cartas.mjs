// Gera src/dados/cartas.json a partir do pacote `one-piece-card-game-json`.
//
// O resultado é COMMITADO no repositório de propósito: o jogo é estático e o
// build não pode depender de rede nem da versão do pacote instalada na hora.
// Quando sair coleção nova, rode `pnpm cartas` e commite o diff.
//
// Uso: node scripts/gerar-cartas.mjs [--verboso]

import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const verboso = process.argv.includes('--verboso')

const brutas = require('one-piece-card-game-json/en/cards.json')
const versaoPacote = JSON.parse(
  readFileSync(join(raiz, 'node_modules/one-piece-card-game-json/package.json'), 'utf8'),
).version

const COR = {
  Red: 'Vermelho',
  Blue: 'Azul',
  Green: 'Verde',
  Purple: 'Roxo',
  Yellow: 'Amarelo',
  Black: 'Preto',
}

const ATRIBUTO = {
  Slash: 'Corte',
  Strike: 'Golpe',
  Ranged: 'Distância',
  Special: 'Especial',
  Wisdom: 'Sabedoria',
}

// Só coleções numeradas. Promo solta (P-001, "Anime Expo 2023") fica de fora:
// são cartas que muita gente nunca viu, e um palpite impossível de deduzir
// estraga a rodada inteira.
const NUMERO_OFICIAL = /^(OP|ST|EB|PRB)(\d+)-(\d+)$/

// Raridade que entra no deck de personagens.
//
// C e UC ficam de fora: são enchimento de booster, arte genérica, ninguém
// lembra. R entra porque em OPTCG tem R que é staple de deck competitivo — o
// jogador reconhece.
//
// Medido antes de decidir (jogador de memória perfeita, 300 rodadas):
//
//   SR+SEC      311 cartas | média 3,18 | 4 cartas indistinguíveis (1%)
//   +R          702 cartas | média 3,43 | 13 (2%)
//   +R+UC     1.071 cartas | média 3,91 | 40 (4%)
//   tudo      1.940 cartas | média 4,16 | 98 (5%)
//
// O tamanho do deck quase não mexe na média — a grade afunila rápido de
// qualquer jeito. O que cresce é a ambiguidade (rodada que acaba com tudo
// verde e a carta errada) e a quantidade de cartas com o mesmo nome: 23
// "Monkey.D.Luffy" hoje, 45 se entrasse tudo.
const RARIDADE_PERSONAGEM = new Set(['SR', 'SEC', 'R'])

const numero = (valor) => {
  if (valor == null) return null
  const limpo = String(valor).trim()
  if (limpo === '' || limpo === '-' || limpo === '?') return null
  const n = Number.parseInt(limpo.replace(/[^\d-]/g, ''), 10)
  return Number.isNaN(n) ? null : n
}

const texto = (valor) =>
  String(valor ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const listaLimpa = (valor) =>
  (Array.isArray(valor) ? valor : [valor])
    .map((item) => texto(item))
    .filter((item) => item !== '' && item !== '-' && item !== '?')

// O nome da coleção sai do NÚMERO da carta, não do campo `card_sets`: coleção
// dupla (OP-15 + EB-04) traz as duas no mesmo campo de texto, e aí a carta
// OP15-098 apareceria como se fosse do EB-04.
function colecaoDe(cardNumber, cardSets) {
  const [, familia, serie] = cardNumber.match(NUMERO_OFICIAL)
  const codigo = `${familia}-${serie}`
  const apelido = texto(cardSets).replace(/\s*\[[^\]]*\]\s*/g, '').replace(/^-|-$/g, '').trim()
  return { codigo, nome: apelido || codigo }
}

const vistas = new Map()
for (const carta of brutas) {
  // Arte alternativa é a MESMA carta com outro desenho: mesmo custo, mesmo
  // poder, mesmo efeito. Duas linhas idênticas na grade seriam um palpite
  // queimado à toa.
  if (carta.is_alternate_art) continue
  if (!NUMERO_OFICIAL.test(carta.card_number)) continue
  if (!vistas.has(carta.card_number)) vistas.set(carta.card_number, carta)
}

const cartas = []
for (const carta of vistas.values()) {
  const ehLider = carta.card_type === 'LEADER'
  const ehPersonagem = carta.card_type === 'CHARACTER' && RARIDADE_PERSONAGEM.has(carta.rarity)
  if (!ehLider && !ehPersonagem) continue

  const cores = listaLimpa(carta.colors).map((c) => COR[c] ?? c)
  const atributos = listaLimpa(carta.attributes).map((a) => ATRIBUTO[a] ?? a)
  const poder = numero(carta.power)

  // Sem cor ou sem poder a linha da grade fica com buraco. Não vale a pena
  // tratar caso especial por uma carta torta do dataset: descarta.
  if (cores.length === 0 || poder == null) {
    if (verboso) console.warn('descartada (dado incompleto):', carta.card_number, carta.card_name)
    continue
  }

  cartas.push({
    id: carta.card_number,
    nome: texto(carta.card_name),
    tipo: ehLider ? 'lider' : 'personagem',
    cores,
    custo: ehLider ? null : numero(carta.cost),
    vida: ehLider ? numero(carta.life) : null,
    poder,
    contador: numero(carta.counter),
    atributos,
    tracos: listaLimpa(carta.types),
    // As palavras-chave entre colchetes ([Blocker], [Rush]…) viram a pista de
    // abertura em emoji. Vale a pena guardar separado do texto do efeito
    // porque é o único dado do jogo que nenhuma coluna da grade compara.
    palavrasChave: listaLimpa(carta.card_effects).map((chave) => chave.replace(/^\[|\]$/g, '')),
    raridade: carta.rarity,
    colecao: colecaoDe(carta.card_number, carta.card_sets),
    bloco: texto(carta.block_icon) === 'X' ? null : numero(carta.block_icon),
    efeito: texto(carta.effects) === '-' ? '' : texto(carta.effects),
    imagem: texto(carta.image_url),
  })
}

cartas.sort((a, b) => a.id.localeCompare(b.id))

const destino = join(raiz, 'src/dados/cartas.json')
const fonte = `one-piece-card-game-json@${versaoPacote}`

// `geradoEm` é a data em que o DADO mudou, não a data em que alguém rodou o
// script. Carimbar hoje sempre faria o arquivo mudar a cada execução — e o CI,
// que confere se regerar dá o mesmo resultado, quebraria todo dia sem motivo.
let geradoEm = new Date().toISOString().slice(0, 10)
try {
  const anterior = JSON.parse(readFileSync(destino, 'utf8'))
  const igual =
    anterior.fonte === fonte && JSON.stringify(anterior.cartas) === JSON.stringify(cartas)
  if (igual) geradoEm = anterior.geradoEm
} catch {
  /* primeira geração: não existe arquivo anterior */
}

writeFileSync(destino, `${JSON.stringify({
  _aviso: 'Arquivo gerado por scripts/gerar-cartas.mjs. Não edite à mão.',
  fonte,
  geradoEm,
  cartas,
}, null, 1)}\n`)

const lideres = cartas.filter((c) => c.tipo === 'lider').length
console.log(`cartas.json: ${cartas.length} cartas (${lideres} líderes, ${cartas.length - lideres} personagens)`)
console.log(`fonte: one-piece-card-game-json@${versaoPacote}`)
