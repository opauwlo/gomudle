import { describe, expect, it } from 'vitest'
import { acertou, compararCarta, compararConjunto, compararNumero, type Coluna } from './comparar'
import { MODOS } from './modos'
import type { Carta } from './tipos'

const carta = (parcial: Partial<Carta>): Carta => ({
  id: 'OP01-001',
  nome: 'Teste',
  categoria: 'personagem',
  cores: ['Vermelho'],
  custo: 4,
  vida: null,
  poder: 5000,
  contador: 1000,
  atributos: ['Corte'],
  tipos: ['Straw Hat Crew'],
  palavrasChave: ['Blocker'],
  raridade: 'SR',
  colecao: { codigo: 'OP-01', nome: 'ROMANCE DAWN' },
  bloco: 1,
  efeito: '',
  imagem: '',
  ...parcial,
})

describe('compararConjunto', () => {
  it('ignora a ordem pra dizer que é igual', () => {
    expect(compararConjunto(['Azul', 'Roxo'], ['Roxo', 'Azul'])).toBe('igual')
  })

  it('dá parcial quando só uma parte bate', () => {
    expect(compararConjunto(['Azul', 'Roxo'], ['Roxo'])).toBe('parcial')
  })

  it('dá diferente quando não bate nada', () => {
    expect(compararConjunto(['Azul'], ['Verde'])).toBe('diferente')
  })

  it('trata vazio dos dois lados como igual', () => {
    expect(compararConjunto([], [])).toBe('igual')
  })
})

describe('compararNumero', () => {
  it('aponta pra cima quando a resposta é maior', () => {
    expect(compararNumero(3, 7)).toEqual({ veredito: 'diferente', direcao: 'maior' })
  })

  it('marca parcial dentro da tolerância, mas mantém a seta', () => {
    expect(compararNumero(5000, 6000, 1000)).toEqual({ veredito: 'parcial', direcao: 'maior' })
  })

  it('não inventa seta quando um dos lados não tem o valor', () => {
    expect(compararNumero(null, 2000)).toEqual({ veredito: 'diferente' })
    expect(compararNumero(2000, null)).toEqual({ veredito: 'diferente' })
  })

  it('considera igual quando os dois lados não têm valor', () => {
    expect(compararNumero(null, null)).toEqual({ veredito: 'igual' })
  })
})

describe('compararCarta', () => {
  const colunas = MODOS[0]!.colunas

  it('acusa acerto total quando é a mesma carta', () => {
    const alvo = carta({})
    const pistas = compararCarta(colunas, alvo, alvo)
    expect(acertou(pistas)).toBe(true)
  })

  it('formata poder do jeito que se fala na mesa', () => {
    const pistas = compararCarta(colunas, carta({ poder: 12000 }), carta({}))
    expect(pistas.find((p) => p.chave === 'poder')?.valor).toBe('12k')
  })

  // Coluna montada aqui de propósito: o teste é da máquina de comparação, e
  // não pode quebrar toda vez que o jogo tira ou põe uma coluna.
  it('mostra travessão quando a coluna numérica não tem valor', () => {
    const coluna: Coluna = {
      chave: 'contador',
      rotulo: 'Contador',
      estilo: 'numero',
      numero: (c) => c.contador,
    }
    const pistas = compararCarta([coluna], carta({ contador: null }), carta({}))
    expect(pistas[0]?.valor).toBe('—')
    expect(pistas[0]?.veredito).toBe('diferente')
  })

  it('mostra travessão quando a lista está vazia', () => {
    const coluna: Coluna = {
      chave: 'tipos',
      rotulo: 'Tipos',
      estilo: 'conjunto',
      conjunto: (c) => c.tipos,
    }
    expect(compararCarta([coluna], carta({ tipos: [] }), carta({}))[0]?.valor).toBe('—')
  })

  it('não dá acerto quando só a coleção bate', () => {
    const pistas = compararCarta(colunas, carta({ cores: ['Verde'], poder: 1000 }), carta({}))
    expect(acertou(pistas)).toBe(false)
    expect(pistas.find((p) => p.chave === 'colecao')?.veredito).toBe('igual')
  })
})
