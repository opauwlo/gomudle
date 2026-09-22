import { useEffect, useRef, useState } from 'react'
import { janelaDaArte, revelacaoDaArte, type JanelaDaArte } from '../jogo/arte'
import type { Carta } from '../jogo/tipos'
import { ImagemDaCarta } from './ImagemDaCarta'

interface Props {
  carta: Carta
  palpites: number
  revelar: boolean
}

/** A janela em `clip-path`. `inset()` recebe as distâncias até cada borda. */
function recorte({ esquerda, topo, largura, altura }: JanelaDaArte): string {
  const direita = 100 - esquerda - largura
  const baixo = 100 - topo - altura
  // `round` arredonda os cantos: sem isso a janela é um retângulo duro, que
  // parece corte de imagem quebrada em vez de lente.
  return `inset(${topo}% ${direita}% ${baixo}% ${esquerda}% round 0.5rem)`
}

/**
 * A carta inteira em blocos, desenhada a partir da MESMA imagem que já está na
 * tela: encolhe pra `blocos` de largura num canvas e o CSS estica de volta com
 * `image-rendering: pixelated`, que amplia sem suavizar — cada pixel do canvas
 * vira um bloco chapado.
 *
 * Por que canvas e não uma imagem minúscula pedida ao CDN: porque o mosaico não
 * pode depender de o CDN estar de pé. A terceira fonte da fila é o site oficial,
 * que não redimensiona nada (ver `FONTES` em `jogo/imagens.ts`) — pedir "32px"
 * pra ela devolve a carta inteira em tamanho de impressão, e o modo arte
 * abriria com a resposta na tela. Desenhando aqui, o mosaico sai do que já
 * chegou, seja de qual fonte for, e não custa nenhuma requisição a mais.
 *
 * O canvas fica contaminado (a arte é de outra origem, sem CORS) e tudo bem:
 * contaminação proíbe LER pixel de volta, não desenhar.
 */
function Mosaico({ imagem, blocos }: { imagem: HTMLImageElement; blocos: number }) {
  const tela = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = tela.current
    if (canvas === null || imagem.naturalWidth === 0) return

    const altura = Math.max(1, Math.round((blocos * imagem.naturalHeight) / imagem.naturalWidth))
    // Mexer no tamanho zera o contexto, então a suavização vem depois.
    canvas.width = blocos
    canvas.height = altura
    const pincel = canvas.getContext('2d')
    if (pincel === null) return

    // Média da região, não amostra de um pixel só: sem isso um encolhimento de
    // 600px pra 13 vira ruído em vez da cor de cada pedaço da carta.
    pincel.imageSmoothingEnabled = true
    pincel.imageSmoothingQuality = 'high'
    pincel.drawImage(imagem, 0, 0, blocos, altura)
  }, [imagem, blocos])

  return (
    <canvas
      ref={tela}
      aria-hidden="true"
      className="absolute inset-0 size-full object-cover"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

export function PainelDeArte({ carta, palpites, revelar }: Props) {
  const [semImagem, setSemImagem] = useState(false)
  // Objeto novo a cada carregamento de propósito: a `<img>` é sempre o mesmo
  // elemento, então guardar só ele deixaria o mosaico preso na carta anterior
  // quando o treino sorteia outra. O id diz de quem é o que está desenhado.
  const [arte, setArte] = useState<{ imagem: HTMLImageElement; de: string } | null>(null)

  // A escada é regra de jogo, não detalhe de tela: mora em jogo/arte.ts e é
  // testada lá.
  const { janela, blocos } = revelacaoDaArte(palpites, revelar)
  const area = janelaDaArte(carta.id, janela)

  return (
    <div>
      <div className="painel relative mx-auto aspect-[5/7] w-56 overflow-hidden sm:w-64">
        {arte !== null && arte.de === carta.id && (
          <Mosaico imagem={arte.imagem} blocos={blocos} />
        )}
        <ImagemDaCarta
          // `key` pela carta: sem isso o treino troca só o `src` da MESMA
          // <img>, e o navegador segura o quadro antigo até o novo decodificar
          // — a janela mostraria a carta anterior por um instante, nítida.
          key={carta.id}
          carta={carta}
          tamanho="arte"
          prioritaria
          identidadeOculta={!revelar}
          // A transição é do recorte: na revelação a janela abre sobre o
          // mosaico em vez de trocar de imagem num quadro só.
          className="absolute inset-0 size-full object-cover transition-[clip-path] duration-500"
          estiloDaImagem={{
            clipPath: recorte(area),
            WebkitClipPath: recorte(area),
          }}
          aoCarregar={(imagem) => setArte({ imagem, de: carta.id })}
          aoFalhar={() => setSemImagem(true)}
        />
      </div>
      <p className="mt-2 text-center text-xs text-tinta-3">
        {semImagem
          ? 'A arte não carregou por nenhuma das fontes. Use as dicas abaixo.'
          : revelar
            ? 'Carta revelada.'
            : `Janela nítida: ${janela}% da largura — cada erro alarga.`}
      </p>
    </div>
  )
}
