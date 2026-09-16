import { describe, expect, it } from 'vitest'
import { TODAS_AS_CARTAS } from './cartas'
import { censurarNome, dicasDaCarta, dicasDoModo } from './dicas'
import type { Carta } from './tipos'

const luffy = {
  nome: 'Monkey.D.Luffy',
  palavrasChave: ['Blocker'],
  tipo: 'lider',
  cores: ['Vermelho'],
  vida: 5,
  custo: null,
  poder: 5000,
  tracos: ['Straw Hat Crew'],
  colecao: { codigo: 'OP-01', nome: 'ROMANCE DAWN' },
} as Carta

describe('censurarNome', () => {
  it('apaga o nome inteiro do texto do efeito', () => {
    expect(censurarNome('Jogue Monkey.D.Luffy da sua mão.', 'Monkey.D.Luffy')).toBe(
      'Jogue █████ da sua mão.',
    )
  })

  it('apaga também quando o efeito escreve o nome de outro jeito', () => {
    expect(censurarNome('Ative Monkey D. Luffy agora.', 'Monkey.D.Luffy')).toContain('█████')
    expect(censurarNome('Ative Monkey D. Luffy agora.', 'Monkey.D.Luffy')).not.toContain('Luffy')
  })

  it('não apaga pedaço curto que também é palavra comum', () => {
    // 'D' tem menos de 3 letras: censurar todo 'd' do texto deixaria o efeito ilegível.
    expect(censurarNome('Dê +1000 de poder.', 'Monkey.D.Luffy')).toBe('Dê +1000 de poder.')
  })

  it('deixa o efeito intacto quando ele não cita a carta', () => {
    const efeito = 'Todos os seus personagens ganham +1000 de poder.'
    expect(censurarNome(efeito, 'Roronoa Zoro')).toBe(efeito)
  })
})

describe('dicasDaCarta', () => {
  it('vai da mais genérica pra mais entregue', () => {
    const dicas = dicasDaCarta(luffy)
    expect(dicas[0]?.rotulo).toBe('Cor')
    expect(dicas.at(-1)?.rotulo).toBe('Inicial do nome')
  })

  it('mostra vida no líder e custo no personagem, sem entregar o tipo no rótulo', () => {
    const doLider = dicasDaCarta(luffy).find((d) => d.rotulo === 'Custo ou vida')
    expect(doLider?.valor).toBe('5 de vida')

    const personagem = { ...luffy, tipo: 'personagem', custo: 4, vida: null } as Carta
    expect(dicasDaCarta(personagem).find((d) => d.rotulo === 'Custo ou vida')?.valor).toBe(
      '4 de custo',
    )
  })
})

describe('dicasDoModo', () => {
  // Cor, custo, poder, traço e coleção já são coluna da grade: pagar a marca
  // "sem dica" por algo que a grade entrega de graça seria roubo.
  // Traço saiu da grade e virou dica: é a saída pra quando a carta do dia tem
  // sósia, e agora custa a marca "sem dica".
  it('na grade, a escada é quantidade, traços, conjunto e inicial', () => {
    expect(dicasDoModo(luffy, 'personagem').map((d) => d.rotulo)).toEqual([
      'Quantas palavras-chave',
      'Traços',
      'Palavras-chave',
      'Inicial do nome',
    ])
  })

  it('a primeira dica é sempre mais fraca que a última', () => {
    for (const modo of ['personagem', 'arte', 'efeito']) {
      const dicas = dicasDoModo(luffy, modo)
      const cabem = (d: (typeof dicas)[number]) =>
        TODAS_AS_CARTAS.filter((carta) => d.combina(carta)).length
      expect(cabem(dicas[0]!), modo).toBeGreaterThan(cabem(dicas.at(-1)!))
    }
  })

  // O texto do efeito já mostra os selos: repetir não revelaria nada.
  it('no modo efeito não existe dica de palavra-chave', () => {
    expect(dicasDoModo(luffy, 'efeito').some((d) => d.rotulo === 'Palavras-chave')).toBe(false)
  })

  it('no modo arte, o conjunto de palavras-chave vem perto do fim', () => {
    const dicas = dicasDoModo(luffy, 'arte')
    expect(dicas[0]?.rotulo).toBe('Quantas palavras-chave')
    expect(dicas.at(-1)?.rotulo).toBe('Inicial do nome')
    const posicao = dicas.findIndex((d) => d.rotulo === 'Palavras-chave')
    expect(posicao).toBeGreaterThan(dicas.length / 2)
  })
})
