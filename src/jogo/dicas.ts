import type { Carta } from './tipos'

export interface Dica {
  rotulo: string
  valor: string
  /** Palavras-chave viram selo desenhado; o resto é texto. */
  estilo?: 'selos'
  /**
   * Se uma carta ainda cabe depois desta dica. É o que permite contar quantas
   * candidatas sobraram — sem isso, a dica seria só texto na tela e a pessoa
   * não veria o cerco fechar.
   */
  combina: (outra: Carta) => boolean
}

/**
 * As dicas da carta, na ordem em que podem ser pedidas — do mais genérico
 * (cor) pro mais entregue (inicial do nome).
 *
 * Elas são PEDIDAS, nunca automáticas. A versão anterior liberava sozinha a
 * cada N palpites, e isso tirava da pessoa a única decisão interessante que
 * sobra depois do palpite: aguentar mais uma rodada no escuro ou gastar a
 * ajuda. Terminar sem pedir nada vira uma marca que dá pra mostrar — e é essa
 * marca que faz alguém recusar a dica.
 */
/**
 * A lista de dicas de um modo, em escada: a primeira dá um empurrão, a última
 * quase entrega.
 *
 * A ordem é por FORÇA, e isso já foi feito errado uma vez — o conjunto
 * completo de palavras-chave vinha primeiro e derrubava 24 candidatas pra 1.
 * Uma dica que resolve a rodada não é dica, é botão de revelar resposta: a
 * pessoa clica, ganha sem graça nenhuma e conclui que o jogo é quebrado.
 *
 * Dica também nunca repete coluna da grade: no modo da grade, cor, custo/vida,
 * poder, traço e coleção já são comparados a cada palpite, e pagar a marca
 * "sem dica" por algo que a grade entrega de graça seria roubo.
 */
export function dicasDoModo(carta: Carta, idDoModo: string): Dica[] {
  const quantidade: Dica = {
    rotulo: 'Quantas palavras-chave',
    valor:
      carta.palavrasChave.length === 0
        ? 'nenhuma'
        : `${carta.palavrasChave.length} ${carta.palavrasChave.length === 1 ? 'palavra' : 'palavras'}`,
    combina: (outra) => outra.palavrasChave.length === carta.palavrasChave.length,
  }

  const conjunto: Dica = {
    rotulo: 'Palavras-chave',
    valor: carta.palavrasChave.join(' · ') || 'nenhuma',
    estilo: 'selos',
    combina: (outra) =>
      [...outra.palavrasChave].sort().join() === [...carta.palavrasChave].sort().join(),
  }

  const daCarta = dicasDaCarta(carta)
  const inicial = daCarta[daCarta.length - 1] as Dica
  const semInicial = daCarta.slice(0, -1)
  const tipo = daCarta.find((dica) => dica.rotulo === 'Tipo') as Dica

  // Modo com grade: cor, custo/vida, poder, traço e coleção já são coluna. O
  // TIPO não é, e isso foi medido: pôr tipo na grade vale nove centésimos de
  // palpite (4,38 -> 4,29), porque ele já vaza pelo "—" do poder, que só
  // acontece em evento e stage. De graça na grade ele quase não paga a vaga;
  // como dica PEDIDA ele vale, porque quem pede escolhe gastar a marca por
  // ele — e é a saída pra quando a carta do dia tem sósia.
  if (idDoModo !== 'efeito' && idDoModo !== 'arte') return [quantidade, tipo, conjunto, inicial]
  if (idDoModo === 'efeito') return daCarta
  return [quantidade, ...semInicial, conjunto, inicial]
}

/** Como cada tipo se chama na tela. */
const NOME_DO_TIPO: Record<Carta['tipo'], string> = {
  lider: 'Líder',
  personagem: 'Personagem',
  evento: 'Evento',
  stage: 'Stage',
}

export function dicasDaCarta(carta: Carta): Dica[] {
  const mesmoConjunto = (a: string[], b: string[]) =>
    a.length === b.length && [...a].sort().join() === [...b].sort().join()

  const dicas: Dica[] = [
    {
      rotulo: 'Cor',
      valor: carta.cores.join(' · '),
      combina: (outra) => mesmoConjunto(outra.cores, carta.cores),
    },
    {
      // Com quatro tipos no mesmo deck, esta é das dicas mais fortes que
      // existem — e é justamente por isso que ela é PEDIDA e não uma coluna.
      rotulo: 'Tipo',
      valor: NOME_DO_TIPO[carta.tipo],
      combina: (outra) => outra.tipo === carta.tipo,
    },
    {
      // Rótulo neutro de propósito: "Custo" fechado já diria que a carta NÃO é
      // líder, e "Vida", que é — dica de graça antes da hora.
      rotulo: 'Custo ou vida',
      valor:
        carta.tipo === 'lider'
          ? `${carta.vida} de vida`
          : carta.custo == null
            ? 'sem custo'
            : `${carta.custo} de custo`,
      combina: (outra) => outra.custo === carta.custo && outra.vida === carta.vida,
    },
    {
      // Evento e stage não têm poder. O travessão é resposta legítima: quem
      // pediu a dica fica sabendo que a carta é de um desses dois.
      rotulo: 'Poder',
      valor: carta.poder == null ? '—' : carta.poder.toLocaleString('pt-BR'),
      combina: (outra) => outra.poder === carta.poder,
    },
    {
      rotulo: 'Traços',
      valor: carta.tracos.join(' · ') || '—',
      combina: (outra) => mesmoConjunto(outra.tracos, carta.tracos),
    },
    {
      rotulo: 'Coleção',
      valor: carta.colecao.codigo,
      combina: (outra) => outra.colecao.codigo === carta.colecao.codigo,
    },
    {
      rotulo: 'Inicial do nome',
      valor: `${carta.nome.charAt(0).toUpperCase()}…`,
      combina: (outra) => outra.nome.charAt(0).toUpperCase() === carta.nome.charAt(0).toUpperCase(),
    },
  ]
  return dicas
}

/**
 * Apaga o nome da própria carta do texto do efeito. Um efeito que cita a carta
 * ("...jogue [Monkey.D.Luffy] da sua mão...") entrega a resposta de graça.
 * Cobre cada pedaço do nome separado porque o dataset escreve
 * "Monkey.D.Luffy" e "Monkey D. Luffy" pra mesma pessoa.
 */
export function censurarNome(efeito: string, nome: string): string {
  const pedacos = nome
    .split(/[\s.]+/)
    .map((pedaco) => pedaco.trim())
    .filter((pedaco) => pedaco.length >= 3)

  let texto = efeito
  for (const pedaco of [nome, ...pedacos]) {
    const escapado = pedaco.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    texto = texto.replace(new RegExp(escapado, 'gi'), '█████')
  }
  return texto.replace(/(█████[\s.]*)+/g, '█████ ')
}
