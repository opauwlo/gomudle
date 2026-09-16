import { describe, expect, it } from 'vitest'
import { aplicarPalpite, encerrouRodada, pedirDica, usouDica, venceuRodada } from './rodada'

const emAndamento = { palpites: ['OP01-002'], desistiu: false, dicasPedidas: 0 }

describe('venceuRodada', () => {
  it('vence quando a resposta está entre os palpites', () => {
    expect(venceuRodada({ palpites: ['OP01-001'], desistiu: false, dicasPedidas: 0 }, 'OP01-001')).toBe(true)
  })

  it('não vence quem desistiu', () => {
    expect(venceuRodada({ palpites: ['OP01-001'], desistiu: true, dicasPedidas: 0 }, 'OP01-001')).toBe(false)
  })

  it('não vence com rodada em andamento', () => {
    expect(venceuRodada(emAndamento, 'OP01-001')).toBe(false)
  })
})

describe('encerrouRodada', () => {
  it('encerra por acerto ou por desistência', () => {
    expect(encerrouRodada({ palpites: ['OP01-001'], desistiu: false, dicasPedidas: 0 }, 'OP01-001')).toBe(true)
    expect(encerrouRodada({ palpites: [], desistiu: true, dicasPedidas: 0 }, 'OP01-001')).toBe(true)
    expect(encerrouRodada(emAndamento, 'OP01-001')).toBe(false)
  })
})

describe('aplicarPalpite', () => {
  it('acrescenta o palpite no fim', () => {
    expect(aplicarPalpite(emAndamento, 'OP01-003', 'OP01-001').palpites).toEqual([
      'OP01-002',
      'OP01-003',
    ])
  })

  it('ignora palpite repetido', () => {
    expect(aplicarPalpite(emAndamento, 'OP01-002', 'OP01-001')).toBe(emAndamento)
  })

  it('não aceita palpite depois de encerrada', () => {
    const fim = { palpites: ['OP01-001'], desistiu: false, dicasPedidas: 0 }
    expect(aplicarPalpite(fim, 'OP01-009', 'OP01-001')).toBe(fim)
  })
})

describe('pedirDica', () => {
  it('conta a dica pedida e marca a rodada', () => {
    const depois = pedirDica(emAndamento, 3)
    expect(depois.dicasPedidas).toBe(1)
    expect(usouDica(depois)).toBe(true)
  })

  it('não passa do que existe de dica', () => {
    const cheio = { ...emAndamento, dicasPedidas: 3 }
    expect(pedirDica(cheio, 3)).toBe(cheio)
  })

  it('rodada sem pedido nenhum não usou dica', () => {
    expect(usouDica(emAndamento)).toBe(false)
  })
})
