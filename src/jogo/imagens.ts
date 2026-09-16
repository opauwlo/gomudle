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
   * que não sabe redimensionar simplesmente ignora.
   */
  enderecar(oficial: string, largura: number): string
}

/**
 * 76 é o ponto em que a carta ainda parece impressa e o arquivo já é pequeno.
 * Acima de 85 o WebP engorda rápido sem ganho visível num retângulo de 40px;
 * abaixo de 70 aparece sujeira no contorno da arte, que em carta chapada com
 * traço preto salta aos olhos.
 */
const QUALIDADE = 76

/** Os dois CDNs recebem o endereço sem o protocolo. */
const semProtocolo = (oficial: string) => oficial.replace(/^https?:\/\//, '')

export const FONTES: FonteDeImagem[] = [
  {
    nome: 'wsrv',
    // `we` = sem ampliar: se a origem for menor que o pedido, vem a origem.
    // Ampliar no CDN só gastaria bytes pra borrar do mesmo jeito.
    enderecar: (oficial, largura) =>
      `https://wsrv.nl/?url=${encodeURIComponent(semProtocolo(oficial))}` +
      `&w=${largura}&output=webp&q=${QUALIDADE}&we`,
  },
  {
    nome: 'statically',
    enderecar: (oficial, largura) =>
      `https://cdn.statically.io/img/${semProtocolo(oficial)}?w=${largura}&q=${QUALIDADE}&f=webp`,
  },
  {
    nome: 'oficial',
    enderecar: (oficial) => oficial,
  },
]

/** Onde a arte aparece. Cada lugar pede o tamanho que realmente usa. */
export type TamanhoDaImagem = 'miniatura' | 'carta' | 'arte'

/**
 * Largura pedida ao CDN pro 1×, em px. O 2× é o dobro, e é ele que a tela de
 * celular usa — por isso o número aqui parece pequeno demais pra cada caso.
 *
 * `arte` é o maior porque o painel do modo arte amplia a imagem em até 3× (ver
 * `jogo/arte.ts`). 360 (720 no 2×) pede mais do que a arte oficial costuma
 * ter: como a fonte não amplia, o que chega é o tamanho nativo dela — e é ele
 * o teto do que dá pra mostrar ampliado sem virar borrão.
 */
const LARGURA: Record<TamanhoDaImagem, number> = {
  miniatura: 64,
  carta: 200,
  arte: 360,
}

/** Proporção da carta impressa (63×88mm). Serve pra reservar o espaço. */
const PROPORCAO = 88 / 63

export interface EnderecoDaImagem {
  src: string
  /** `undefined` na fonte que não redimensiona: 1× e 2× seriam o mesmo. */
  srcSet?: string
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

  const largura = LARGURA[tamanho]
  const src = fonte.enderecar(carta.imagem, largura)
  const dobro = fonte.enderecar(carta.imagem, largura * 2)

  return {
    src,
    srcSet: dobro === src ? undefined : `${src} 1x, ${dobro} 2x`,
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
