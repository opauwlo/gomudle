/**
 * A escada do modo arte: quanto da carta aparece a cada palpite.
 *
 * **Não é mais zoom.** As duas primeiras versões ampliavam um recorte do miolo
 * — 7,5×, depois 3× — com desfoque leve por cima, e as duas eram embaçadas por
 * construção: a arte tem 600px de largura e é tudo que existe (ver `TETO_NATIVO`
 * em `jogo/imagens.ts`). Mostrar um terço dela num painel de 256px é esticar
 * 200px por 768 — 1536 num celular 2×. Ampliar não inventa pixel, e o desfoque
 * ainda somava borrão a uma imagem que já estava borrada.
 *
 * Agora a carta aparece INTEIRA, em mosaico grosso, e o que a escada abre é uma
 * JANELA: dentro dela a imagem é a mesma `<img>` sem transform nenhum, exibida
 * MENOR que o nativo, que é a maior nitidez que a origem tem pra dar. Cada erro
 * alarga a janela e afina o mosaico.
 *
 * A troca é boa pro jogo, não só pra qualidade: o mosaico entrega silhueta,
 * cores e composição da carta inteira — que é dedução de verdade — e a janela
 * entrega traço. Antes, o que estava fora do recorte simplesmente não existia.
 */
export interface RevelacaoDaArte {
  /** Lado da janela nítida, em % do painel. A mesma % nos dois eixos. */
  janela: number
  /** Blocos do mosaico na largura da carta. Menos blocos, mais pixelado. */
  blocos: number
}

/**
 * Onde a janela começa e termina, em % da LARGURA do painel (a altura sai da
 * `PROPORCAO_DO_PAINEL`).
 *
 * 24% é pedaço, não mancha: num painel de 224px são 54×54px de arte no tamanho
 * nativo — dá pra ver traço, sombreado e um pedaço de cenário. O fim é 58% de
 * propósito: no último palpite ainda sobra carta escondida, senão a revelação
 * não teria o que revelar.
 */
const JANELA_INICIAL = 24
const JANELA_FINAL = 58

/**
 * O mosaico, em blocos na largura.
 *
 * 13 blocos numa arte de 600px dá blocos de ~46px da origem: é o "super
 * pixelado" que mostra a composição e esconde a carta. 34 no fim continua bem
 * longe de legível — o nome impresso tem ~30px de altura na origem, menos de
 * dois blocos, e some no borrão.
 */
const BLOCOS_INICIAL = 13
const BLOCOS_FINAL = 34

/**
 * Onde a escada para. A rodada não tem limite de palpite — quem quiser erra
 * vinte vezes — e a partir daqui errar não abre mais nada: quem chegou no sexto
 * erro tem as dicas, não mais janela.
 */
const ULTIMO_PASSO = 6

/**
 * Até onde a janela pode descer, em % da altura da carta.
 *
 * Do pé da ilustração pra baixo a carta impressa deixa de ser desenho e vira
 * TEXTO: a caixa de efeito, a categoria, o nome e o código. Nítido ali o modo
 * acaba — o nome é o gabarito, e duas linhas de efeito são o gabarito de quem
 * sabe pesquisar. O mosaico cobre essa faixa a rodada inteira; só a revelação
 * abre.
 *
 * 60% é onde a caixa de efeito começa nas cartas mais falantes (nas de texto
 * curto ela começa mais embaixo, e aí a janela para antes por segurança). Foi
 * medido na tela, não estimado: com o limite em 72 a janela caía em cima da
 * caixa e dava pra LER o efeito do dia.
 */
export const LIMITE_DA_ARTE = 60

/**
 * Proporção do painel (o `aspect-[5/7]` de `PainelDeArte`). A janela usa ela
 * pra sair QUADRADA na tela: a mesma porcentagem nos dois eixos, num painel
 * mais alto que largo, daria uma fresta em pé — e a faixa que a janela pode
 * ocupar é limitada na vertical, não na horizontal.
 */
const PROPORCAO_DO_PAINEL = 5 / 7

const PASSO_DA_JANELA = (JANELA_FINAL - JANELA_INICIAL) / ULTIMO_PASSO
const PASSO_DOS_BLOCOS = (BLOCOS_FINAL - BLOCOS_INICIAL) / ULTIMO_PASSO

export function revelacaoDaArte(palpites: number, revelar: boolean): RevelacaoDaArte {
  if (revelar) return { janela: 100, blocos: BLOCOS_FINAL }

  const passo = Math.min(Math.max(palpites, 0), ULTIMO_PASSO)
  return {
    // Inteiros: a janela vira porcentagem de `clip-path` e texto na tela, e
    // 41,333333% não ajuda nenhum dos dois.
    janela: Math.round(JANELA_INICIAL + passo * PASSO_DA_JANELA),
    blocos: Math.round(BLOCOS_INICIAL + passo * PASSO_DOS_BLOCOS),
  }
}

/**
 * Ponto do recorte, estável por carta: todo mundo vê o mesmo pedaço no mesmo
 * dia, e quem recarrega a página não ganha um ângulo novo.
 *
 * A faixa cobre a carta quase inteira, canto incluído — de propósito. A versão
 * do zoom prendia o foco no miolo (x de 28 a 72, y de 22 a 61) porque perto da
 * borda o recorte caía na moldura e a moldura não é a arte. Com a carta inteira
 * na tela isso deixou de ser perda e virou pista: o canto de cima à esquerda é
 * o custo, o de cima à direita é o poder e o atributo, a borda é a cor. São as
 * mesmas colunas que os outros modos comparam — aqui elas aparecem impressas.
 *
 * O y para antes da barra de baixo (ver `LIMITE_DA_ARTE`): lá está o nome.
 */
export function focoDaArte(id: string): { x: number; y: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  // `>>>`, não `>>`: o hash passa de 2³¹ e o deslocamento COM sinal devolve
  // número negativo, que no resto vira porcentagem negativa. Era o que
  // acontecia em 708 das 840 cartas — o foco ancorava fora da carta.
  // x varre a largura inteira (0 a 100) e y para na `LIMITE_DA_ARTE`, que é o
  // teto da janela: assim o ponto sorteado cabe dentro dela em todo passo.
  return { x: h % 101, y: (h >>> 8) % (LIMITE_DA_ARTE + 1) }
}

/** A janela nítida no painel, em % — pronta pra virar `clip-path: inset()`. */
export interface JanelaDaArte {
  esquerda: number
  topo: number
  largura: number
  altura: number
}

const limitar = (valor: number, minimo: number, maximo: number) =>
  Math.min(Math.max(valor, minimo), maximo)

/**
 * Onde a janela de `lado`% fica na carta `id`.
 *
 * Ela é centrada no foco e empurrada pra dentro quando não cabe — nunca sai do
 * painel e nunca desce da `LIMITE_DA_ARTE`. Empurrar preserva o que importa: o
 * ponto sorteado continua dentro da janela em todo passo, então a janela cresce
 * em volta do mesmo pedaço em vez de passear pela carta.
 */
export function janelaDaArte(id: string, lado: number): JanelaDaArte {
  // A janela de 100% É a revelação: a carta inteira, e aí não sobrou nome pra
  // proteger.
  if (lado >= 100) return { esquerda: 0, topo: 0, largura: 100, altura: 100 }

  const { x, y } = focoDaArte(id)
  const largura = lado
  const altura = Math.round(lado * PROPORCAO_DO_PAINEL * 10) / 10

  return {
    esquerda: limitar(x - largura / 2, 0, 100 - largura),
    topo: limitar(y - altura / 2, 0, LIMITE_DA_ARTE - altura),
    largura,
    altura,
  }
}
