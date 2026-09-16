import { ICONE } from './icones'

/**
 * A legenda das marcas, no lugar de abrir um modal de texto na cara de quem
 * chegou — o jeito mais rápido de fazer alguém fechar sem ler.
 *
 * Desde que a grade passou a mostrar só a marca, isto aqui é o que ensina o
 * jogo: são quatro símbolos e uma linha cada. Some sozinha depois do primeiro
 * dia jogado.
 */
export function ExemploDeLinha() {
  const marcas = [
    { classe: 'pastilha-acerto', Icone: ICONE.acerto, diz: 'igual' },
    { classe: 'pastilha-quase', Icone: ICONE.quase, diz: 'quase' },
    { classe: 'pastilha-quase', Icone: ICONE.maior, diz: 'é maior' },
    { classe: 'pastilha-erro', Icone: ICONE.erro, diz: 'diferente' },
  ]

  return (
    <section className="painel px-3 py-2.5">
      <h2 className="rotulo mb-2">Como ler a grade</h2>
      <ul className="grid grid-cols-4 gap-1.5">
        {marcas.map((marca) => (
          <li key={marca.diz} className="space-y-1">
            <div className={`pastilha ${marca.classe}`}>
              <marca.Icone aria-hidden="true" className="size-[1.15rem]" strokeWidth={2.75} />
            </div>
            <p className="text-center text-[0.7rem] leading-tight text-tinta-3">{marca.diz}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-tinta-3">
        A coluna diz o que foi comparado. Como você escolheu a carta, o símbolo basta: ✕ em Cor
        quer dizer que a cor dela não é a do dia.
      </p>
    </section>
  )
}
