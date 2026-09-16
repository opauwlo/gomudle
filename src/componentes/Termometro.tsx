import { useEffect, useState } from 'react'

interface Props {
  candidatas: number
  total: number
  palpites: number
}

/**
 * "Sobraram 41 de 702 cartas."
 *
 * É a mudança que transforma palpite errado em progresso visível. Sem esse
 * número, o segundo chute errado parece igual ao primeiro e a rodada vira
 * tentativa e erro; com ele, a pessoa vê o cerco fechar e entende que a grade
 * está trabalhando — que é o prazer que esse tipo de jogo vende.
 *
 * Mostra a CONTA, nunca a lista: ver quais cartas sobraram acabaria com o jogo.
 */
export function Termometro({ candidatas, total, palpites }: Props) {
  const [bateu, setBateu] = useState(false)

  useEffect(() => {
    if (palpites === 0) return
    setBateu(true)
    const t = setTimeout(() => setBateu(false), 500)
    return () => clearTimeout(t)
  }, [candidatas, palpites])

  if (palpites === 0) return null

  const fatia = Math.max(1.5, (candidatas / total) * 100)
  const quase = candidatas <= 5

  return (
    <div aria-live="polite" className="space-y-1.5">
      <p className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-tinta-3">
          {candidatas === 1 ? 'Sobrou' : 'Sobraram'}{' '}
          <span
            className={`font-titulo text-base ${quase ? 'text-ok-strong' : 'text-foil-text'} ${
              bateu ? 'anima-bater inline-block' : 'inline-block'
            }`}
          >
            {candidatas}
          </span>{' '}
          {candidatas === 1 ? 'carta possível' : `de ${total} cartas`}
        </span>
        {quase && <span className="text-xs text-ok-strong">tá quente</span>}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full transition-all duration-500 ${quase ? 'bg-ok' : 'bg-foil'}`}
          style={{ width: `${fatia}%` }}
        />
      </div>
    </div>
  )
}
