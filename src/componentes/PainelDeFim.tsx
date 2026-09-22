import { useState } from 'react'
import { compartilhar, textoDeCompartilhamento } from '../jogo/compartilhar'
import { fraseDeResolvidos } from '../jogo/contador'
import type { Formato } from '../jogo/formatos'
import type { Modo } from '../jogo/modos'
import type { Carta, IdDeModo, Pista } from '../jogo/tipos'
import { ContagemRegressiva } from './ContagemRegressiva'
import { ICONE } from './icones'
import { ImagemDaCarta } from './ImagemDaCarta'

interface Props {
  modo: Modo
  formato: Formato
  resposta: Carta
  venceu: boolean
  historico: Pista[][]
  dicasPedidas: number
  diaDificil: boolean
  /** Quantas pessoas resolveram hoje. `null` some da tela — ver jogo/contador.ts. */
  resolvedores: number | null
  cartaDeOntem: Carta | null
  quantidadeDePalpites: number
  numeroDoDesafio: number
  emTreino: boolean
  /** Primeiro modo que a pessoa ainda não fechou hoje, se sobrou algum. */
  proximoModo: Modo | null
  aoIrParaModo: (id: IdDeModo) => void
  aoTreinar: () => void
  aoVoltarParaODiario: () => void
}

export function PainelDeFim({
  modo,
  formato,
  resposta,
  venceu,
  historico,
  dicasPedidas,
  diaDificil,
  resolvedores,
  cartaDeOntem,
  quantidadeDePalpites,
  numeroDoDesafio,
  emTreino,
  proximoModo,
  aoIrParaModo,
  aoTreinar,
  aoVoltarParaODiario,
}: Props) {
  const [aviso, setAviso] = useState('')
  const resolvidos = fraseDeResolvidos(resolvedores, venceu)

  const aoCompartilhar = async () => {
    const texto = textoDeCompartilhamento({
      modo: `${modo.nome} · ${formato.nome}`,
      emojiDoModo: modo.emojiDeCompartilhamento,
      numeroDoDesafio,
      historico,
      dicasPedidas,
      diaDificil,
      venceu,
      endereco: window.location.origin + window.location.pathname,
    })
    const resultado = await compartilhar(texto)
    setAviso(
      resultado === 'copiado'
        ? 'Copiado. Cola no grupo.'
        : resultado === 'falhou'
          ? 'Seu navegador bloqueou a cópia — dá pra tirar print.'
          : '',
    )
  }

  return (
    <section className="painel space-y-4 p-4 text-center sm:p-5" aria-live="polite">
      {/*
        A carta é o prêmio, então ela é o que aparece primeiro e maior. A versão
        anterior punha o placar em cima e a arte de lado, do tamanho de um
        selo — quem acabou de acertar quer VER a carta, e é essa imagem que a
        pessoa printa pro grupo.
      */}
      <div className="space-y-2">
        <ImagemDaCarta
          carta={resposta}
          tamanho="carta"
          className="mx-auto h-56 w-[10rem] rounded-xl object-cover shadow-lg shadow-black/40 sm:h-64 sm:w-[11.4rem]"
        />
        <div>
          <p className="font-titulo text-lg leading-tight sm:text-xl">{resposta.nome}</p>
          <p className="text-sm text-tinta-3">
            {resposta.id} · {resposta.colecao.nome}
          </p>
          <p className="text-sm text-foil-text">{resposta.cores.join(' · ')}</p>
        </div>
      </div>

      <div className="border-t border-hairline pt-3">
        <h2 className="font-titulo text-lg sm:text-xl">
          {venceu
            ? `Acertei em ${quantidadeDePalpites} ${quantidadeDePalpites === 1 ? 'tentativa' : 'tentativas'}`
            : 'Essa era a carta de hoje'}
        </h2>

        <p className="mt-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${
              dicasPedidas === 0
                ? 'bg-ok-tint text-ok-strong ring-1 ring-ok-tint-border'
                : 'bg-surface text-tinta-3'
            }`}
          >
            {dicasPedidas === 0
              ? 'sem dica'
              : `com ${dicasPedidas} dica${dicasPedidas === 1 ? '' : 's'}`}
          </span>
          {diaDificil && (
            <span className="ml-1.5 inline-flex rounded-full bg-selo-tint px-2.5 py-1 text-[0.72rem] font-semibold text-selo-strong ring-1 ring-selo-tint-border">
              dia difícil
            </span>
          )}
        </p>

        {/*
          Sem linha nenhuma quando o contador não respondeu: "— pessoas
          resolveram" é pior que silêncio, e o jogo não depende dele.
        */}
        {resolvidos !== null && <p className="mt-2 text-sm text-tinta-3">{resolvidos}</p>}
      </div>

      {emTreino ? (
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={aoTreinar} className="botao-foil">
            <ICONE.treino aria-hidden="true" className="size-4" />
            Outra carta
          </button>
          <button type="button" onClick={aoVoltarParaODiario} className="botao-contorno">
            Voltar pro desafio do dia
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={aoCompartilhar} className="botao-foil">
              <ICONE.compartilhar aria-hidden="true" className="size-4" />
              Compartilhar
            </button>
            {proximoModo ? (
              <button
                type="button"
                onClick={() => aoIrParaModo(proximoModo.id)}
                className="botao-contorno"
              >
                Falta o {proximoModo.nome.toLowerCase()}
              </button>
            ) : (
              <button type="button" onClick={aoTreinar} className="botao-contorno">
                <ICONE.treino aria-hidden="true" className="size-4" />
                Treinar com carta aleatória
              </button>
            )}
          </div>
          {aviso !== '' && <p className="text-sm text-ok-strong">{aviso}</p>}

          <div className="space-y-1 border-t border-hairline pt-3">
            <ContagemRegressiva />
            {cartaDeOntem && (
              <p className="text-xs text-tinta-3">
                Ontem era <strong className="text-tinta">{cartaDeOntem.nome}</strong> (
                {cartaDeOntem.id}).
              </p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
