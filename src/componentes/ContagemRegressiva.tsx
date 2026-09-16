import { useEffect, useState } from 'react'
import { formatarContagem, msAteVirar } from '../jogo/dia'

/** Relógio até o próximo desafio. Zerou, recarrega: é dia novo, carta nova. */
export function ContagemRegressiva() {
  const [restante, setRestante] = useState(() => msAteVirar())

  useEffect(() => {
    const relogio = setInterval(() => {
      const falta = msAteVirar()
      setRestante(falta)
      if (falta <= 0) window.location.reload()
    }, 1000)
    return () => clearInterval(relogio)
  }, [])

  return (
    <p className="text-sm text-tinta-3">
      Próxima carta em <span className="font-mono text-foil-text">{formatarContagem(restante)}</span>
    </p>
  )
}
