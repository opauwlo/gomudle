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
  /**
   * A lista de sugestões mostra a arte da carta?
   *
   * No modo efeito, não: ali o enigma é texto, e a fileira de artes na lista
   * transforma escolher a carta em reconhecer o desenho — que é o outro modo.
   */
  arteNaBusca: boolean
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
//
// A coluna é BINÁRIA de propósito: bate ou não bate, sem seta. Ordenar
// coleção puxaria o bloco de volta pra dentro do jogo por uma fresta — e o
// bloco é justamente o que fazia o deck desabar num palpite só.

/**
 * Custo e vida na MESMA coluna, com rótulo neutro.
 *
 * É a decisão 5 do NOTAS aplicada à grade: "Custo" fechado entregaria que a
 * carta é personagem, evento ou stage, e "Vida", que é líder. Juntando os
 * dois, um 4 na coluna pode ser custo 4 ou vida 4 — e descobrir qual é faz
 * parte do enigma, agora que a categoria não é mais a divisão dos modos.
 */
const VALOR: Coluna = {
  chave: 'valor',
  rotulo: 'Custo ou vida',
  // O cabeçalho tem uns 55px no celular: "CUSTO OU VIDA" não cabe. O nome
  // inteiro está no `title` de cada pastilha e no texto do leitor de tela.
  abreviado: 'C/V',
  estilo: 'numero',
  numero: (c) => (c.categoria === 'lider' ? c.vida : c.custo),
  tolerancia: 1,
}

/**
 * O tipo da carta é a coluna que RECOMPENSA saber de One Piece.
 *
 * É o `Type` impresso no rodapé da carta — e não a CATEGORIA (líder,
 * personagem, evento, stage), que é outra coisa e não é coluna.
 *
 * "Straw Hat Crew", "Navy", "Supernovas" — 106 tipos distintos, e todas as
 * 1.111 cartas têm pelo menos um. Quem conhece a obra deduz; quem não conhece
 * aprende jogando. É o contrário do bloco, que é metadado de lançamento: saber
 * bloco é consulta, não dedução, e por isso ele ficou de fora (ver a 11).
 *
 * Medido no deck unificado, ela é a diferença entre um jogo longo e um jogo
 * difícil: sem ela a média é 6,03 palpites com 20% de cartas ambíguas; com
 * ela, 4,38 e 6%.
 */
const TIPOS: Coluna = {
  chave: 'tipos',
  rotulo: 'Tipos',
  estilo: 'conjunto',
  conjunto: (c) => c.tipos,
}

const COLECAO: Coluna = {
  chave: 'colecao',
  rotulo: 'Coleção',
  abreviado: 'Col.',
  estilo: 'texto',
  texto: (c) => c.colecao.codigo,
}


// Efeito curto demais ("[Blocker]") não é enigma, é sorteio. 40 caracteres é o
// ponto em que sobra texto pra deduzir alguma coisa.
const comEfeito = TODAS_AS_CARTAS.filter((c) => c.efeito.length >= 40)
const comArte = TODAS_AS_CARTAS.filter((c) => c.imagem !== '')

export const MODOS: Modo[] = [
  {
    // O id continua 'personagem' de propósito, e a tela chama de "Carta": a
    // chave do sorteio e do progresso é `modo:formato` (decisão 13 do NOTAS),
    // e renomear zeraria a sequência e a estatística de quem já joga.
    id: 'personagem',
    nome: 'Carta',
    emojiDeCompartilhamento: '🃏',
    chamada: 'Qual é a carta de hoje?',
    comoJoga:
      'Entra tudo: líder, personagem, evento e stage. Qual das quatro categorias é faz parte do enigma — evento e stage não têm poder, então um "—" ali já diz alguma coisa. Cada palpite compara cinco características, e o contador mostra quantas cartas ainda cabem.',
    descricaoDoDeck: 'líderes, personagens R/SR/SEC, eventos e stages',
    deck: TODAS_AS_CARTAS,
    colunas: [COR, VALOR, PODER, TIPOS, COLECAO],
    arteNaBusca: true,
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
    arteNaBusca: false,
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
    arteNaBusca: true,
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
