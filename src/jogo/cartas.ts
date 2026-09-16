import dados from '../dados/cartas.json'
import type { Carta } from './tipos'

// O JSON é gerado por scripts/gerar-cartas.mjs e vem sem tipo. O cast é o
// único ponto do app que confia no gerador — daqui pra frente é tudo Carta.
export const TODAS_AS_CARTAS = dados.cartas as Carta[]
export const FONTE_DOS_DADOS = dados.fonte
export const DADOS_GERADOS_EM = dados.geradoEm

/**
 * Tira acento, pontuação e caixa. Existe porque o dataset escreve o mesmo
 * personagem de duas formas — "Monkey.D.Luffy" e "Monkey D. Luffy" — e ninguém
 * vai digitar o ponto no lugar certo pra achar a carta.
 */
export function chaveDeBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

interface CartaIndexada {
  carta: Carta
  chaveNome: string
  chaveId: string
}

const indice = new WeakMap<Carta[], CartaIndexada[]>()

function indexar(deck: Carta[]): CartaIndexada[] {
  let pronto = indice.get(deck)
  if (!pronto) {
    pronto = deck.map((carta) => ({
      carta,
      chaveNome: chaveDeBusca(carta.nome),
      chaveId: chaveDeBusca(carta.id),
    }))
    indice.set(deck, pronto)
  }
  return pronto
}

/**
 * Pontua um termo contra uma carta. Menor é melhor; `null` é não casou.
 *
 * Código exato ganha de tudo: quem digita "OP02-036" inteiro sabe exatamente o
 * que quer e não pode ver esse resultado em quarto lugar.
 */
function pontuar(item: CartaIndexada, termo: string): number | null {
  if (item.chaveId === termo) return 0
  if (item.chaveNome.startsWith(termo) || item.chaveId.startsWith(termo)) return 1
  if (item.chaveNome.includes(termo) || item.chaveId.includes(termo)) return 2
  return null
}

/**
 * Busca por nome, por código, ou pelos dois misturados.
 *
 * O texto é quebrado em termos e CADA termo precisa casar com o nome ou com o
 * código — é isso que faz "op06-064 nami" funcionar, que é como a pessoa fala
 * da carta em voz alta. Sem isso, a busca procuraria a string inteira e não
 * acharia nada.
 *
 * Empate desempata pelo tamanho do nome: quem procura "nami" quer "Nami" antes
 * de "Nami & Zeus".
 *
 * Devolve TODAS as que casaram, sem corte. A lista cortava em 12 e avisava "e
 * mais 40" — só que quem digita "luffy" quer ver os Luffy, e mandar a pessoa
 * adivinhar um código pra afinar é pedir o que ela não sabe. A lista rola.
 */
export function buscarCartas(deck: Carta[], texto: string): Carta[] {
  const termos = texto.split(/\s+/).map(chaveDeBusca).filter((termo) => termo !== '')
  if (termos.length === 0) return []

  const achados: { item: CartaIndexada; pontos: number }[] = []
  for (const item of indexar(deck)) {
    let pontos = 0
    let casou = true
    for (const termo of termos) {
      const nota = pontuar(item, termo)
      if (nota == null) {
        casou = false
        break
      }
      pontos += nota
    }
    if (casou) achados.push({ item, pontos })
  }

  achados.sort(
    (a, b) =>
      a.pontos - b.pontos ||
      a.item.carta.nome.length - b.item.carta.nome.length ||
      a.item.carta.id.localeCompare(b.item.carta.id),
  )

  return achados.map((achado) => achado.item.carta)
}

export function acharPorId(deck: Carta[], id: string): Carta | undefined {
  return deck.find((carta) => carta.id === id)
}
