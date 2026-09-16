import type { Carta } from './tipos'

export type IdDeFormato = 'standard' | 'egb'

export interface Formato {
  id: IdDeFormato
  nome: string
  /** Uma linha, pro seletor e pro "como jogar". */
  resumo: string
  aceita: (carta: Carta) => boolean
}

/**
 * Bloco mais antigo que ainda vale no Standard.
 *
 * A rotação anda UM bloco todo 1º de abril, e a janela é de quatro blocos. Em
 * abril de 2026 o bloco 1 (OP-01 a OP-04 e os decks ST-01 a ST-10) saiu, então
 * hoje vale de 2 a 5. **Isto é um número escrito à mão de propósito**: derivar
 * da data chutaria o futuro, e no dia em que a Bandai mudar a regra o jogo
 * estaria mentindo com cara de certeza. Em abril de 2027, vire pra 3.
 */
export const BLOCO_MAIS_ANTIGO_NO_STANDARD = 2

export const FORMATOS: Formato[] = [
  {
    id: 'standard',
    nome: 'Standard',
    resumo: 'só o que está na rotação — bloco 2 em diante, como nos torneios de loja',
    // Bloco X é carta à prova de rotação: vale no Standard mesmo sem bloco
    // numerado. No nosso deck são 8 cartas.
    aceita: (carta) => carta.bloco == null || carta.bloco >= BLOCO_MAIS_ANTIGO_NO_STANDARD,
  },
  {
    id: 'egb',
    nome: 'EGB',
    resumo: 'Extra Grand Battle: vale tudo, de OP-01 até a coleção mais nova',
    aceita: () => true,
  },
]

export const FORMATO_PADRAO: IdDeFormato = 'standard'

export function acharFormato(id: string): Formato {
  return FORMATOS.find((formato) => formato.id === id) ?? (FORMATOS[0] as Formato)
}
