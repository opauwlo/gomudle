import { useEffect, useRef } from 'react'

interface Props {
  titulo: string
  aoFechar: () => void
  children: React.ReactNode
}

export function Modal({ titulo, aoFechar, children }: Props) {
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    caixa.current?.focus()
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aoFechar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={aoFechar}
    >
      <div
        ref={caixa}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(evento) => evento.stopPropagation()}
        className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-hairline bg-surface-1 p-5 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-lg px-2 py-1 text-xl leading-none text-tinta-3 hover:bg-surface"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
