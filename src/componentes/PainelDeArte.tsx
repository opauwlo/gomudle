import { useState } from 'react'
import { focoDaArte, zoomDaArte } from '../jogo/arte'
import type { Carta } from '../jogo/tipos'
import { ImagemDaCarta } from './ImagemDaCarta'

interface Props {
  carta: Carta
  palpites: number
  revelar: boolean
}

export function PainelDeArte({ carta, palpites, revelar }: Props) {
  const [semImagem, setSemImagem] = useState(false)
  // A escada do zoom é regra de jogo, não detalhe de tela: mora em jogo/arte.ts
  // e é testada lá.
  const { escala, desfoque } = zoomDaArte(palpites, revelar)
  const { x, y } = focoDaArte(carta.id)

  return (
    <div>
      <div className="painel mx-auto aspect-[5/7] w-56 overflow-hidden sm:w-64">
        <ImagemDaCarta
          carta={carta}
          tamanho="arte"
          prioritaria
          identidadeOculta={!revelar}
          className="size-full object-cover transition-all duration-500"
          estiloDaImagem={{
            transform: `scale(${escala})`,
            transformOrigin: `${x}% ${y}%`,
            filter: desfoque > 0 ? `blur(${desfoque}px)` : undefined,
          }}
          aoFalhar={() => setSemImagem(true)}
        />
      </div>
      <p className="mt-2 text-center text-xs text-tinta-3">
        {semImagem
          ? 'A arte não carregou por nenhuma das fontes. Use as dicas abaixo.'
          : revelar
            ? 'Carta revelada.'
            : `Zoom ${escala.toFixed(1)}× — cada erro afasta a câmera.`}
      </p>
    </div>
  )
}
