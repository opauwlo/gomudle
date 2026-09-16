import type { Habito } from '../jogo/progresso'
import { ICONE } from './icones'

interface Props {
  habito: Habito
  aoAbrirAjuda: () => void
  aoAbrirEstatisticas: () => void
}

export function Cabecalho({ habito, aoAbrirAjuda, aoAbrirEstatisticas }: Props) {
  const botao =
    'rounded-xl border border-hairline bg-surface-1 p-2.5 text-tinta hover:bg-surface hover:text-foil-text'

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-titulo text-2xl tracking-tight text-playmat sm:text-3xl">Gomudle</h1>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/*
          A sequência fica visível o tempo todo, não escondida na tela de
          estatística. É o número que faz alguém abrir o jogo num dia corrido —
          mas só aparece depois do primeiro dia, porque "0 dias" não motiva
          ninguém, só informa que você ainda não começou.
        */}
        {habito.sequencia > 0 && (
          <button
            type="button"
            onClick={aoAbrirEstatisticas}
            title={`${habito.sequencia} ${habito.sequencia === 1 ? 'dia seguido' : 'dias seguidos'} — melhor: ${habito.melhorSequencia}`}
            className="flex items-center gap-1 rounded-xl border border-foil-tint-border bg-foil-tint px-2.5 py-2 text-sm font-semibold text-foil-text"
          >
            <ICONE.sequencia aria-hidden="true" className="size-4" />
            {habito.sequencia}
            <span className="sr-only">
              {habito.sequencia === 1 ? 'dia seguido' : 'dias seguidos'}
            </span>
          </button>
        )}
        <button type="button" onClick={aoAbrirAjuda} aria-label="Como jogar" title="Como jogar" className={botao}>
          <ICONE.ajuda aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          onClick={aoAbrirEstatisticas}
          aria-label="Estatísticas"
          title="Estatísticas"
          className={botao}
        >
          <ICONE.estatisticas aria-hidden="true" className="size-5" />
        </button>
      </div>
    </header>
  )
}
