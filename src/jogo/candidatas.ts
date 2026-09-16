import { compararCarta, type Coluna } from './comparar'
import { dicasDoModo } from './dicas'
import type { Carta } from './tipos'

/**
 * Quantas cartas do deck ainda cabem em TUDO que a pessoa já sabe: as pistas
 * da grade e as dicas que ela pediu.
 *
 * É o número que transforma a rodada em dedução visível. Sem ele, cada palpite
 * errado parece igual ao anterior; com ele, a pessoa vê 528 virar 24 virar 6 e
 * entende que está chegando perto. Também é o que dá preço à dica: pedir corta
 * o número na hora, e fica claro quanto do corte foi mérito e quanto foi ajuda.
 *
 * As duas fontes precisam entrar juntas — a versão anterior só olhava a grade
 * nos modos com coluna, então pedir dica ali não mexia no contador e a ajuda
 * parecia de graça.
 */
export interface Cerco {
  deck: Carta[]
  colunas: Coluna[]
  palpites: Carta[]
  resposta: Carta
  dicasPedidas: number
  idDoModo: string
}

function assinatura(colunas: Coluna[], palpite: Carta, alvo: Carta): string {
  return compararCarta(colunas, palpite, alvo)
    .map((pista) => `${pista.veredito}${pista.direcao ?? ''}`)
    .join('|')
}

export function candidatasRestantes(cerco: Cerco): Carta[] {
  const { deck, colunas, palpites, resposta, dicasPedidas, idDoModo } = cerco
  const pedidas = dicasDoModo(resposta, idDoModo).slice(0, dicasPedidas)

  return deck.filter((carta) => {
    if (palpites.some((palpite) => palpite.id === carta.id)) return false
    if (!pedidas.every((dica) => dica.combina(carta))) return false
    return palpites.every(
      (palpite) => assinatura(colunas, palpite, carta) === assinatura(colunas, palpite, resposta),
    )
  })
}

/** Histórico do afunilamento, um número por palpite — a história da rodada. */
export function trilhaDeCandidatas(cerco: Cerco): number[] {
  return cerco.palpites.map(
    (_, i) => candidatasRestantes({ ...cerco, palpites: cerco.palpites.slice(0, i + 1) }).length,
  )
}

/**
 * Cartas que produzem a linha inteira verde contra a resposta — as sósias.
 *
 * Com quatro colunas isso deixou de ser exceção: 18% do deck de personagem tem
 * pelo menos uma. Em vez de esconder, o jogo avisa que hoje é dia de sósia (ver
 * `diaDificil`): quem sabe disso antes de começar lê o ≠ como parte do jogo, e
 * não como bug.
 */
export function sosiasDe(deck: Carta[], colunas: Coluna[], resposta: Carta): Carta[] {
  if (colunas.length === 0) return []
  return deck.filter(
    (carta) =>
      carta.id !== resposta.id &&
      compararCarta(colunas, carta, resposta).every((pista) => pista.veredito === 'igual'),
  )
}

export const diaDificil = (deck: Carta[], colunas: Coluna[], resposta: Carta): boolean =>
  sosiasDe(deck, colunas, resposta).length > 0
