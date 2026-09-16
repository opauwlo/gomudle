import { describe, expect, it } from 'vitest'
import { buscarCartas, chaveDeBusca, TODAS_AS_CARTAS } from './cartas'
import { MODOS } from './modos'

describe('chaveDeBusca', () => {
  it('normaliza pontuação e acento', () => {
    expect(chaveDeBusca('Monkey.D.Luffy')).toBe(chaveDeBusca('Monkey D. Luffy'))
    expect(chaveDeBusca('Coração')).toBe('coracao')
  })
})

describe('buscarCartas', () => {
  const ids = (texto: string, limite?: number) =>
    buscarCartas(TODAS_AS_CARTAS, texto, limite).cartas.map((carta) => carta.id)

  it('acha por nome mesmo com a pontuação errada', () => {
    expect(ids('monkey d luffy').length).toBeGreaterThan(0)
  })

  it('traz todas as cartas de mesmo nome, não só a primeira', () => {
    const namis = buscarCartas(TODAS_AS_CARTAS, 'nami', 50)
    expect(namis.cartas.length).toBeGreaterThan(5)
    expect(namis.cartas.every((carta) => /nami/i.test(carta.nome))).toBe(true)
  })

  it('acha pelo código, com ou sem hífen, em qualquer caixa', () => {
    expect(ids('OP02-036')[0]).toBe('OP02-036')
    expect(ids('op02-036')[0]).toBe('OP02-036')
    expect(ids('op02036')[0]).toBe('OP02-036')
  })

  it('põe o código exato na frente de quem só começa igual', () => {
    expect(ids('OP02-036')[0]).toBe('OP02-036')
  })

  it('aceita código e nome juntos, que é como a pessoa fala da carta', () => {
    expect(ids('op02-036 nami')).toEqual(['OP02-036'])
    expect(ids('nami op02-036')).toEqual(['OP02-036'])
  })

  it('aceita coleção e nome juntos', () => {
    const achado = buscarCartas(TODAS_AS_CARTAS, 'op11 nami', 50).cartas
    expect(achado.length).toBeGreaterThan(0)
    expect(achado.every((carta) => carta.id.startsWith('OP11') && /nami/i.test(carta.nome))).toBe(true)
  })

  it('não casa quando um dos termos não bate', () => {
    expect(ids('op02-036 zoro')).toEqual([])
  })

  it('devolve lista vazia pra termo vazio', () => {
    expect(ids('  ')).toEqual([])
  })

  it('respeita o limite mas conta o total de verdade', () => {
    const achado = buscarCartas(TODAS_AS_CARTAS, 'luffy', 5)
    expect(achado.cartas.length).toBe(5)
    expect(achado.total).toBeGreaterThan(5)
  })

  it('só olha o deck que recebeu', () => {
    const lideres = TODAS_AS_CARTAS.filter((carta) => carta.tipo === 'lider')
    const achado = buscarCartas(lideres, 'nami', 50).cartas
    expect(achado.length).toBeGreaterThan(0)
    expect(achado.every((carta) => carta.tipo === 'lider')).toBe(true)
  })
})

describe('dados gerados', () => {
  it('não tem id repetido', () => {
    expect(new Set(TODAS_AS_CARTAS.map((c) => c.id)).size).toBe(TODAS_AS_CARTAS.length)
  })

  it('tem cor, poder e coleção em toda carta', () => {
    for (const carta of TODAS_AS_CARTAS) {
      expect(carta.cores.length, carta.id).toBeGreaterThan(0)
      expect(typeof carta.poder, carta.id).toBe('number')
      expect(carta.colecao.codigo, carta.id).toMatch(/^(OP|ST|EB|PRB)-\d+$/)
    }
  })

  it('separa custo de líder e de personagem', () => {
    for (const carta of TODAS_AS_CARTAS) {
      if (carta.tipo === 'lider') expect(carta.custo, carta.id).toBeNull()
      else expect(carta.vida, carta.id).toBeNull()
    }
  })

  it('deixa todo modo com deck grande o bastante pra um ano', () => {
    for (const modo of MODOS) expect(modo.deck.length, modo.id).toBeGreaterThan(100)
  })
})
