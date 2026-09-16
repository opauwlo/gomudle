import type { Carta } from './tipos'

/**
 * PRNG determinístico (mulberry32). Precisa ser determinístico e não depender
 * de servidor: o desafio do dia é calculado no navegador de cada pessoa e
 * todas têm que cair na mesma carta.
 */
function geradorComSemente(semente: number): () => number {
  let estado = semente >>> 0
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

function semente(texto: string): number {
  let h = 2_166_136_261
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 16_777_619)
  }
  return h >>> 0
}

function ordemEmbaralhada(tamanho: number, chave: string): number[] {
  const sorteia = geradorComSemente(semente(chave))
  const ordem = Array.from({ length: tamanho }, (_, i) => i)
  for (let i = tamanho - 1; i > 0; i--) {
    const j = Math.floor(sorteia() * (i + 1))
    const trocado = ordem[i] as number
    ordem[i] = ordem[j] as number
    ordem[j] = trocado
  }
  return ordem
}

/**
 * A carta de um dia, por modo.
 *
 * Não é `deck[aleatorio()]`: o dia percorre uma PERMUTAÇÃO do deck inteiro,
 * então nenhuma carta repete antes de todas terem saído (449 cartas = mais de
 * um ano de personagem sem repetir). A cada ciclo a permutação muda de semente,
 * senão o segundo ano teria exatamente a ordem do primeiro.
 *
 * Efeito colateral aceito: quando entra coleção nova no dataset, o deck cresce
 * e a permutação se reordena — o desafio de ontem, recalculado, dá outra carta.
 * Isso só afeta quem tenta reproduzir o passado; o progresso de quem jogou fica
 * salvo com o resultado, não recalculado.
 */
export function cartaDoDia(deck: Carta[], modo: string, numeroDoDesafio: number): Carta {
  if (deck.length === 0) throw new Error(`deck vazio no modo ${modo}`)
  const passo = Math.max(0, numeroDoDesafio - 1)
  const ciclo = Math.floor(passo / deck.length)
  const posicao = passo % deck.length
  const ordem = ordemEmbaralhada(deck.length, `${modo}:${ciclo}`)
  return deck[ordem[posicao] as number] as Carta
}

/** Carta aleatória de verdade, pro modo treino. */
export function cartaAleatoria(deck: Carta[]): Carta {
  return deck[Math.floor(Math.random() * deck.length)] as Carta
}
