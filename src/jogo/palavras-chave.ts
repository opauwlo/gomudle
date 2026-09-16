import type { Carta } from './tipos'

export interface PalavraChave {
  /** Como a carta imprime, sem colchetes: 'Blocker', 'DON!! x1'. */
  chave: string
  /** O que ela faz, em português, pro title e pra legenda. */
  explicacao: string
}

/**
 * As palavras-chave viram a pista de abertura, desenhadas como a carta imprime
 * — selo laranja de habilidade, selo azul de tempo, octógono preto do DON!!.
 *
 * Por que palavra-chave e não cor, custo ou traço: esses já são coluna da
 * grade, e entregar coluna de graça encurtaria a rodada. Palavra-chave é o
 * único dado do jogo que nenhuma coluna compara — então a pista acrescenta um
 * eixo em vez de adiantar um que já existe.
 *
 * O texto aqui é só a EXPLICAÇÃO. O desenho do selo vem de `optcg-card-rules`,
 * que é o mesmo tratamento visual que as cartas usam.
 */
const EXPLICACAO: Record<string, string> = {
  Blocker: 'pode se meter na frente de um ataque',
  Rush: 'ataca no mesmo turno em que entra',
  'Double Attack': 'tira 2 de vida em vez de 1',
  Banish: 'o que ele derruba vai pro lixo, sem passar pela mão',
  Trigger: 'dispara ao sair das cartas de vida',
  Counter: 'usa na hora de defender',
  'On Play': 'acontece quando a carta entra em jogo',
  'On K.O.': 'acontece quando a carta é derrubada',
  'When Attacking': 'acontece quando ela ataca',
  'On Block': 'acontece quando ela bloqueia',
  "On Your Opponent's Attack": 'acontece quando o oponente ataca',
  'Activate: Main': 'você ativa na sua fase principal',
  Main: 'você ativa na fase principal',
  'Once Per Turn': 'só uma vez por turno',
  'Your Turn': 'vale durante o seu turno',
  "Opponent's Turn": 'vale durante o turno do oponente',
  'End of Your Turn': 'acontece no fim do seu turno',
  'DON!! x1': 'precisa de 1 DON!! anexado',
  'DON!! x2': 'precisa de 2 DON!! anexados',
}

/** Carta sem palavra-chave nenhuma. São 6 no jogo inteiro — é dica forte. */
export const SEM_PALAVRA_CHAVE =
  'Nenhuma palavra-chave: o efeito é texto corrido, ou a carta não tem efeito'

export function palavrasChaveDaCarta(carta: Carta): PalavraChave[] {
  return carta.palavrasChave.map((chave) => ({
    chave,
    // Palavra-chave nova que o dataset trouxer aparece com o selo certo e sem
    // explicação, em vez de sumir da tela.
    explicacao: EXPLICACAO[chave] ?? '',
  }))
}

export function legendaDePalavrasChave(): PalavraChave[] {
  return Object.entries(EXPLICACAO).map(([chave, explicacao]) => ({ chave, explicacao }))
}
