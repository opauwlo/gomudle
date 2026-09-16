import { CardRulesText } from 'optcg-card-rules'
import iconeDeContador from 'optcg-card-rules/counter.svg'
import { censurarNome } from '../jogo/dicas'
import type { Carta } from '../jogo/tipos'

export function PainelDeEfeito({ carta }: { carta: Carta }) {
  return (
    <figure className="painel px-4 py-5 sm:px-6 sm:py-6">
      <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-3">
        Efeito da carta do dia
      </figcaption>
      {/* Renderizado com os mesmos selos da carta: ler "[On Play]" como texto
          cru é bem menos reconhecível pra quem joga do que ver o selo azul.
          O link de traço vira texto puro — este jogo não tem busca pra onde ir. */}
      <blockquote className="text-base leading-relaxed text-tinta sm:text-lg">
        <CardRulesText
          text={censurarNome(carta.efeito, carta.nome)}
          counterIconSrc={iconeDeContador}
          renderSearchLink={({ children, className }) => (
            <span className={className}>{children}</span>
          )}
        />
      </blockquote>
      <p className="mt-3 text-xs text-tinta-3">
        O texto é o oficial, em inglês — só o nome da carta foi apagado.
      </p>
    </figure>
  )
}
