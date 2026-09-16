import { TODAS_AS_CARTAS } from './cartas'
import { formatarPoder, type Coluna } from './comparar'
import type { Formato } from './formatos'
import type { Carta, IdDeModo } from './tipos'

export interface Modo {
  id: IdDeModo
  nome: string
  /**
   * Só pro texto de compartilhamento. Na tela o modo é só o nome, sem desenho
   * nenhum — mas mensagem de WhatsApp é texto puro, e ali emoji é o único
   * desenho que existe.
   */
  emojiDeCompartilhamento: string
  /** Frase curta do cabeçalho, abaixo do nome do modo. */
  chamada: string
  comoJoga: string
  /** Frase curta pra quando a busca não achar nada: "personagens R, SR e SEC". */
  descricaoDoDeck: string
  /** Deck cheio. Quem joga usa `deckDoModo`, que aplica o formato. */
  deck: Carta[]
  /** Vazio nos modos que não mostram grade de comparação. */
  colunas: Coluna[]
}

const COR: Coluna = {
  chave: 'cor',
  rotulo: 'Cor',
  estilo: 'conjunto',
  conjunto: (c) => c.cores,
}

const PODER: Coluna = {
  chave: 'poder',
  rotulo: 'Poder',
  estilo: 'numero',
  numero: (c) => c.poder,
  // Poder anda de 1000 em 1000 no jogo de verdade, então "quase" é um degrau.
  tolerancia: 1000,
  formatar: formatarPoder,
}

// Não existe coluna de bloco, e a ausência é medida, não esquecimento.
//
// O bloco (1 a 5, acompanhando a ordem das coleções) era a coluna mais
// informativa do jogo — e por isso a que estragava. Com ela, um palpite
// derrubava o deck de 311 cartas pra 8, e 90% das rodadas acabavam em três
// palpites. Sem ela, sobram 21 e a média sai de 2,6 pra 3,1 (no líder, de 2,9
// pra 3,6).
//
// Tirar a coleção junto seria demais: 22 cartas ficariam indistinguíveis entre
// si, e 7% das rodadas terminariam com a grade toda verde e a carta errada.
// Bloco fora, coleção dentro.

const COLECAO: Coluna = {
  chave: 'colecao',
  rotulo: 'Coleção',
  abreviado: 'Col.',
  estilo: 'texto',
  texto: (c) => c.colecao.codigo,
}

const personagens = TODAS_AS_CARTAS.filter((c) => c.tipo === 'personagem')
const lideres = TODAS_AS_CARTAS.filter((c) => c.tipo === 'lider')

// Efeito curto demais ("[Blocker]") não é enigma, é sorteio. 40 caracteres é o
// ponto em que sobra texto pra deduzir alguma coisa.
const comEfeito = TODAS_AS_CARTAS.filter((c) => c.efeito.length >= 40)
const comArte = TODAS_AS_CARTAS.filter((c) => c.imagem !== '')

export const MODOS: Modo[] = [
  {
    id: 'personagem',
    nome: 'Personagem',
    emojiDeCompartilhamento: '🃏',
    chamada: 'Qual é o personagem de hoje?',
    comoJoga:
      'Chuta qualquer personagem R, SR ou SEC. Cada palpite compara quatro características com a carta do dia — e o contador mostra quantas ainda cabem.',
    descricaoDoDeck: 'personagens R, SR e SEC',
    deck: personagens,
    colunas: [
      COR,
      {
        chave: 'custo',
        rotulo: 'Custo',
        estilo: 'numero',
        numero: (c) => c.custo,
        tolerancia: 1,
      },
      PODER,
      COLECAO,
    ],
  },
  {
    id: 'lider',
    nome: 'Líder',
    emojiDeCompartilhamento: '👑',
    chamada: 'Qual líder tá na mesa hoje?',
    comoJoga:
      'Só líder entra aqui, de OP-01 até a coleção mais nova. No lugar do custo, a vida.',
    descricaoDoDeck: 'líderes',
    deck: lideres,
    colunas: [
      COR,
      { chave: 'vida', rotulo: 'Vida', estilo: 'numero', numero: (c) => c.vida, tolerancia: 1 },
      PODER,
      COLECAO,
    ],
  },
  {
    id: 'efeito',
    nome: 'Efeito',
    emojiDeCompartilhamento: '📜',
    chamada: 'Leia o efeito e diz que carta é',
    comoJoga:
      'É o efeito da carta do dia, com o nome dela apagado. Cada erro libera uma dica nova — e vai afunilando.',
    descricaoDoDeck: 'cartas com efeito',
    deck: comEfeito,
    colunas: [],
  },
  {
    id: 'arte',
    nome: 'Arte',
    emojiDeCompartilhamento: '🖼️',
    chamada: 'Só um pedaço da arte. Que carta é?',
    comoJoga:
      'Começa num pedaço da arte, fora de foco. Cada erro afasta a câmera e solta uma dica.',
    descricaoDoDeck: 'líderes e personagens',
    deck: comArte,
    colunas: [],
  },
]

export const MODO_PADRAO: IdDeModo = 'personagem'

export function acharModo(id: string): Modo {
  return MODOS.find((modo) => modo.id === id) ?? (MODOS[0] as Modo)
}

// Filtrar 840 cartas a cada tecla digitada na busca seria desperdício, e o
// resultado nunca muda: mesmo modo, mesmo formato, mesmo deck.
const deckCache = new Map<string, Carta[]>()

/** O deck do modo depois de passar pelo filtro do formato. */
export function deckDoModo(modo: Modo, formato: Formato): Carta[] {
  const chave = `${modo.id}:${formato.id}`
  let deck = deckCache.get(chave)
  if (!deck) {
    deck = modo.deck.filter((carta) => formato.aceita(carta))
    deckCache.set(chave, deck)
  }
  return deck
}
