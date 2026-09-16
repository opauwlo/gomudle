import { FORMATOS, type IdDeFormato } from '../jogo/formatos'
import { MODOS } from '../jogo/modos'
import type { IdDeModo } from '../jogo/tipos'

interface Props {
  modo: IdDeModo
  formato: IdDeFormato
  /** Como cada modo terminou hoje — vira o ponto na aba. */
  resumoDoDia: Record<string, 'ganhou' | 'perdeu' | null>
  numeroDoDesafio: number
  cartasNoDeck: number
  aoTrocarModo: (id: IdDeModo) => void
  aoTrocarFormato: (id: IdDeFormato) => void
}

/**
 * Modo e formato numa peça só.
 *
 * Eram dois blocos soltos empilhados — quatro botões grandes e, embaixo, uma
 * pílula com uma frase comprida que quebrava linha. Três faixas de controle
 * antes de o jogo começar, e nenhuma delas parecia parte da mesma coisa.
 * Agora é uma barra: modo em cima, formato e o número do desafio embaixo,
 * divididos por um fio. A explicação do formato saiu da tela e virou `title` —
 * ela é lida uma vez na vida, não em toda partida.
 */
export function BarraDeControles({
  modo,
  formato,
  resumoDoDia,
  numeroDoDesafio,
  cartasNoDeck,
  aoTrocarModo,
  aoTrocarFormato,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-1">
      <nav aria-label="Modos de jogo">
        {/*
          As colunas saem da lista de modos, não de uma classe fixa: com
          `grid-cols-4` escrito à mão, tirar um modo deixava uma célula vazia
          na barra — e ninguém lembra de vir aqui ao mexer em `MODOS`.
        */}
        <ul
          className="grid"
          style={{ gridTemplateColumns: `repeat(${MODOS.length}, minmax(0, 1fr))` }}
        >
          {MODOS.map((outro) => {
            const ativo = outro.id === modo
            const feito = resumoDoDia[outro.id]
            return (
              <li key={outro.id}>
                <button
                  type="button"
                  onClick={() => aoTrocarModo(outro.id)}
                  aria-current={ativo ? 'page' : undefined}
                  className={`flex w-full items-center justify-center px-1 py-2.5 text-xs font-semibold transition ${
                    ativo ? 'bg-foil text-ink-fixed' : 'text-tinta-3 hover:bg-surface hover:text-tinta'
                  }`}
                >
                  <span className="relative">
                    {outro.nome}
                    {feito && (
                      <span
                        title={feito === 'ganhou' ? 'já acertou hoje' : 'já viu a resposta hoje'}
                        className={`absolute -right-2 -top-0.5 size-1.5 rounded-full ${
                          ativo ? 'bg-ink-fixed' : feito === 'ganhou' ? 'bg-ok' : 'bg-selo'
                        }`}
                      />
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-hairline px-2 py-1.5">
        <div role="group" aria-label="Formato" className="flex gap-0.5">
          {FORMATOS.map((outro) => {
            const ativo = outro.id === formato
            return (
              <button
                key={outro.id}
                type="button"
                onClick={() => aoTrocarFormato(outro.id)}
                aria-pressed={ativo}
                title={outro.resumo}
                className={`rounded-lg px-2.5 py-1 text-[0.72rem] font-semibold transition ${
                  ativo ? 'bg-surface text-foil-text' : 'text-tinta-3 hover:text-tinta'
                }`}
              >
                {outro.nome}
              </button>
            )
          })}
        </div>

        <p className="pr-1 text-[0.7rem] text-tinta-3">
          #{numeroDoDesafio} · {cartasNoDeck} cartas
        </p>
      </div>
    </div>
  )
}
