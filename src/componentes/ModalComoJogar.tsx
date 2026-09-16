import { FORMATOS } from '../jogo/formatos'
import { MODOS } from '../jogo/modos'
import { ICONE } from './icones'
import { Modal } from './Modal'

export function ModalComoJogar({ aoFechar }: { aoFechar: () => void }) {
  return (
    <Modal titulo="Como jogar" aoFechar={aoFechar}>
      <div className="space-y-4 text-sm leading-relaxed text-tinta">
        <p>
          Todo dia, quatro cartas do One Piece Card Game entram em jogo — uma por modo. Chute
          quantas vezes precisar; não tem limite de palpite.
        </p>

        <div>
          <h3 className="mb-1.5 font-semibold text-tinta">A grade</h3>
          <ul className="space-y-1.5">
            <li className="flex gap-2">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-ok text-ink-fixed">
                <ICONE.acerto aria-hidden="true" className="size-3.5" />
              </span>
              <span>Verde: igualzinho à carta do dia.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-foil text-ink-fixed">
                <ICONE.quase aria-hidden="true" className="size-3.5" />
              </span>
              <span>
                Amarelo: chegou perto. Numa lista (cor, atributo, traços) significa que uma parte
                bate; num número, que a diferença é de um degrau — 1 de custo, 1.000 de poder.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-surface">
                <ICONE.maior aria-hidden="true" className="size-3.5" />
              </span>
              <span>A seta aponta pro lado da resposta: pra cima é maior, pra baixo é menor.</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-1.5 font-semibold text-tinta">Os formatos</h3>
          <ul className="space-y-1.5">
            {FORMATOS.map((formato) => (
              <li key={formato.id}>
                <strong className="text-tinta">{formato.nome}</strong> — {formato.resumo}.
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-tinta-3">
            Cada formato tem a própria carta do dia e a própria sequência: são decks diferentes.
          </p>
        </div>

        <div>
          <h3 className="mb-1.5 font-semibold text-tinta">Os modos</h3>
          <ul className="space-y-1.5">
            {MODOS.map((modo) => (
              <li key={modo.id}>
                <strong className="text-tinta">{modo.nome}</strong> — {modo.comoJoga}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-tinta-3">
          O deck tem líderes e personagens SR/SEC das coleções numeradas (OP, ST, EB, PRB). Arte
          alternativa não entra: é a mesma carta com outro desenho.
        </p>
      </div>
    </Modal>
  )
}
