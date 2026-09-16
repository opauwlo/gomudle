import { describe, expect, it } from 'vitest'
import {
  guardarRodada,
  lerProgresso,
  progressoVazio,
  registrarFim,
  rodadaDeHoje,
  salvarProgresso,
  type Armazem,
} from './progresso'

const armazemFalso = (inicial: Record<string, string> = {}): Armazem => {
  const dados = { ...inicial }
  return {
    ler: (chave) => dados[chave] ?? null,
    gravar: (chave, valor) => {
      dados[chave] = valor
    },
  }
}

describe('lerProgresso', () => {
  it('devolve vazio quando não tem nada salvo', () => {
    expect(lerProgresso(armazemFalso())).toEqual(progressoVazio())
  })

  it('devolve vazio em vez de explodir com JSON corrompido', () => {
    expect(lerProgresso(armazemFalso({ 'gomudle:v1': '{quebrado' }))).toEqual(progressoVazio())
  })

  it('descarta formato de versão antiga', () => {
    const antigo = JSON.stringify({ versao: 0, rodadas: { 'lider:standard': {} } })
    expect(lerProgresso(armazemFalso({ 'gomudle:v1': antigo })).rodadas).toEqual({})
  })

  it('vai e volta pelo armazém', () => {
    const armazem = armazemFalso()
    const progresso = guardarRodada(progressoVazio(), 'lider:standard', {
      dia: '2026-09-16',
      palpites: ['OP01-001'],
      venceu: false,
    })
    salvarProgresso(armazem, progresso)
    expect(lerProgresso(armazem)).toEqual(progresso)
  })
})

describe('rodadaDeHoje', () => {
  const salvo = guardarRodada(progressoVazio(), 'lider:standard', {
    dia: '2026-09-16',
    palpites: ['OP01-001'],
    venceu: false,
  })

  it('devolve a rodada do dia', () => {
    expect(rodadaDeHoje(salvo, 'lider:standard', '2026-09-16')?.palpites).toEqual(['OP01-001'])
  })

  it('ignora rodada de ontem', () => {
    expect(rodadaDeHoje(salvo, 'lider:standard', '2026-09-17')).toBeNull()
  })

  it('não mistura modo nem formato', () => {
    expect(rodadaDeHoje(salvo, 'personagem:standard', '2026-09-16')).toBeNull()
    expect(rodadaDeHoje(salvo, 'lider:egb', '2026-09-16')).toBeNull()
  })
})

describe('registrarFim', () => {
  it('conta vitória e distribuição no modo, e marca o dia no hábito', () => {
    const p = registrarFim(progressoVazio(), 'personagem:standard', '2026-09-16', 4, true)
    expect(p.estatisticas['personagem:standard']).toMatchObject({
      jogos: 1,
      vitorias: 1,
      distribuicao: { '4': 1 },
    })
    expect(p.habito).toMatchObject({ sequencia: 1, melhorSequencia: 1, diasJogados: 1 })
  })

  it('não conta o mesmo dia duas vezes (F5 não infla estatística)', () => {
    let p = registrarFim(progressoVazio(), 'personagem:standard', '2026-09-16', 4, true)
    p = registrarFim(p, 'personagem:standard', '2026-09-16', 4, true)
    expect(p.estatisticas['personagem:standard']?.jogos).toBe(1)
    expect(p.habito.diasJogados).toBe(1)
  })

  // A sequência é do JOGO, não do modo: jogar dois modos no mesmo dia é um dia.
  it('dois modos no mesmo dia contam um dia só de sequência', () => {
    let p = registrarFim(progressoVazio(), 'personagem:standard', '2026-09-16', 4, true)
    p = registrarFim(p, 'lider:standard', '2026-09-16', 2, true)
    expect(p.habito.sequencia).toBe(1)
    expect(p.habito.diasJogados).toBe(1)
    expect(p.estatisticas['lider:standard']?.jogos).toBe(1)
  })

  it('formato diferente conta separado nas estatísticas', () => {
    let p = registrarFim(progressoVazio(), 'personagem:standard', '2026-09-16', 4, true)
    p = registrarFim(p, 'personagem:egb', '2026-09-16', 6, true)
    expect(p.estatisticas['personagem:standard']?.jogos).toBe(1)
    expect(p.estatisticas['personagem:egb']?.jogos).toBe(1)
  })

  it('emenda a sequência em dias seguidos', () => {
    let p = registrarFim(progressoVazio(), 'lider:standard', '2026-09-16', 2, true)
    p = registrarFim(p, 'arte:egb', '2026-09-17', 3, true)
    expect(p.habito.sequencia).toBe(2)
  })

  it('quebra a sequência quando pula um dia', () => {
    let p = registrarFim(progressoVazio(), 'lider:standard', '2026-09-16', 2, true)
    p = registrarFim(p, 'lider:standard', '2026-09-18', 3, true)
    expect(p.habito).toMatchObject({ sequencia: 1, melhorSequencia: 1, diasJogados: 2 })
  })

  // Quem desistiu apareceu: a sequência premia o hábito, não o acerto.
  it('desistir mantém a sequência viva, mas não conta vitória', () => {
    let p = registrarFim(progressoVazio(), 'lider:standard', '2026-09-16', 2, true)
    p = registrarFim(p, 'lider:standard', '2026-09-17', 9, false)
    expect(p.habito.sequencia).toBe(2)
    expect(p.estatisticas['lider:standard']).toMatchObject({ jogos: 2, vitorias: 1 })
  })

  it('guarda a melhor sequência mesmo depois de zerar', () => {
    let p = registrarFim(progressoVazio(), 'lider:standard', '2026-09-16', 2, true)
    p = registrarFim(p, 'lider:standard', '2026-09-17', 2, true)
    p = registrarFim(p, 'lider:standard', '2026-09-20', 3, true)
    expect(p.habito).toMatchObject({ sequencia: 1, melhorSequencia: 2 })
  })

  it('joga palpite alto na faixa 8+', () => {
    const p = registrarFim(progressoVazio(), 'arte:egb', '2026-09-16', 11, true)
    expect(p.estatisticas['arte:egb']?.distribuicao).toEqual({ '8+': 1 })
  })
})
