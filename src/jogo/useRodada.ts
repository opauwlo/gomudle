import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { diaDificil } from './candidatas'
import { acharPorId } from './cartas'
import { chaveDoDesafio, contarResolvidos } from './contador'
import { compararCarta } from './comparar'
import { diaDoJogo, numeroDoDesafio } from './dia'
import type { Formato } from './formatos'
import { deckDoModo, MODOS, type Modo } from './modos'
import {
  armazemDoNavegador,
  estatisticasVazias,
  guardarRodada,
  lerProgresso,
  marcarContabilizada,
  registrarFim,
  rodadaDeHoje,
  salvarProgresso,
  type Estatisticas,
  type Habito,
  type Progresso,
} from './progresso'
import { dicasDoModo } from './dicas'
import {
  aplicarPalpite,
  encerrouRodada,
  pedirDica as pedirDicaNoEstado,
  usouDica,
  venceuRodada,
  type EstadoDaRodada,
} from './rodada'
import { cartaAleatoria, cartaDoDia } from './sorteio'
import type { Carta, Pista } from './tipos'

export interface Rodada {
  dia: string
  numeroDoDesafio: number
  /** O deck já filtrado pelo formato: é ele que a busca e o treino usam. */
  deck: Carta[]
  resposta: Carta
  palpites: Carta[]
  historico: Pista[][]
  venceu: boolean
  encerrada: boolean
  emTreino: boolean
  dicasPedidas: number
  usouDica: boolean
  pedirDica: () => void
  /**
   * Quantas pessoas já resolveram ESTE desafio hoje. `null` enquanto não
   * chegou — e também quando não vai chegar: contador fora do ar não vira
   * recado de erro na tela.
   */
  resolvedores: number | null
  /** A carta de ontem, pra fechar o ciclo de quem volta. */
  cartaDeOntem: Carta | null
  /** A carta de hoje tem sósia: a grade sozinha não resolve. */
  diaDificil: boolean
  /** Como cada modo do formato atual está hoje. */
  resumoDoDia: Record<string, 'ganhou' | 'perdeu' | null>
  estatisticas: Estatisticas
  habito: Habito
  chutar: (carta: Carta) => void
  desistir: () => void
  treinar: () => void
  voltarParaODiario: () => void
}

/**
 * Desafios que ESTA PÁGINA já pediu ao contador.
 *
 * Trava de dedo duplo, e ela não é opcional: o `StrictMode` roda todo efeito
 * duas vezes em desenvolvimento, e sem isto cada acerto somaria 2 no número que
 * todo mundo vê. O estado do React não serve de trava porque as duas execuções
 * acontecem antes de qualquer re-renderização.
 */
const jaPedidos = new Set<string>()

/**
 * Estado de uma rodada. A rodada diária vive no localStorage — recarregar a
 * página no meio de dez palpites e perder tudo seria o bug mais óbvio do jogo.
 * O treino é de propósito volátil: é pra queimar cartas sem sujar estatística.
 */
export function useRodada(modo: Modo, formato: Formato): Rodada {
  const armazem = useMemo(armazemDoNavegador, [])
  const [progresso, setProgresso] = useState<Progresso>(() => lerProgresso(armazem))
  const [treino, setTreino] = useState<{ resposta: Carta; estado: EstadoDaRodada } | null>(null)

  const dia = diaDoJogo()
  const numero = numeroDoDesafio(dia)
  // Deck, sorteio e progresso são por modo E formato: a carta do dia do
  // Standard não é a mesma do EGB, e a sequência de um não conta pro outro.
  const chave = `${modo.id}:${formato.id}`
  const deck = useMemo(() => deckDoModo(modo, formato), [modo, formato])
  const salva = rodadaDeHoje(progresso, chave, dia)

  const sorteada = useMemo(() => cartaDoDia(deck, chave, numero), [deck, chave, numero])
  // A resposta de hoje é a que FICOU SALVA, quando existe — o sorteio só entra
  // quando o dia ainda não começou. Ver `RodadaSalva.resposta`: recalcular
  // fazia o dia mudar embaixo de quem já estava jogando toda vez que o deck
  // mudava, porque a permutação do sorteio se reordena junto com ele.
  const respostaDoDia = useMemo(() => {
    const fixada = salva?.resposta != null ? acharPorId(deck, salva.resposta) : undefined
    return fixada ?? sorteada
  }, [deck, salva?.resposta, sorteada])

  const emTreino = treino !== null
  const resposta = treino?.resposta ?? respostaDoDia
  const estado: EstadoDaRodada = treino?.estado ?? {
    palpites: salva?.palpites ?? [],
    desistiu: salva?.desistiu ?? false,
    dicasPedidas: salva?.dicasPedidas ?? 0,
  }

  const palpites = useMemo(
    () =>
      estado.palpites
        .map((id) => acharPorId(deck, id))
        .filter((carta): carta is Carta => carta != null),
    [estado.palpites, deck],
  )

  const historico = useMemo(
    () => palpites.map((palpite) => compararCarta(modo.colunas, palpite, resposta)),
    [palpites, modo.colunas, resposta],
  )

  const venceu = venceuRodada(estado, resposta.id)
  const encerrada = encerrouRodada(estado, resposta.id)

  const dificil = useMemo(
    () => diaDificil(deck, modo.colunas, resposta),
    [deck, modo.colunas, resposta],
  )

  // Só faz sentido no desafio do dia: no treino não existe "ontem".
  const cartaDeOntem = useMemo(
    () => (numero > 1 && !emTreino ? cartaDoDia(deck, chave, numero - 1) : null),
    [deck, chave, emTreino, numero],
  )

  const resumoDoDia = useMemo(() => {
    const mapa: Record<string, 'ganhou' | 'perdeu' | null> = {}
    for (const outro of MODOS) {
      const salvaDele = rodadaDeHoje(progresso, `${outro.id}:${formato.id}`, dia)
      mapa[outro.id] = salvaDele == null ? null : salvaDele.venceu ? 'ganhou' : salvaDele.desistiu ? 'perdeu' : null
    }
    return mapa
  }, [dia, formato.id, progresso])

  const gravar = useCallback(
    (novo: Progresso) => {
      setProgresso(novo)
      salvarProgresso(armazem, novo)
    },
    [armazem],
  )

  // O contador responde depois, e o `progresso` que o efeito fechou por cima já
  // pode estar velho. A marcação vai pelo mais recente.
  const progressoAtual = useRef(progresso)
  useEffect(() => {
    progressoAtual.current = progresso
  })

  /**
   * Quantas pessoas resolveram o desafio de hoje (ver `jogo/contador.ts`).
   *
   * Só acontece com a rodada encerrada: durante o jogo o número não ajuda em
   * nada e ainda mete pressão. Quem venceu soma 1 e lê o total; quem desistiu
   * (ou já tinha somado antes do F5) só lê.
   *
   * O resultado carrega de qual desafio ele é: trocar de modo com a resposta
   * voando mostraria o número do modo anterior debaixo da carta do novo.
   */
  const [contagem, setContagem] = useState<{ de: string; valor: number | null }>({
    de: '',
    valor: null,
  })

  useEffect(() => {
    if (emTreino || !encerrada) return
    const desafio = chaveDoDesafio(modo.id, formato.id, dia)
    if (jaPedidos.has(desafio)) return
    jaPedidos.add(desafio)

    const registrar = venceu && salva?.contabilizada !== true
    void contarResolvidos(desafio, registrar).then((valor) => {
      setContagem({ de: desafio, valor })
      // A marca só entra quando o serviço respondeu: pedido que falhou não foi
      // contado, e a próxima carga da página precisa tentar de novo.
      if (registrar && valor !== null) {
        gravar(marcarContabilizada(progressoAtual.current, chave, dia))
      }
    })
  }, [chave, dia, emTreino, encerrada, formato.id, gravar, modo.id, salva?.contabilizada, venceu])

  const chutar = useCallback(
    (carta: Carta) => {
      const proximo = aplicarPalpite(estado, carta.id, resposta.id)
      if (proximo === estado) return

      if (treino) {
        setTreino({ ...treino, estado: proximo })
        return
      }

      const ganhou = venceuRodada(proximo, resposta.id)
      let atualizado = guardarRodada(progresso, chave, {
        dia,
        resposta: resposta.id,
        palpites: proximo.palpites,
        venceu: ganhou,
        dicasPedidas: proximo.dicasPedidas,
      })
      if (ganhou) atualizado = registrarFim(atualizado, chave, dia, proximo.palpites.length, true)
      gravar(atualizado)
    },
    [chave, dia, estado, gravar, progresso, resposta.id, treino],
  )

  // Desistir fecha o dia como derrota. Existe porque sem limite de palpites a
  // pessoa que travou ficaria presa no mesmo desafio pra sempre.
  const desistir = useCallback(() => {
    if (encerrada) return
    if (treino) {
      setTreino({ ...treino, estado: { ...treino.estado, desistiu: true } })
      return
    }
    const comDerrota = guardarRodada(progresso, chave, {
      dia,
      resposta: resposta.id,
      palpites: estado.palpites,
      venceu: false,
      desistiu: true,
      dicasPedidas: estado.dicasPedidas,
    })
    gravar(registrarFim(comDerrota, chave, dia, estado.palpites.length, false))
  }, [chave, dia, encerrada, estado.palpites, gravar, progresso, resposta.id, treino])

  const pedirDica = useCallback(() => {
    const disponiveis = dicasDoModo(resposta, modo.id).length
    const proximo = pedirDicaNoEstado(estado, disponiveis)
    if (proximo === estado) return

    if (treino) {
      setTreino({ ...treino, estado: proximo })
      return
    }
    gravar(
      guardarRodada(progresso, chave, {
        dia,
        palpites: proximo.palpites,
        venceu: false,
        dicasPedidas: proximo.dicasPedidas,
      }),
    )
  }, [chave, dia, estado, gravar, modo.id, progresso, resposta, treino])

  const treinar = useCallback(() => {
    setTreino({
      resposta: cartaAleatoria(deck),
      estado: { palpites: [], desistiu: false, dicasPedidas: 0 },
    })
  }, [deck])

  return {
    dia,
    numeroDoDesafio: numero,
    deck,
    resposta,
    palpites,
    historico,
    venceu,
    encerrada,
    emTreino,
    dicasPedidas: estado.dicasPedidas,
    usouDica: usouDica(estado),
    pedirDica,
    resolvedores: contagem.de === chaveDoDesafio(modo.id, formato.id, dia) ? contagem.valor : null,
    cartaDeOntem,
    diaDificil: dificil,
    resumoDoDia,
    estatisticas: progresso.estatisticas[chave] ?? estatisticasVazias(),
    habito: progresso.habito,
    chutar,
    desistir,
    treinar,
    voltarParaODiario: () => setTreino(null),
  }
}
