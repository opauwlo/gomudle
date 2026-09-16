export interface EstadoDaRodada {
  /** Ids chutados, na ordem. */
  palpites: string[]
  desistiu: boolean
  /** Quantas dicas a pessoa pediu. Zero é a marca que vale. */
  dicasPedidas: number
}

/**
 * Venceu é ter chutado a carta certa — desistir não conta.
 *
 * Isso já foi escrito do jeito errado uma vez: desistir gravava a resposta no
 * fim da lista de palpites (pra tela ter o que mostrar) e a rodada aparecia
 * como vitória no dia seguinte. Quem desiste não chuta; a flag é separada.
 */
export const venceuRodada = (estado: EstadoDaRodada, idDaResposta: string): boolean =>
  !estado.desistiu && estado.palpites.includes(idDaResposta)

export const encerrouRodada = (estado: EstadoDaRodada, idDaResposta: string): boolean =>
  estado.desistiu || estado.palpites.includes(idDaResposta)

export function aplicarPalpite(estado: EstadoDaRodada, id: string, idDaResposta: string): EstadoDaRodada {
  if (encerrouRodada(estado, idDaResposta)) return estado
  if (estado.palpites.includes(id)) return estado
  return { ...estado, palpites: [...estado.palpites, id] }
}

/** Pede a próxima dica. Não dá pra devolver — é isso que faz a escolha pesar. */
export function pedirDica(estado: EstadoDaRodada, disponiveis: number): EstadoDaRodada {
  if (estado.dicasPedidas >= disponiveis) return estado
  return { ...estado, dicasPedidas: estado.dicasPedidas + 1 }
}

export const usouDica = (estado: EstadoDaRodada): boolean => estado.dicasPedidas > 0
