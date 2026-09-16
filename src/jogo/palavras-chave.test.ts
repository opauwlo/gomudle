import { describe, expect, it } from 'vitest'
import { TODAS_AS_CARTAS } from './cartas'
import { legendaDePalavrasChave, palavrasChaveDaCarta } from './palavras-chave'
import type { Carta } from './tipos'

const comChaves = (palavrasChave: string[]) => ({ palavrasChave }) as Carta

describe('palavrasChaveDaCarta', () => {
  it('explica palavra-chave conhecida', () => {
    expect(palavrasChaveDaCarta(comChaves(['Blocker']))[0]).toEqual({
      chave: 'Blocker',
      explicacao: 'pode se meter na frente de um ataque',
    })
  })

  it('mantém a ordem impressa na carta', () => {
    const pista = palavrasChaveDaCarta(comChaves(['On Play', 'Once Per Turn']))
    expect(pista.map((p) => p.chave)).toEqual(['On Play', 'Once Per Turn'])
  })

  it('devolve lista vazia quando a carta não tem palavra-chave', () => {
    expect(palavrasChaveDaCarta(comChaves([]))).toEqual([])
  })

  it('não some com palavra-chave nova: mostra o selo sem explicação', () => {
    expect(palavrasChaveDaCarta(comChaves(['Gear Fifth']))[0]).toEqual({
      chave: 'Gear Fifth',
      explicacao: '',
    })
  })

  it('tem explicação pra toda palavra-chave que existe hoje', () => {
    const semExplicacao = TODAS_AS_CARTAS.flatMap((carta) =>
      palavrasChaveDaCarta(carta)
        .filter((pista) => pista.explicacao === '')
        .map((pista) => pista.chave),
    )
    expect([...new Set(semExplicacao)]).toEqual([])
  })

  // A pista tem que caber em duas linhas no celular. O limite é folgado de
  // propósito: o máximo real hoje é 5, e coleção nova pode trazer 6 sem que
  // isso seja problema — 8 seria.
  it('dá pista curta: a carta mais carregada não passa de seis selos', () => {
    for (const carta of TODAS_AS_CARTAS) {
      expect(palavrasChaveDaCarta(carta).length, carta.id).toBeLessThanOrEqual(6)
    }
  })
})

describe('legendaDePalavrasChave', () => {
  it('lista todas as palavras-chave com explicação', () => {
    const legenda = legendaDePalavrasChave()
    expect(legenda.length).toBeGreaterThan(15)
    expect(legenda.every((item) => item.explicacao !== '')).toBe(true)
  })
})
