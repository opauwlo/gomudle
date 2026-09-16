import { describe, expect, it } from 'vitest'
import { cartaDoDia } from './sorteio'
import type { Carta } from './tipos'

const deck = (tamanho: number): Carta[] =>
  Array.from({ length: tamanho }, (_, i) => ({ id: `C-${i}`, nome: `Carta ${i}` }) as Carta)

describe('cartaDoDia', () => {
  it('dá sempre a mesma carta pro mesmo dia e modo', () => {
    const cartas = deck(50)
    expect(cartaDoDia(cartas, 'personagem', 7).id).toBe(cartaDoDia(cartas, 'personagem', 7).id)
  })

  it('separa os modos: o mesmo dia não repete a carta entre eles', () => {
    const cartas = deck(200)
    const iguais = Array.from({ length: 30 }, (_, i) => i + 1).filter(
      (dia) => cartaDoDia(cartas, 'personagem', dia).id === cartaDoDia(cartas, 'efeito', dia).id,
    )
    expect(iguais.length).toBeLessThan(3)
  })

  it('não repete carta antes de o deck inteiro sair', () => {
    const cartas = deck(40)
    const sorteadas = Array.from({ length: 40 }, (_, i) => cartaDoDia(cartas, 'arte', i + 1).id)
    expect(new Set(sorteadas).size).toBe(40)
  })

  it('embaralha de novo no ciclo seguinte', () => {
    const cartas = deck(40)
    const primeiroCiclo = Array.from({ length: 40 }, (_, i) => cartaDoDia(cartas, 'arte', i + 1).id)
    const segundoCiclo = Array.from({ length: 40 }, (_, i) => cartaDoDia(cartas, 'arte', i + 41).id)
    expect(segundoCiclo).not.toEqual(primeiroCiclo)
    expect(new Set(segundoCiclo).size).toBe(40)
  })

  it('aguenta desafio no primeiro dia', () => {
    expect(() => cartaDoDia(deck(5), 'efeito', 1)).not.toThrow()
  })
})
