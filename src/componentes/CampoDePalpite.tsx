import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { buscarCartas } from '../jogo/cartas'
import type { Carta } from '../jogo/tipos'
import { TINTA_DA_COR } from './cores'
import { ImagemDaCarta } from './ImagemDaCarta'

const LIMITE = 12

interface Props {
  deck: Carta[]
  jaChutados: string[]
  aoChutar: (carta: Carta) => void
  /** Ex.: "311 personagens SR e SEC" — aparece quando a busca não acha nada. */
  descricaoDoDeck: string
  desabilitado?: boolean
}

/**
 * Combobox de digitar-e-escolher. É escrito na mão em vez de `<datalist>`
 * porque a lista precisa mostrar arte, coleção e cores — sem isso não dá pra
 * escolher entre os 42 "Monkey.D.Luffy" nem entre as 9 "Nami" do jogo.
 */
export function CampoDePalpite({
  deck,
  jaChutados,
  aoChutar,
  descricaoDoDeck,
  desabilitado = false,
}: Props) {
  const [termo, setTermo] = useState('')
  const [aberto, setAberto] = useState(false)
  const [destaque, setDestaque] = useState(0)
  const idLista = useId()
  const caixa = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLUListElement>(null)

  const { sugestoes, total } = useMemo(() => {
    const achado = buscarCartas(deck, termo, LIMITE + jaChutados.length)
    const sobraram = achado.cartas.filter((carta) => !jaChutados.includes(carta.id))
    return {
      sugestoes: sobraram.slice(0, LIMITE),
      total: achado.total - (achado.cartas.length - sobraram.length),
    }
  }, [deck, termo, jaChutados])

  useEffect(() => setDestaque(0), [termo])

  // Mantém o item destacado à vista: a lista rola, e navegar de seta até um
  // item fora da área visível daria a impressão de que o teclado travou.
  useEffect(() => {
    lista.current?.children[destaque]?.scrollIntoView({ block: 'nearest' })
  }, [destaque])

  // Clicar fora fecha. Sem isso a lista fica pendurada por cima da grade.
  useEffect(() => {
    const aoClicar = (evento: MouseEvent) => {
      if (!caixa.current?.contains(evento.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', aoClicar)
    return () => document.removeEventListener('mousedown', aoClicar)
  }, [])

  const escolher = (carta: Carta | undefined) => {
    if (!carta) return
    aoChutar(carta)
    setTermo('')
    setAberto(false)
  }

  const aoTeclar = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      if (sugestoes.length === 0) return
      setAberto(true)
      const passo = evento.key === 'ArrowDown' ? 1 : -1
      setDestaque((atual) => (atual + passo + sugestoes.length) % sugestoes.length)
      return
    }
    if (evento.key === 'Enter') {
      evento.preventDefault()
      escolher(sugestoes[destaque])
      return
    }
    if (evento.key === 'Escape') setAberto(false)
  }

  const mostrarPainel = aberto && termo.trim() !== ''
  const escondidas = total - sugestoes.length

  return (
    <div ref={caixa} className="relative">
      <input
        type="text"
        value={termo}
        disabled={desabilitado}
        onChange={(e) => {
          setTermo(e.target.value)
          setAberto(true)
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={aoTeclar}
        placeholder={desabilitado ? 'Rodada encerrada' : 'Chuta uma carta: nome ou código'}
        className="w-full rounded-xl border border-hairline bg-surface-1 px-4 py-3.5 text-base text-tinta placeholder:text-tinta-3 disabled:opacity-50"
        role="combobox"
        aria-expanded={mostrarPainel && sugestoes.length > 0}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={mostrarPainel && sugestoes[destaque] ? `${idLista}-${destaque}` : undefined}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
      />

      {mostrarPainel && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-hairline bg-surface shadow-2xl shadow-black/60">
          {sugestoes.length === 0 ? (
            <p className="px-3 py-3 text-sm text-tinta-3">
              Não achei. Aqui entram {descricaoDoDeck}.
            </p>
          ) : (
            <>
              <ul ref={lista} id={idLista} role="listbox" className="max-h-[22rem] overflow-y-auto">
                {sugestoes.map((carta, indice) => (
                  <li key={carta.id} id={`${idLista}-${indice}`} role="option" aria-selected={indice === destaque}>
                    <button
                      type="button"
                      onClick={() => escolher(carta)}
                      onMouseEnter={() => setDestaque(indice)}
                      className={`flex w-full items-center gap-2.5 px-2.5 py-2 text-left ${
                        indice === destaque ? 'bg-surface' : ''
                      }`}
                    >
                      <ImagemDaCarta
                        carta={carta}
                        compacta
                        className="h-14 w-10 shrink-0 rounded object-cover object-top"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{carta.nome}</span>
                        <span className="block truncate text-xs text-tinta-3">
                          {carta.id} · {carta.colecao.nome}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-tinta-3">
                          <span className="flex gap-1" aria-hidden="true">
                            {carta.cores.map((cor) => (
                              <span
                                key={cor}
                                className="size-2.5 rounded-full ring-1 ring-hairline"
                                style={{ background: TINTA_DA_COR[cor] ?? '#64748b' }}
                              />
                            ))}
                          </span>
                          {carta.tipo === 'lider'
                            ? `${carta.vida} de vida`
                            : `custo ${carta.custo}`}{' '}
                          · {carta.poder.toLocaleString('pt-BR')} de poder
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {escondidas > 0 && (
                <p className="border-t border-hairline px-3 py-2 text-xs text-tinta-3">
                  e mais {escondidas} — escreva o código ou a coleção pra afinar
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
