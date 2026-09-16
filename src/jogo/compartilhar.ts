import type { Pista } from './tipos'

const EMOJI: Record<Pista['veredito'], string> = {
  igual: '🟩',
  parcial: '🟨',
  diferente: '⬛',
}

export interface ResumoDaRodada {
  modo: string
  emojiDoModo: string
  numeroDoDesafio: number
  historico: Pista[][]
  /** Candidatas restantes a cada palpite: "702 → 41 → 6". */
  trilha: number[]
  dicasPedidas: number
  diaDificil: boolean
  venceu: boolean
  endereco: string
}

/**
 * Grade de emoji igual à do Wordle: conta a história da rodada sem entregar a
 * carta. Nos modos sem grade (efeito e arte) cada palpite vira um quadrado só,
 * senão a mensagem sai vazia.
 */
export function gradeDeEmojis(historico: Pista[][], venceu: boolean): string {
  return historico
    .map((pistas, indice) => {
      if (pistas.length > 0) return pistas.map((pista) => EMOJI[pista.veredito]).join('')
      const ultimo = indice === historico.length - 1
      return ultimo && venceu ? '🟩' : '⬛'
    })
    .join('\n')
}

/**
 * A linha do afunilamento ("702 → 41 → 6") entra na mensagem de propósito: ela
 * é o que o placar sozinho não conta. "4 palpites" é resultado; "cortei de 702
 * pra 6 no segundo chute" é história, e história é o que faz alguém responder
 * no grupo perguntando como.
 */
export function textoDeCompartilhamento(resumo: ResumoDaRodada): string {
  const placar = resumo.venceu ? `${resumo.historico.length}` : 'X'
  // "sem dica" entra no texto porque é a marca que dá vontade de mostrar — e é
  // ela que faz a pessoa recusar a ajuda na rodada seguinte.
  const marca =
    resumo.dicasPedidas === 0
      ? ' · sem dica'
      : ` · ${resumo.dicasPedidas} dica${resumo.dicasPedidas === 1 ? '' : 's'}`
  const linhas = [
    `Gomudle ${resumo.emojiDoModo} ${resumo.modo} #${resumo.numeroDoDesafio}${resumo.diaDificil ? ' (dia difícil)' : ''} — ${placar} palpite${placar === '1' ? '' : 's'}${marca}`,
  ]
  if (resumo.trilha.length > 1) linhas.push(resumo.trilha.join(' → '))
  linhas.push('', gradeDeEmojis(resumo.historico, resumo.venceu), '', resumo.endereco)
  return linhas.join('\n')
}

/**
 * `navigator.share` no celular, área de transferência no resto. Devolve o que
 * aconteceu pra tela dizer "copiado!" só quando copiou de verdade.
 */
export async function compartilhar(texto: string): Promise<'compartilhado' | 'copiado' | 'falhou'> {
  try {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      await navigator.share({ text: texto })
      return 'compartilhado'
    }
  } catch {
    // Cancelar o menu de compartilhar cai aqui. Tenta copiar antes de desistir.
  }
  try {
    await navigator.clipboard.writeText(texto)
    return 'copiado'
  } catch {
    return 'falhou'
  }
}
