import dados from '../dados/cartas.json'
import type { Carta } from './tipos'

// O JSON é gerado por scripts/gerar-cartas.mjs e vem sem tipo. O cast é o
// único ponto do app que confia no gerador — daqui pra frente é tudo Carta.
export const TODAS_AS_CARTAS = dados.cartas as Carta[]
export const FONTE_DOS_DADOS = dados.fonte
export const DADOS_GERADOS_EM = dados.geradoEm

/**
 * O bloco de cada coleção — a única escala ORDENADA e oficial que atravessa as
 * quatro famílias do jogo.
 *
 * O código da coleção não serve de ordem: OP, ST, EB e PRB são numeradas cada
 * uma por conta própria, então OP-15 e EB-04 são a mesma época e ST-30 é mais
 * nova que OP-09. O bloco (1 a 5) é o agrupamento que a Bandai usa pra
 * rotação, e ele acompanha a ordem de lançamento.
 *
 * Sai das cartas em vez de lista escrita à mão pra coleção nova entrar sozinha
 * quando o dataset crescer. É o bloco MAIS COMUM da coleção porque algumas
 * cartas vêm com ícone X (bloco nulo) no meio de uma coleção que tem bloco —
 * OP-16 e OP-17 têm oito delas.
 */
const BLOCO_POR_COLECAO = (() => {
  const contagem = new Map<string, Map<number, number>>()
  for (const carta of TODAS_AS_CARTAS) {
    if (carta.bloco == null) continue
    const porBloco = contagem.get(carta.colecao.codigo) ?? new Map<number, number>()
    porBloco.set(carta.bloco, (porBloco.get(carta.bloco) ?? 0) + 1)
    contagem.set(carta.colecao.codigo, porBloco)
  }

  const mapa = new Map<string, number>()
  for (const [codigo, porBloco] of contagem) {
    let escolhido: number | null = null
    let maisVisto = 0
    for (const [bloco, vezes] of porBloco) {
      // Empate desempata pelo bloco menor, pra dois datasets iguais darem
      // sempre a mesma ordem.
      if (vezes > maisVisto || (vezes === maisVisto && escolhido != null && bloco < escolhido)) {
        escolhido = bloco
        maisVisto = vezes
      }
    }
    if (escolhido != null) mapa.set(codigo, escolhido)
  }
  return mapa
})()

/** `null` na coleção que não tem bloco nenhum: aí não há seta pra mostrar. */
export function blocoDaColecao(codigo: string): number | null {
  return BLOCO_POR_COLECAO.get(codigo) ?? null
}

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
