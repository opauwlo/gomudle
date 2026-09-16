import { describe, expect, it } from 'vitest'
import { candidatasRestantes, diaDificil, sosiasDe, trilhaDeCandidatas, type Cerco } from './candidatas'
import { acharFormato } from './formatos'
import { deckDoModo, MODOS } from './modos'
import type { Carta } from './tipos'

const personagem = MODOS[0]!
const deck = deckDoModo(personagem, acharFormato('egb'))
const acharCarta = (id: string) => deck.find((c) => c.id === id) as Carta

const cerco = (parcial: Partial<Cerco> = {}): Cerco => ({
  deck,
  colunas: personagem.colunas,
  palpites: [],
  resposta: acharCarta('OP02-036'),
  dicasPedidas: 0,
  idDoModo: 'personagem',
  ...parcial,
})

describe('candidatasRestantes', () => {
  it('sem palpite nem dica, o deck inteiro é candidato', () => {
    expect(candidatasRestantes(cerco()).length).toBe(deck.length)
  })

  it('a resposta continua candidata depois de qualquer palpite', () => {
    const c = cerco({ palpites: [acharCarta('OP01-025')] })
    expect(candidatasRestantes(c)).toContain(c.resposta)
  })

  it('o palpite já dado sai da conta', () => {
    const palpite = acharCarta('OP01-025')
    expect(candidatasRestantes(cerco({ palpites: [palpite] }))).not.toContain(palpite)
  })

  it('afunila de verdade: um palpite corta a maior parte do deck', () => {
    expect(candidatasRestantes(cerco({ palpites: [acharCarta('OP01-025')] })).length).toBeLessThan(
      deck.length / 3,
    )
  })

  // Dica que não mexe no contador parece de graça — e não é.
  it('dica pedida corta o deck mesmo no modo com grade', () => {
    const palpites = [acharCarta('OP01-025')]
    const semDica = candidatasRestantes(cerco({ palpites })).length
    const comDica = candidatasRestantes(cerco({ palpites, dicasPedidas: 1 })).length
    expect(comDica).toBeLessThan(semDica)
  })

  it('nunca aumenta com mais palpites', () => {
    const trilha = trilhaDeCandidatas(
      cerco({
        palpites: [acharCarta('OP01-025'), acharCarta('OP01-013'), acharCarta('EB02-017')],
      }),
    )
    expect(trilha).toEqual([...trilha].sort((a, b) => b - a))
    expect(trilha.at(-1)).toBeGreaterThanOrEqual(1)
  })
})

describe('modo sem grade', () => {
  const arte = MODOS[3]!
  const deckArte = deckDoModo(arte, acharFormato('egb'))
  const resposta = deckArte[10] as Carta
  const daArte = (parcial: Partial<Cerco> = {}): Cerco => ({
    deck: deckArte,
    colunas: arte.colunas,
    palpites: [],
    resposta,
    dicasPedidas: 0,
    idDoModo: 'arte',
    ...parcial,
  })

  it('sem dica pedida, só tira o que já foi chutado', () => {
    expect(candidatasRestantes(daArte({ palpites: [deckArte[0] as Carta] })).length).toBe(
      deckArte.length - 1,
    )
  })

  it('a primeira dica pedida corta o deck na hora', () => {
    const palpites = deckArte.slice(0, 3).filter((c) => c.id !== resposta.id)
    const semDica = candidatasRestantes(daArte({ palpites })).length
    const comDica = candidatasRestantes(daArte({ palpites, dicasPedidas: 1 }))
    expect(comDica.length).toBeLessThan(semDica)
    expect(comDica).toContain(resposta)
  })
})

describe('sósias e dia difícil', () => {
  it('carta sem sósia não faz dia difícil', () => {
    const solitaria = deck.find(
      (c) => sosiasDe(deck, personagem.colunas, c).length === 0,
    ) as Carta
    expect(diaDificil(deck, personagem.colunas, solitaria)).toBe(false)
  })

  it('acha as sósias e elas são recíprocas', () => {
    const comSosia = deck.find((c) => sosiasDe(deck, personagem.colunas, c).length > 0) as Carta
    const sosias = sosiasDe(deck, personagem.colunas, comSosia)
    expect(sosias.length).toBeGreaterThan(0)
    expect(sosias).not.toContain(comSosia)
    expect(sosiasDe(deck, personagem.colunas, sosias[0] as Carta)).toContain(comSosia)
    expect(diaDificil(deck, personagem.colunas, comSosia)).toBe(true)
  })

  it('modo sem grade nunca é dia difícil: não existe linha pra empatar', () => {
    expect(diaDificil(deck, [], deck[0] as Carta)).toBe(false)
  })
})
