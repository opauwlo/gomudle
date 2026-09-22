import { describe, expect, it } from 'vitest'
import { focoDaArte, janelaDaArte, LIMITE_DA_ARTE, revelacaoDaArte } from './arte'
import { TODAS_AS_CARTAS } from './cartas'

const PASSOS = [0, 1, 2, 3, 4, 5, 6]
const LADOS = PASSOS.map((passo) => revelacaoDaArte(passo, false).janela)

describe('revelacaoDaArte', () => {
  it('o primeiro olhar é uma janela pequena num mosaico grosso', () => {
    const { janela, blocos } = revelacaoDaArte(0, false)
    // Pequena, mas pedaço de arte de verdade: abaixo de uns 20% do painel não
    // cabe traço nenhum, e aí chutar vira sorteio.
    expect(janela).toBeGreaterThanOrEqual(20)
    expect(janela).toBeLessThanOrEqual(26)
    expect(blocos).toBeLessThanOrEqual(14)
  })

  it('cada palpite alarga a janela e afina o mosaico', () => {
    const escada = PASSOS.map((passo) => revelacaoDaArte(passo, false))
    for (let i = 1; i < escada.length; i++) {
      expect(escada[i]!.janela, `passo ${i}`).toBeGreaterThan(escada[i - 1]!.janela)
      expect(escada[i]!.blocos, `passo ${i}`).toBeGreaterThan(escada[i - 1]!.blocos)
    }
  })

  it('no último palpite ainda sobra carta escondida, pra revelação ter o que revelar', () => {
    expect(revelacaoDaArte(6, false).janela).toBeLessThan(65)
  })

  it('o mosaico nunca afina a ponto de entregar a carta', () => {
    // O nome impresso tem ~30px de altura numa arte de 600px. Acima de uns 40
    // blocos cada bloco fica menor que a letra e o borrão começa a virar texto.
    for (const passo of PASSOS) {
      expect(revelacaoDaArte(passo, false).blocos, `passo ${passo}`).toBeLessThanOrEqual(40)
    }
  })

  it('revelar abre a carta inteira, em qualquer passo', () => {
    expect(revelacaoDaArte(0, true).janela).toBe(100)
    expect(revelacaoDaArte(6, true).janela).toBe(100)
  })

  it('a escada para nas duas pontas, mesmo fora da faixa', () => {
    expect(revelacaoDaArte(99, false)).toEqual(revelacaoDaArte(6, false))
    expect(revelacaoDaArte(-1, false)).toEqual(revelacaoDaArte(0, false))
  })
})

describe('janelaDaArte', () => {
  it('nunca sai do painel', () => {
    for (const carta of TODAS_AS_CARTAS) {
      for (const lado of LADOS) {
        const { esquerda, topo, largura } = janelaDaArte(carta.id, lado)
        expect(esquerda, carta.id).toBeGreaterThanOrEqual(0)
        expect(topo, carta.id).toBeGreaterThanOrEqual(0)
        expect(esquerda + largura, carta.id).toBeLessThanOrEqual(100)
        expect(largura, carta.id).toBe(lado)
      }
    }
  })

  // O painel é mais alto que largo, então janela quadrada NA TELA quer dizer
  // altura menor que largura em porcentagem. Fresta em pé mostra menos arte e
  // ainda esbarra mais cedo no limite de baixo.
  it('é quadrada na tela, não uma fresta em pé', () => {
    for (const lado of LADOS) {
      const { largura, altura } = janelaDaArte('OP01-001', lado)
      expect(altura).toBeLessThan(largura)
      expect(altura / largura).toBeCloseTo(5 / 7, 1)
    }
  })

  // O modo acaba se a janela chegar na barra de baixo: é lá que o nome da
  // carta está impresso, e nítido ele não é pista, é gabarito.
  it('nunca desce até o nome da carta enquanto a rodada corre', () => {
    for (const carta of TODAS_AS_CARTAS) {
      for (const lado of LADOS) {
        const { topo, altura } = janelaDaArte(carta.id, lado)
        expect(topo + altura, carta.id).toBeLessThanOrEqual(LIMITE_DA_ARTE)
      }
    }
  })

  // Sem isso a janela passearia pela carta a cada erro: o pedaço que a pessoa
  // estava estudando sairia da tela em vez de crescer.
  it('cresce sempre em volta do mesmo ponto', () => {
    for (const carta of TODAS_AS_CARTAS) {
      const { x, y } = focoDaArte(carta.id)
      for (const lado of LADOS) {
        const { esquerda, topo, largura, altura } = janelaDaArte(carta.id, lado)
        expect(x, carta.id).toBeGreaterThanOrEqual(esquerda)
        expect(x, carta.id).toBeLessThanOrEqual(esquerda + largura)
        expect(y, carta.id).toBeGreaterThanOrEqual(topo)
        expect(y, carta.id).toBeLessThanOrEqual(topo + altura)
      }
    }
  })

  it('a janela de 100% é a carta inteira: a revelação não guarda nada', () => {
    expect(janelaDaArte('OP01-001', 100)).toEqual({
      esquerda: 0,
      topo: 0,
      largura: 100,
      altura: 100,
    })
  })
})

describe('focoDaArte', () => {
  it('a mesma carta dá sempre o mesmo ponto', () => {
    expect(focoDaArte('OP01-001')).toEqual(focoDaArte('OP01-001'))
  })

  it('código de hash grande não joga o foco pra fora da carta', () => {
    // EB01-001 passa de 2³¹ no hash. Com deslocamento COM sinal o y saía
    // negativo, e a janela ancorava fora da arte.
    expect(focoDaArte('EB01-001').y).toBeGreaterThanOrEqual(0)
  })

  it('o foco fica na carta e para antes da barra do nome', () => {
    for (const carta of TODAS_AS_CARTAS) {
      const { x, y } = focoDaArte(carta.id)
      expect(x, carta.id).toBeGreaterThanOrEqual(0)
      expect(x, carta.id).toBeLessThanOrEqual(100)
      expect(y, carta.id).toBeGreaterThanOrEqual(0)
      expect(y, carta.id).toBeLessThanOrEqual(LIMITE_DA_ARTE)
    }
  })

  // A versão do zoom prendia o foco no miolo. Os cantos são pista — custo,
  // poder, atributo, cor da moldura — e agora entram no sorteio.
  it('os cantos entram no sorteio, não só o miolo', () => {
    const pontos = TODAS_AS_CARTAS.map((carta) => focoDaArte(carta.id))
    const quantos = (teste: (ponto: { x: number; y: number }) => boolean) =>
      pontos.filter(teste).length

    expect(quantos((p) => p.x <= 12 && p.y <= 12), 'canto de cima à esquerda').toBeGreaterThan(5)
    expect(quantos((p) => p.x >= 88 && p.y <= 12), 'canto de cima à direita').toBeGreaterThan(5)
    const fundo = LIMITE_DA_ARTE - 12
    expect(quantos((p) => p.x <= 12 && p.y >= fundo), 'canto de baixo à esquerda').toBeGreaterThan(5)
    expect(quantos((p) => p.x >= 88 && p.y >= fundo), 'canto de baixo à direita').toBeGreaterThan(5)
  })

  it('cartas diferentes não olham todas pro mesmo canto', () => {
    const pontos = new Set(
      TODAS_AS_CARTAS.map((carta) => {
        const { x, y } = focoDaArte(carta.id)
        return `${x},${y}`
      }),
    )
    expect(pontos.size).toBeGreaterThan(100)
  })
})
