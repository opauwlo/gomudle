/**
 * Os quatro tipos de carta do jogo. Evento e stage entraram junto com líder no
 * deck único — o tipo virou parte do enigma, não a divisão dos modos.
 */
export type TipoDeCarta = 'lider' | 'personagem' | 'evento' | 'stage'

export interface Colecao {
  codigo: string
  nome: string
}

export interface Carta {
  id: string
  nome: string
  tipo: TipoDeCarta
  cores: string[]
  /** Líder não tem custo — tem vida. Os outros três têm custo. */
  custo: number | null
  /** Só líder tem vida. */
  vida: number | null
  /**
   * `null` em evento e stage: essas cartas não têm poder, e o "—" na grade é
   * informação, não dado faltando. Líder e personagem sempre têm.
   */
  poder: number | null
  contador: number | null
  atributos: string[]
  tracos: string[]
  /** [Blocker], [Rush]… sem os colchetes. Vira a pista de abertura. */
  palavrasChave: string[]
  raridade: string
  colecao: Colecao
  /** `null` quando a carta não entra em bloco nenhum (ícone X). */
  bloco: number | null
  efeito: string
  imagem: string
}

export type Veredito = 'igual' | 'parcial' | 'diferente'
export type Direcao = 'maior' | 'menor'

export interface Pista {
  chave: string
  rotulo: string
  /** Já formatado pra tela: '2.000', '—', 'Vermelho / Verde'. */
  valor: string
  veredito: Veredito
  /** Pra onde a resposta está em relação ao palpite. Só em coluna numérica. */
  direcao?: Direcao
}

/**
 * `personagem` é o nome guardado do modo do deck único, e ele fica.
 * A chave do sorteio e do progresso é `modo:formato` (decisão 13 do NOTAS):
 * renomear zeraria a sequência e a estatística de todo mundo. Na tela ele se
 * chama "Carta" — o id é identidade de dado, não rótulo.
 */
export type IdDeModo = 'personagem' | 'efeito' | 'arte'
