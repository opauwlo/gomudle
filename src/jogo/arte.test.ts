import { describe, expect, it } from 'vitest'
import { focoDaArte, zoomDaArte } from './arte'
import { TODAS_AS_CARTAS } from './cartas'

const PASSOS = [0, 1, 2, 3, 4, 5, 6]

describe('zoomDaArte', () => {
  it('o primeiro olhar é um pedaço da arte, não uma mancha', () => {
    const { escala } = zoomDaArte(0, false)
    // Era 7,5×: sobrava um punhado de pixels esticados na tela inteira, sem o
    // que deduzir. Também não pode cair pra perto de 1, senão o primeiro
    // palpite já veria a carta.
    expect(escala).toBeLessThanOrEqual(3)
    expect(escala).toBeGreaterThan(2)
  })

  it('cada palpite afasta a câmera', () => {
    const escalas = PASSOS.map((passo) => zoomDaArte(passo, false).escala)
    for (let i = 1; i < escalas.length; i++) {
      expect(escalas[i]!, `passo ${i}`).toBeLessThan(escalas[i - 1]!)
    }
  })

  it('no último palpite ainda sobra recorte, pra revelação ter o que revelar', () => {
    const { escala } = zoomDaArte(6, false)
    expect(escala).toBeGreaterThan(1)
    expect(escala).toBeLessThan(1.15)
  })

  it('revelar mostra a carta inteira e limpa, em qualquer passo', () => {
    expect(zoomDaArte(0, true)).toEqual({ escala: 1, desfoque: 0 })
    expect(zoomDaArte(6, true)).toEqual({ escala: 1, desfoque: 0 })
  })

  it('o desfoque some antes dos palpites acabarem', () => {
    // Desfoque é ajuda de dificuldade no começo, não defeito permanente: do
    // meio da rodada em diante a dificuldade é só o recorte.
    expect(zoomDaArte(0, false).desfoque).toBeGreaterThan(0)
    expect(zoomDaArte(3, false).desfoque).toBe(0)
    expect(zoomDaArte(6, false).desfoque).toBe(0)
  })

  it('o desfoque é leve: embaçar demais é o mesmo que esconder', () => {
    expect(zoomDaArte(0, false).desfoque).toBeLessThanOrEqual(2)
  })

  it('nunca encolhe nem embaça pro lado errado, mesmo fora da faixa', () => {
    for (let palpites = -3; palpites <= 20; palpites++) {
      const { escala, desfoque } = zoomDaArte(palpites, false)
      expect(escala, `palpites ${palpites}`).toBeGreaterThanOrEqual(1)
      expect(desfoque, `palpites ${palpites}`).toBeGreaterThanOrEqual(0)
    }
    // A escada para no fim da rodada: palpite a mais não afasta mais nada.
    expect(zoomDaArte(99, false)).toEqual(zoomDaArte(6, false))
    expect(zoomDaArte(-1, false)).toEqual(zoomDaArte(0, false))
  })
})

describe('focoDaArte', () => {
  it('a mesma carta dá sempre o mesmo ponto', () => {
    expect(focoDaArte('OP01-001')).toEqual(focoDaArte('OP01-001'))
  })

  it('código de hash grande não joga o recorte pra fora da arte', () => {
    // EB01-001 passa de 2³¹ no hash. Com deslocamento COM sinal o y saía 17 —
    // acima da faixa, na borda de cima da carta.
    expect(focoDaArte('EB01-001').y).toBeGreaterThanOrEqual(22)
  })

  it('o recorte fica no miolo da carta, longe de moldura e caixa de texto', () => {
    for (const carta of TODAS_AS_CARTAS) {
      const { x, y } = focoDaArte(carta.id)
      expect(x, carta.id).toBeGreaterThanOrEqual(25)
      expect(x, carta.id).toBeLessThanOrEqual(75)
      expect(y, carta.id).toBeGreaterThanOrEqual(20)
      expect(y, carta.id).toBeLessThanOrEqual(65)
    }
  })

  it('cartas diferentes não olham todas pro mesmo canto', () => {
    const pontos = new Set(TODAS_AS_CARTAS.map((carta) => {
      const { x, y } = focoDaArte(carta.id)
      return `${x},${y}`
    }))
    expect(pontos.size).toBeGreaterThan(100)
  })
})
