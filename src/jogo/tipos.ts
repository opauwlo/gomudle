export type TipoDeCarta = 'lider' | 'personagem'

export interface Colecao {
  codigo: string
  nome: string
}

export interface Carta {
  id: string
  nome: string
  tipo: TipoDeCarta
  cores: string[]
  /** Líder não tem custo. Personagem sempre tem. */
  custo: number | null
  /** Só líder tem vida. */
  vida: number | null
  poder: number
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
  /**
   * Pra onde a resposta está em relação ao palpite. Sai em coluna numérica e
   * na de texto que tenha escala (a coleção, ordenada por bloco).
   */
  direcao?: Direcao
}

export type IdDeModo = 'personagem' | 'lider' | 'efeito' | 'arte'
