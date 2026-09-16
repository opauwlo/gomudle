import { describe, expect, it } from 'vitest'
import { diaDoJogo, formatarContagem, msAteVirar, numeroDoDesafio } from './dia'

describe('diaDoJogo', () => {
  it('usa o calendário de Brasília, não o UTC', () => {
    // 02:30 UTC ainda é ontem às 23:30 em São Paulo.
    expect(diaDoJogo(new Date('2026-09-16T02:30:00Z'))).toBe('2026-09-15')
    expect(diaDoJogo(new Date('2026-09-16T03:30:00Z'))).toBe('2026-09-16')
  })
})

describe('numeroDoDesafio', () => {
  it('começa em 1 no dia da época', () => {
    expect(numeroDoDesafio('2026-01-01')).toBe(1)
  })

  it('anda de um em um', () => {
    expect(numeroDoDesafio('2026-01-02') - numeroDoDesafio('2026-01-01')).toBe(1)
    expect(numeroDoDesafio('2027-01-01') - numeroDoDesafio('2026-01-01')).toBe(365)
  })
})

describe('msAteVirar', () => {
  it('devolve o que falta pra meia-noite de Brasília', () => {
    // 23:30 UTC = 20:30 em São Paulo, faltam 3h30 pra virar.
    expect(msAteVirar(new Date('2026-09-16T23:30:00Z'))).toBe(3.5 * 60 * 60 * 1000)
  })

  it('nunca passa de 24h nem fica negativo', () => {
    for (const hora of ['00:00', '03:00', '12:00', '23:59']) {
      const ms = msAteVirar(new Date(`2026-06-10T${hora}:00Z`))
      expect(ms).toBeGreaterThan(0)
      expect(ms).toBeLessThanOrEqual(86_400_000)
    }
  })
})

describe('formatarContagem', () => {
  it('escreve hh:mm:ss', () => {
    expect(formatarContagem(3.5 * 60 * 60 * 1000)).toBe('03:30:00')
    expect(formatarContagem(0)).toBe('00:00:00')
    expect(formatarContagem(-500)).toBe('00:00:00')
  })
})
