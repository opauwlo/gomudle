import type { Carta } from './tipos'

/**
 * De onde sai a arte das cartas.
 *
 * O projeto não hospeda imagem de carta — é material da Bandai — e o endereço
 * guardado no dataset é o do site oficial: PNG em tamanho de impressão, que
 * passa de meio megabyte por carta. O jogo mostra doze miniaturas enquanto a
 * pessoa digita e uma linha de arte por palpite, então pedir esse PNG direto é
 * caro em qualquer conexão. Pior: quem pede é o navegador de quem joga, e o
 * oficial não aceita link de fora sempre — quando ele recusa, o jogo fica sem
 * arte nenhuma, que foi exatamente o que aconteceu.
 *
 * A saída é servir a MESMA arte oficial por um CDN de imagem. Ele busca no
 * oficial uma vez, pelo servidor dele (não é o navegador de quem joga pedindo,
 * então bloqueio de link externo não se aplica), converte pra WebP, entrega no
 * tamanho que a tela usa de verdade e guarda em cache pro resto do mundo. A
 * miniatura sai de centenas de kB pra poucos kB.
 *
 * São dois CDNs, e o endereço oficial fica de terceiro. Nenhum dos três é do
 * projeto, então a ordem não é preferência estética: é a fila de quem assume
 * quando o anterior cair. O oficial por último porque ele SEMPRE existe — é a
 * origem — e é o único que não depende de terceiro nenhum.
 */
export interface FonteDeImagem {
  nome: string
  /**
   * `oficial` é o endereço que veio no dataset. `largura` é em px — a fonte
   * que não sabe redimensionar simplesmente ignora. `qualidade` é 1 a 100.
   */
  enderecar(oficial: string, largura: number, qualidade: number): string
}

/**
 * A qualidade do WebP é POR USO, porque o mesmo número não serve pros dois
 * extremos.
 *
 * 76 é o ponto em que a carta ainda parece impressa e o arquivo já é pequeno:
 * acima de 85 o WebP engorda rápido sem ganho visível num retângulo de 40px, e
 * abaixo de 70 aparece sujeira no contorno da arte, que em carta chapada com
 * traço preto salta aos olhos. Vale pra miniatura e pro cartão.
 *
 * No modo arte não vale: ali a janela nítida mostra a arte quase pixel a pixel
 * num celular 2× (600px de origem em 512px de tela), e é essa nitidez que o
 * modo vende. O que numa miniatura de 40px ninguém vê, ali aparece em volta do
 * traço. 90 é caro em bytes, mas é UMA imagem por rodada e ela é a tela
 * inteira do modo.
 */
const QUALIDADE: Record<TamanhoDaImagem, number> = {
  miniatura: 76,
  carta: 76,
  arte: 90,
}

/** Os dois CDNs recebem o endereço sem o protocolo. */
const semProtocolo = (oficial: string) => oficial.replace(/^https?:\/\//, '')

export const FONTES: FonteDeImagem[] = [
  {
    nome: 'wsrv',
    // `we` = sem ampliar: se a origem for menor que o pedido, vem a origem.
    // Ampliar no CDN só gastaria bytes pra borrar do mesmo jeito.
    enderecar: (oficial, largura, qualidade) =>
      `https://wsrv.nl/?url=${encodeURIComponent(semProtocolo(oficial))}` +
      `&w=${largura}&output=webp&q=${qualidade}&we`,
  },
  {
    nome: 'statically',
    enderecar: (oficial, largura, qualidade) =>
      `https://cdn.statically.io/img/${semProtocolo(oficial)}?w=${largura}&q=${qualidade}&f=webp`,
  },
  {
    nome: 'oficial',
    enderecar: (oficial) => oficial,
  },
]

/** Onde a arte aparece. Cada lugar pede o tamanho que realmente usa. */
export type TamanhoDaImagem = 'miniatura' | 'carta' | 'arte'

/**
 * A arte oficial tem 600×838. Medido, não estimado: o PNG do dataset, e o
 * mesmo endereço pedido ao CDN com largura bem maior, voltam os três em
 * 600×838.
 *
 * Esse é o TETO de tudo que aparece na tela. Pedir mais que isso não traz
 * pixel nenhum — o `we` das fontes devolve o nativo — e ainda cria um endereço
 * diferente, que faz o navegador baixar duas vezes a mesma imagem.
 */
const TETO_NATIVO = 600

/**
 * Largura pedida ao CDN pro 1×, em px. O 2× é o dobro, limitado ao teto.
 *
 * `arte` pede o nativo inteiro porque a janela do modo arte (ver `jogo/arte.ts`)
 * mostra a imagem sem ampliar nenhum: quanto mais pixel a origem der, mais
 * nítida ela fica. Já foi 360, no entendimento de que isso já passava do
 * nativo — não passava, o nativo é 600.
 *
 * Com 600 de saída não sobra ampliação em lugar nenhum: o painel tem 256px de
 * layout, 512 num celular 2×, e os dois cabem no nativo. Foi o zoom que saiu do
 * modo, justamente porque ampliar não tinha como ficar nítido.
 */
const LARGURA: Record<TamanhoDaImagem, number> = {
  miniatura: 64,
  carta: 200,
  arte: TETO_NATIVO,
}

/**
 * Largura da PRÉVIA: a versão minúscula que chega quase de graça e segura o
 * lugar até a de verdade pintar por cima.
 *
 * 32px de largura em WebP de qualidade baixa dá menos de 1 kB — chega junto
 * com o HTML, na prática. Esticada até o tamanho da tela ela vira um borrão
 * com as formas e as cores certas, que é tudo que se pede de uma prévia:
 * dizer "a imagem é ESTA" enquanto ela não chega.
 *
 * `null` na miniatura de propósito: ali a imagem de verdade tem 64px e já
 * chega em poucos kB. Prévia ali seria uma requisição a mais pra economizar
 * nada — e são doze miniaturas na lista de busca.
 */
const PREVIA: Record<TamanhoDaImagem, number | null> = {
  miniatura: null,
  carta: 32,
  arte: 32,
}

/** Qualidade da prévia. Ela vai ser esticada e borrada: detalhe ali é byte jogado fora. */
const QUALIDADE_DA_PREVIA = 35

/** Proporção da carta impressa (63×88mm). Serve pra reservar o espaço. */
const PROPORCAO = 88 / 63

export interface EnderecoDaImagem {
  src: string
  /** `undefined` na fonte que não redimensiona: 1× e 2× seriam o mesmo. */
  srcSet?: string
  /**
   * A prévia minúscula, pra pintar embaixo enquanto `src` não chega.
   * `undefined` na miniatura (não vale a pena) e na fonte que não
   * redimensiona, onde "prévia" seria o PNG de impressão inteiro.
   */
  previa?: string
  largura: number
  altura: number
}

/**
 * Monta o endereço da arte numa fonte específica. `null` quando a carta não
 * tem arte no dataset ou quando a fila de fontes acabou.
 */
export function enderecoDaCarta(
  carta: Carta,
  tamanho: TamanhoDaImagem,
  indiceDaFonte: number,
): EnderecoDaImagem | null {
  const fonte = FONTES[indiceDaFonte]
  if (!fonte || carta.imagem === '') return null

  const qualidade = QUALIDADE[tamanho]
  const largura = Math.min(LARGURA[tamanho], TETO_NATIVO)
  // O 2× também para no teto. Sem isso, `arte` anunciaria um 2× de 1200 que o
  // CDN devolve em 600 — o mesmo arquivo em outro endereço, e a tela de
  // celular baixaria a imagem duas vezes pra ver a mesma coisa.
  const larguraDobro = Math.min(largura * 2, TETO_NATIVO)

  const src = fonte.enderecar(carta.imagem, largura, qualidade)
  const dobro = fonte.enderecar(carta.imagem, larguraDobro, qualidade)

  const larguraDaPrevia = PREVIA[tamanho]
  const previa =
    larguraDaPrevia === null
      ? undefined
      : fonte.enderecar(carta.imagem, larguraDaPrevia, QUALIDADE_DA_PREVIA)

  return {
    src,
    // Endereços iguais viram `undefined`: é o caso da fonte que não
    // redimensiona e o do tamanho que já pede o nativo.
    srcSet: dobro === src ? undefined : `${src} 1x, ${dobro} 2x`,
    // Prévia igual ao `src` é a fonte que não redimensiona: ali ela seria o
    // PNG de impressão inteiro, o contrário do que uma prévia serve.
    previa: previa === src ? undefined : previa,
    largura,
    altura: Math.round(largura * PROPORCAO),
  }
}

/**
 * Quantas cartas diferentes precisam falhar pra fonte inteira ser dada como
 * perdida. Uma carta que falha sozinha é carta sem arte no acervo daquele CDN
 * — trocar tudo por causa dela jogaria o jogo no PNG pesado à toa. Três
 * cartas é o CDN fora do ar, e aí trocar de uma vez importa: sem isso, CADA
 * miniatura da lista pagaria a mesma requisição perdida pra descobrir
 * sozinha o que a primeira já sabia.
 */
const FALHAS_PRA_TROCAR = 3

export interface SeletorDeFonte {
  /** Por qual fonte uma imagem nova começa. */
  indice(): number
  /** Avisa quando o índice muda, pra quem já está na tela acompanhar. */
  assinar(ouvinte: () => void): () => void
  /**
   * Registra que a arte de `idDaCarta` falhou em `indiceUsado`. Devolve se
   * ainda existe fonte depois dessa pra imagem tentar.
   */
  registrarFalha(indiceUsado: number, idDaCarta: string): boolean
}

export function criarSeletorDeFonte(
  quantidadeDeFontes = FONTES.length,
  falhasPraTrocar = FALHAS_PRA_TROCAR,
): SeletorDeFonte {
  let atual = 0
  const culpadas = new Set<string>()
  const ouvintes = new Set<() => void>()

  return {
    indice: () => atual,

    assinar(ouvinte) {
      ouvintes.add(ouvinte)
      return () => {
        ouvintes.delete(ouvinte)
      }
    },

    registrarFalha(indiceUsado, idDaCarta) {
      // Falha de fonte JÁ abandonada não conta: são as imagens que estavam no
      // ar quando a troca aconteceu chegando atrasadas. Deixar contar
      // derrubaria a fonte nova por culpa da velha.
      if (indiceUsado === atual) {
        culpadas.add(idDaCarta)
        if (culpadas.size >= falhasPraTrocar && atual < quantidadeDeFontes - 1) {
          atual++
          culpadas.clear()
          for (const ouvinte of [...ouvintes]) ouvinte()
        }
      }
      return indiceUsado + 1 < quantidadeDeFontes
    },
  }
}

/** O seletor do jogo. É um só porque a fonte que caiu caiu pra tela inteira. */
export const seletorDeFonte = criarSeletorDeFonte()
