import type { Formato } from '../jogo/formatos'
import type { Modo } from '../jogo/modos'
import type { Estatisticas, Habito } from '../jogo/progresso'
import { Modal } from './Modal'

const FAIXAS = ['1', '2', '3', '4', '5', '6', '7', '8+']

interface Props {
  modo: Modo
  formato: Formato
  estatisticas: Estatisticas
  habito: Habito
  aoFechar: () => void
}

export function ModalEstatisticas({ modo, formato, estatisticas, habito, aoFechar }: Props) {
  const { jogos, vitorias, distribuicao } = estatisticas
  const aproveitamento = jogos === 0 ? 0 : Math.round((vitorias / jogos) * 100)
  const maior = Math.max(1, ...FAIXAS.map((faixa) => distribuicao[faixa] ?? 0))

  return (
    <Modal titulo={`Estatísticas · ${modo.nome} · ${formato.nome}`} aoFechar={aoFechar}>
      <dl className="grid grid-cols-4 gap-2 text-center">
        {[
          ['Dias seguidos', habito.sequencia],
          ['Melhor', habito.melhorSequencia],
          ['Rodadas aqui', jogos],
          ['Acerto', `${aproveitamento}%`],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-xl bg-surface-1 px-2 py-3">
            <dd className="text-xl font-bold text-foil-text">{valor}</dd>
            <dt className="text-[0.7rem] uppercase tracking-wide text-tinta-3">{rotulo}</dt>
          </div>
        ))}
      </dl>

      <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-3">
        Palpites até acertar
      </h3>
      {jogos === 0 ? (
        <p className="text-sm text-tinta-3">Jogue uma rodada pra começar a contar.</p>
      ) : (
        <ul className="space-y-1.5">
          {FAIXAS.map((faixa) => {
            const quantidade = distribuicao[faixa] ?? 0
            return (
              <li key={faixa} className="flex items-center gap-2 text-sm">
                <span className="w-6 shrink-0 text-right text-tinta-3">{faixa}</span>
                <span
                  className="flex h-6 items-center justify-end rounded bg-ok px-2 text-xs font-semibold text-ink-fixed"
                  style={{ width: `${Math.max(8, (quantidade / maior) * 100)}%` }}
                >
                  {quantidade}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-5 text-xs text-tinta-3">
        A sequência é do jogo inteiro: vale terminar QUALQUER desafio no dia, e desistir também
        conta — o que se premia aqui é aparecer. Rodadas e acerto são deste modo e deste formato,
        que são decks diferentes. Tudo fica só neste navegador: não existe conta nem servidor
        guardando nada.
      </p>
    </Modal>
  )
}
