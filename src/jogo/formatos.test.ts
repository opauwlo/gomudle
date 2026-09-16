import { describe, expect, it } from 'vitest'
import { TODAS_AS_CARTAS } from './cartas'
import { acharFormato, BLOCO_MAIS_ANTIGO_NO_STANDARD, FORMATOS } from './formatos'
import { deckDoModo, MODOS } from './modos'
import type { Carta } from './tipos'

const standard = acharFormato('standard')
const egb = acharFormato('egb')
const comBloco = (bloco: number | null) => ({ bloco }) as Carta

describe('Standard', () => {
  it('aceita bloco na rotação', () => {
    expect(standard.aceita(comBloco(BLOCO_MAIS_ANTIGO_NO_STANDARD))).toBe(true)
    expect(standard.aceita(comBloco(5))).toBe(true)
  })

  it('corta bloco que já rotacionou', () => {
    expect(standard.aceita(comBloco(1))).toBe(false)
  })

  // Bloco X é carta à prova de rotação — vale no Standard sem ter número.
  it('aceita carta de bloco X', () => {
    expect(standard.aceita(comBloco(null))).toBe(true)
  })
})

describe('EGB', () => {
  it('aceita tudo, inclusive o que rotacionou', () => {
    expect(TODAS_AS_CARTAS.every((carta) => egb.aceita(carta))).toBe(true)
  })
})

describe('deckDoModo', () => {
  it('o deck do Standard é um subconjunto próprio do EGB', () => {
    for (const modo of MODOS) {
      const noEgb = deckDoModo(modo, egb)
      const noStandard = deckDoModo(modo, standard)
      expect(noStandard.length, modo.id).toBeLessThan(noEgb.length)
      expect(noStandard.every((c) => noEgb.includes(c)), modo.id).toBe(true)
    }
  })

  it('não deixa nenhum bloco 1 passar no Standard', () => {
    for (const modo of MODOS) {
      expect(deckDoModo(modo, standard).some((c) => c.bloco === 1), modo.id).toBe(false)
    }
  })

  it('sobra deck grande o bastante pra um ano em todo modo e formato', () => {
    for (const modo of MODOS) {
      for (const formato of FORMATOS) {
        expect(deckDoModo(modo, formato).length, `${modo.id}:${formato.id}`).toBeGreaterThan(90)
      }
    }
  })

  it('devolve sempre o mesmo array (o cache não recalcula)', () => {
    const modo = MODOS[0] as (typeof MODOS)[number]
    expect(deckDoModo(modo, standard)).toBe(deckDoModo(modo, standard))
  })
})
