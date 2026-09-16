import { useState } from 'react'
import type { Carta } from '../jogo/tipos'
import { ImagemDaCarta } from './ImagemDaCarta'

interface Props {
  carta: Carta
  palpites: number
  revelar: boolean
}

/** Ponto do recorte, estável por carta: todo mundo vê o mesmo pedaço da arte. */
function foco(id: string): { x: number; y: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return { x: 28 + (h % 45), y: 22 + ((h >> 8) % 40) }
}

export function PainelDeArte({ carta, palpites, revelar }: Props) {
  const [semImagem, setSemImagem] = useState(false)
  const passo = Math.min(palpites, 6)
  const escala = revelar ? 1 : Math.max(1.15, 7.5 - passo * 1.05)
  const desfoque = revelar ? 0 : Math.max(0, 2.5 - passo * 1.2)
  const { x, y } = foco(carta.id)

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
