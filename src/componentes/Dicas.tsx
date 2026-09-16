import { dicasDoModo } from '../jogo/dicas'
import type { Carta } from '../jogo/tipos'
import { ICONE } from './icones'
import { SeloDePalavraChave } from './SeloDePalavraChave'

interface Props {
  carta: Carta
  idDoModo: string
  pedidas: number
  /** Rodada encerrada: aí tudo aparece, pedido ou não. */
  revelado: boolean
  aoPedir: () => void
  aoAbrirLegenda: () => void
}

/**
 * As dicas, pedidas uma a uma.
 *
 * Antes elas caíam sozinhas — a de palavras-chave já vinha aberta e as outras
 * se liberavam a cada N palpites. Isso tirava da pessoa a única decisão que
 * sobra depois de chutar: aguentar mais uma rodada no escuro ou gastar a ajuda.
 * Pedir tem custo (a rodada deixa de ser "sem dica") e é isso que faz alguém
 * recusar — e recusar é o que torna o acerto uma história.
 */
export function Dicas({ carta, idDoModo, pedidas, revelado, aoPedir, aoAbrirLegenda }: Props) {
  const todas = dicasDoModo(carta, idDoModo)
  const abertas = revelado ? todas : todas.slice(0, pedidas)
  const restam = todas.length - abertas.length

  return (
    <section className="painel px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="rotulo">
          Dicas {pedidas > 0 && <span className="text-foil-text">· {pedidas} pedida{pedidas === 1 ? '' : 's'}</span>}
        </h2>
        {abertas.some((dica) => dica.estilo === 'selos') && (
          <button
            type="button"
            onClick={aoAbrirLegenda}
            className="text-xs text-tinta-3 underline decoration-dotted underline-offset-4 hover:text-foil-text"
          >
            o que é isso?
          </button>
        )}
      </div>

      {abertas.length === 0 ? (
        <p className="text-sm text-tinta-3">
          Nenhuma até agora. Terminar sem pedir vale a marca <strong className="text-ok-strong">sem dica</strong>.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {abertas.map((dica) => (
            <li key={dica.rotulo} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="rotulo">{dica.rotulo}</span>
              {dica.estilo === 'selos' ? (
                carta.palavrasChave.length === 0 ? (
                  <span className="text-tinta-3">nenhuma — o efeito é texto corrido</span>
                ) : (
                  <span className="flex flex-wrap items-center gap-1.5">
                    {carta.palavrasChave.map((chave) => (
                      <SeloDePalavraChave key={chave} chave={chave} explicacao="" />
                    ))}
                  </span>
                )
              ) : (
                <span className="text-foil-text">{dica.valor}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {!revelado && restam > 0 && (
        <button
          type="button"
          onClick={aoPedir}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-controle px-2.5 py-1.5 text-xs font-semibold text-tinta hover:border-foil hover:text-foil-text"
        >
          <ICONE.fechado aria-hidden="true" className="size-3.5" />
          Pedir dica ({restam} {restam === 1 ? 'disponível' : 'disponíveis'})
        </button>
      )}
    </section>
  )
}
