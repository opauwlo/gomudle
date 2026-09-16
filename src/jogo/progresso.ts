import { numeroDoDesafio } from './dia'

export interface RodadaSalva {
  dia: string
  /** Ids das cartas chutadas, na ordem. */
  palpites: string[]
  venceu: boolean
  /** Quem desistiu encerrou o dia sem vitória — ver jogo/rodada.ts. */
  desistiu?: boolean
  /** Quantas dicas foram pedidas nessa rodada. */
  dicasPedidas?: number
}

export interface Estatisticas {
  jogos: number
  vitorias: number
  /** Último dia já contabilizado aqui. Existe só pra F5 não inflar o número. */
  ultimoDiaContado: string | null
  /** Quantos palpites até acertar: chaves '1'…'7' e '8+'. */
  distribuicao: Record<string, number>
}

/**
 * A sequência é UMA, do jogo inteiro, e conta dia em que a pessoa terminou
 * qualquer desafio — ganhando ou desistindo.
 *
 * Era uma por modo e por formato, o que dava oito sequências paralelas. Isso é
 * o contrário do que uma sequência serve: ela vale porque dói perder, e só dói
 * se der pra proteger. Oito sequências frágeis viram zero sequência — a pessoa
 * perde uma na primeira semana e para de olhar pro número.
 */
export interface Habito {
  sequencia: number
  melhorSequencia: number
  ultimoDia: string | null
  diasJogados: number
}

/**
 * A chave é `modo:formato` — "personagem:standard". Standard e EGB são decks
 * diferentes, então são jogos diferentes: sequência e distribuição de cada um
 * contam separado.
 */
export type ChaveDeJogo = string

export interface Progresso {
  versao: 1
  rodadas: Record<ChaveDeJogo, RodadaSalva | undefined>
  estatisticas: Record<ChaveDeJogo, Estatisticas | undefined>
  habito: Habito
}

export interface Armazem {
  ler(chave: string): string | null
  gravar(chave: string, valor: string): void
}

export const CHAVE = 'gomudle:v1'

export const estatisticasVazias = (): Estatisticas => ({
  jogos: 0,
  vitorias: 0,
  ultimoDiaContado: null,
  distribuicao: {},
})

export const habitoVazio = (): Habito => ({
  sequencia: 0,
  melhorSequencia: 0,
  ultimoDia: null,
  diasJogados: 0,
})

export const progressoVazio = (): Progresso => ({
  versao: 1,
  rodadas: {},
  estatisticas: {},
  habito: habitoVazio(),
})

/**
 * localStorage quebra em aba anônima e com cookies bloqueados, e quebrar ali
 * derrubaria o jogo inteiro por causa de estatística. Toda leitura e escrita
 * passa por aqui e falha em silêncio: sem histórico, o jogo ainda joga.
 */
export const armazemDoNavegador = (): Armazem => ({
  ler(chave) {
    try {
      return globalThis.localStorage?.getItem(chave) ?? null
    } catch {
      return null
    }
  },
  gravar(chave, valor) {
    try {
      globalThis.localStorage?.setItem(chave, valor)
    } catch {
      /* sem persistência nesta sessão, e tudo bem */
    }
  },
})

export function lerProgresso(armazem: Armazem): Progresso {
  const cru = armazem.ler(CHAVE)
  if (!cru) return progressoVazio()
  try {
    const salvo = JSON.parse(cru) as Progresso
    if (salvo?.versao !== 1) return progressoVazio()
    return {
      versao: 1,
      rodadas: salvo.rodadas ?? {},
      estatisticas: salvo.estatisticas ?? {},
      habito: { ...habitoVazio(), ...salvo.habito },
    }
  } catch {
    return progressoVazio()
  }
}

export function salvarProgresso(armazem: Armazem, progresso: Progresso): void {
  armazem.gravar(CHAVE, JSON.stringify(progresso))
}

export const faixaDePalpites = (quantidade: number): string =>
  quantidade >= 8 ? '8+' : String(quantidade)

/** Guarda a rodada em andamento. Recarregar a página não pode perder palpite. */
export function guardarRodada(
  progresso: Progresso,
  chave: ChaveDeJogo,
  rodada: RodadaSalva,
): Progresso {
  return { ...progresso, rodadas: { ...progresso.rodadas, [chave]: rodada } }
}

/** Rodada salva do modo, se for do dia de hoje. Rodada de ontem é lixo. */
export function rodadaDeHoje(
  progresso: Progresso,
  chave: ChaveDeJogo,
  dia: string,
): RodadaSalva | null {
  const salva = progresso.rodadas[chave]
  return salva && salva.dia === dia ? salva : null
}

/**
 * Fecha a rodada: conta nas estatísticas daquele modo e marca o dia no hábito.
 * Só conta uma vez por dia por modo — a tela chama isso na hora do acerto, e um
 * F5 depois não pode inflar o número de jogos.
 */
export function registrarFim(
  progresso: Progresso,
  chave: ChaveDeJogo,
  dia: string,
  palpites: number,
  venceu: boolean,
): Progresso {
  const atual = progresso.estatisticas[chave] ?? estatisticasVazias()
  if (atual.ultimoDiaContado === dia) return progresso

  const estatisticas: Estatisticas = {
    jogos: atual.jogos + 1,
    vitorias: atual.vitorias + (venceu ? 1 : 0),
    ultimoDiaContado: dia,
    distribuicao: venceu
      ? {
          ...atual.distribuicao,
          [faixaDePalpites(palpites)]: (atual.distribuicao[faixaDePalpites(palpites)] ?? 0) + 1,
        }
      : atual.distribuicao,
  }

  return {
    ...progresso,
    estatisticas: { ...progresso.estatisticas, [chave]: estatisticas },
    habito: marcarDia(progresso.habito, dia),
  }
}

/** Desistir também conta como dia jogado: a sequência premia aparecer. */
export function marcarDia(habito: Habito, dia: string): Habito {
  if (habito.ultimoDia === dia) return habito
  const emendou =
    habito.ultimoDia != null && numeroDoDesafio(dia) - numeroDoDesafio(habito.ultimoDia) === 1
  const sequencia = emendou ? habito.sequencia + 1 : 1
  return {
    sequencia,
    melhorSequencia: Math.max(habito.melhorSequencia, sequencia),
    ultimoDia: dia,
    diasJogados: habito.diasJogados + 1,
  }
}
