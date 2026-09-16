import { useEffect, useState } from 'react'
import type { Carta } from '../jogo/tipos'

interface Props {
  carta: Carta
  className?: string
  /** Estilo aplicado na <img>, usado pelo modo arte pra dar zoom. */
  estiloDaImagem?: React.CSSProperties
  /**
   * No modo arte a carta é o enigma: nem o `alt` nem o aviso de falha podem
   * dizer qual é. Já entregou a resposta uma vez, escrito no meio da tela.
   * (O endereço da imagem ainda tem o código da carta — quem abre o inspetor
   * consegue colar. Isso é aceito: o jogo não guarda segredo de servidor.)
   */
  identidadeOculta?: boolean
  /**
   * Miniatura: o aviso de falha vira um quadrinho com a inicial do nome. O
   * texto "arte indisponível" não cabe em 40px de largura — vazava da lista de
   * sugestões inteira.
   */
  compacta?: boolean
  aoFalhar?: () => void
}

/**
 * A arte vem do site oficial do jogo por link direto — o projeto não hospeda
 * imagem de carta, que é material da Bandai. Se o carregamento falhar (o
 * oficial pode bloquear link de fora a qualquer momento), a tela mostra um
 * quadro com o código da carta em vez de um ícone quebrado.
 */
export function ImagemDaCarta({
  carta,
  className = '',
  estiloDaImagem,
  identidadeOculta = false,
  compacta = false,
  aoFalhar,
}: Props) {
  const [falhou, setFalhou] = useState(false)

  useEffect(() => setFalhou(false), [carta.id])

  if (falhou || carta.imagem === '') {
    if (compacta) {
      return (
        // Sem o nome ao lado (a grade mostra só a arte), o fallback precisa
        // dizer QUAL carta é — senão, arte que não carrega deixa a linha
        // anônima e o jogo sem sentido.
        <div
          className={`flex items-center justify-center bg-linha px-0.5 text-center text-[0.5rem] font-bold leading-none text-tinta-3 ${className}`}
        >
          {carta.id.replace('-', '\u2011')}
        </div>
      )
    }
    return (
      <div
        className={`flex items-center justify-center bg-surface text-center text-xs text-tinta-3 ${className}`}
      >
        <span className="px-2">
          arte indisponível
          {!identidadeOculta && (
            <>
              <br />
              <strong className="text-tinta">{carta.id}</strong>
            </>
          )}
        </span>
      </div>
    )
  }

  return (
    <img
      src={carta.imagem}
      alt={identidadeOculta ? 'Pedaço da arte da carta do dia' : `Carta ${carta.nome} (${carta.id})`}
      className={className}
      style={estiloDaImagem}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => {
        setFalhou(true)
        aoFalhar?.()
      }}
    />
  )
}
