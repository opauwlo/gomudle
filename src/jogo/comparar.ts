import type { Carta, Pista, Veredito } from './tipos'

export type EstiloDeColuna = 'conjunto' | 'numero' | 'texto'

export interface Coluna {
  chave: string
  rotulo: string
  estilo: EstiloDeColuna
  /** Legenda curta que aparece no cabeçalho em tela pequena. */
  abreviado?: string
  conjunto?: (carta: Carta) => string[]
  numero?: (carta: Carta) => number | null
  texto?: (carta: Carta) => string
  /** Diferença que ainda conta como "quase" (amarelo). */
  tolerancia?: number
  formatar?: (valor: number | null) => string
}

const mesmoConteudo = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().every((item, i) => item === ([...b].sort()[i] as string))

export function compararConjunto(palpite: string[], resposta: string[]): Veredito {
  if (mesmoConteudo(palpite, resposta)) return 'igual'
  return palpite.some((item) => resposta.includes(item)) ? 'parcial' : 'diferente'
}

export function compararNumero(
  palpite: number | null,
  resposta: number | null,
  tolerancia = 0,
): { veredito: Veredito; direcao?: 'maior' | 'menor' } {
  // "—" contra "—" é acerto (duas cartas sem contador, por exemplo). "—" contra
  // número não tem seta: não dá pra dizer "é maior" quando um dos lados nem
  // existe na carta.
  if (palpite == null || resposta == null) {
    return { veredito: palpite === resposta ? 'igual' : 'diferente' }
  }
  if (palpite === resposta) return { veredito: 'igual' }
  const direcao = resposta > palpite ? 'maior' : 'menor'
  const perto = tolerancia > 0 && Math.abs(resposta - palpite) <= tolerancia
  return { veredito: perto ? 'parcial' : 'diferente', direcao }
}

export const formatarMilhar = (valor: number | null): string =>
  valor == null ? '—' : valor.toLocaleString('pt-BR')

/**
 * 5000 vira "5k". Cabe numa célula estreita e é como se fala na mesa — ninguém
 * diz "cinco mil de poder", diz "cinco ká".
 */
export const formatarPoder = (valor: number | null): string =>
  valor == null ? '—' : `${valor / 1000}k`

const formatarSimples = (valor: number | null): string => (valor == null ? '—' : String(valor))

export function compararCarta(colunas: Coluna[], palpite: Carta, resposta: Carta): Pista[] {
  return colunas.map((coluna) => {
    if (coluna.estilo === 'conjunto') {
      const doPalpite = coluna.conjunto?.(palpite) ?? []
      const daResposta = coluna.conjunto?.(resposta) ?? []
      return {
        chave: coluna.chave,
        rotulo: coluna.rotulo,
        valor: doPalpite.length > 0 ? doPalpite.join(' · ') : '—',
        veredito: compararConjunto(doPalpite, daResposta),
      }
    }

    if (coluna.estilo === 'numero') {
      const doPalpite = coluna.numero?.(palpite) ?? null
      const daResposta = coluna.numero?.(resposta) ?? null
      const { veredito, direcao } = compararNumero(doPalpite, daResposta, coluna.tolerancia)
      const formatar = coluna.formatar ?? formatarSimples
      return {
        chave: coluna.chave,
        rotulo: coluna.rotulo,
        valor: formatar(doPalpite),
        veredito,
        ...(direcao ? { direcao } : {}),
      }
    }

    const doPalpite = coluna.texto?.(palpite) ?? ''
    const daResposta = coluna.texto?.(resposta) ?? ''
    return {
      chave: coluna.chave,
      rotulo: coluna.rotulo,
      valor: doPalpite === '' ? '—' : doPalpite,
      veredito: doPalpite === daResposta ? 'igual' : 'diferente',
    }
  })
}

export const acertou = (pistas: Pista[]): boolean =>
  pistas.length > 0 && pistas.every((pista) => pista.veredito === 'igual')
