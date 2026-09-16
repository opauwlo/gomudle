import { describe, expect, it, vi } from 'vitest'
import { TODAS_AS_CARTAS } from './cartas'
import { criarSeletorDeFonte, enderecoDaCarta, FONTES } from './imagens'
import type { Carta } from './tipos'

const carta = (imagem: string) =>
  ({ id: 'OP01-001', nome: 'Roronoa Zoro', cores: ['Vermelho'], imagem }) as Carta

const OFICIAL = 'https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png'
const ULTIMA = FONTES.length - 1

describe('enderecoDaCarta', () => {
  it('a primeira fonte pede WebP do tamanho da tela, não o PNG de impressão', () => {
    const endereco = enderecoDaCarta(carta(OFICIAL), 'miniatura', 0)
    expect(endereco?.src).toContain('output=webp')
    expect(endereco?.src).toContain('w=64')
    // O endereço oficial entra codificado: ele tem `:` e `/` que são
    // separadores na query de quem vai servir.
    expect(endereco?.src).toContain(encodeURIComponent('en.onepiece-cardgame.com'))
  })

  it('o 2× é o dobro da largura, pra tela de celular não ficar borrada', () => {
    const { srcSet } = enderecoDaCarta(carta(OFICIAL), 'miniatura', 0)!
    expect(srcSet).toContain('w=64&')
    expect(srcSet).toContain('w=128&')
    expect(srcSet?.endsWith('2x')).toBe(true)
  })

  it('cada uso pede o seu tamanho, do menor pro maior', () => {
    const largura = (tamanho: 'miniatura' | 'carta' | 'arte') =>
      enderecoDaCarta(carta(OFICIAL), tamanho, 0)!.largura
    expect(largura('miniatura')).toBeLessThan(largura('carta'))
    expect(largura('carta')).toBeLessThan(largura('arte'))
  })

  it('o modo arte pede o nativo inteiro, porque o zoom usa cada pixel', () => {
    const { src, largura } = enderecoDaCarta(carta(OFICIAL), 'arte', 0)!
    expect(largura).toBe(600)
    expect(src).toContain('w=600&')
  })

  it('no nativo não existe 2×: seria o mesmo arquivo em outro endereço', () => {
    // O `we` do CDN não amplia, então pedir 1200 volta 600. Anunciar isso como
    // 2× faria a tela de celular baixar a imagem duas vezes à toa.
    const { srcSet } = enderecoDaCarta(carta(OFICIAL), 'arte', 0)!
    expect(srcSet).toBeUndefined()
  })

  it('a arte comprime menos que a miniatura: o zoom é lupa no artefato', () => {
    const arte = enderecoDaCarta(carta(OFICIAL), 'arte', 0)!
    const miniatura = enderecoDaCarta(carta(OFICIAL), 'miniatura', 0)!
    expect(arte.src).toContain('q=90')
    expect(miniatura.src).toContain('q=76')
  })

  it('a prévia é minúscula e vem da mesma fonte', () => {
    const { previa } = enderecoDaCarta(carta(OFICIAL), 'arte', 0)!
    expect(previa).toContain('w=32&')
    expect(previa).toContain('q=35')
    expect(previa).toContain('wsrv.nl')
  })

  it('a miniatura não tem prévia: ela já é pequena', () => {
    // Prévia ali seria uma requisição a mais pra economizar nada — e a lista de
    // busca mostra doze miniaturas de uma vez.
    expect(enderecoDaCarta(carta(OFICIAL), 'miniatura', 0)!.previa).toBeUndefined()
    expect(enderecoDaCarta(carta(OFICIAL), 'carta', 0)!.previa).toContain('w=32&')
  })

  it('a fonte que não redimensiona não tem prévia', () => {
    // Ali "prévia" seria o PNG de impressão inteiro, o contrário do que ela
    // serve: o arquivo pesado chegando primeiro pra segurar o lugar dele.
    expect(enderecoDaCarta(carta(OFICIAL), 'arte', ULTIMA)!.previa).toBeUndefined()
  })

  it('reserva o espaço na proporção da carta impressa', () => {
    const { largura, altura } = enderecoDaCarta(carta(OFICIAL), 'carta', 0)!
    expect(altura / largura).toBeCloseTo(88 / 63, 2)
  })

  it('a última fonte é o endereço oficial, cru e sem 2×', () => {
    const endereco = enderecoDaCarta(carta(OFICIAL), 'arte', ULTIMA)
    expect(endereco?.src).toBe(OFICIAL)
    // Ela não redimensiona: anunciar um 2× igual ao 1× só faria o navegador
    // escolher entre dois endereços idênticos.
    expect(endereco?.srcSet).toBeUndefined()
  })

  it('acabou a fila de fontes, não tem endereço', () => {
    expect(enderecoDaCarta(carta(OFICIAL), 'carta', FONTES.length)).toBeNull()
  })

  it('carta sem arte no dataset não vira endereço em fonte nenhuma', () => {
    for (let i = 0; i < FONTES.length; i++) {
      expect(enderecoDaCarta(carta(''), 'carta', i)).toBeNull()
    }
  })

  it('toda carta do jogo vira https em toda fonte', () => {
    for (const cartaDoJogo of TODAS_AS_CARTAS) {
      for (let i = 0; i < FONTES.length; i++) {
        const endereco = enderecoDaCarta(cartaDoJogo, 'miniatura', i)
        expect(endereco?.src.startsWith('https://'), cartaDoJogo.id).toBe(true)
      }
    }
  })
})

describe('seletorDeFonte', () => {
  it('começa na primeira fonte', () => {
    expect(criarSeletorDeFonte().indice()).toBe(0)
  })

  it('carta sozinha que falha não derruba a fonte', () => {
    const seletor = criarSeletorDeFonte(3, 3)
    // Mesmo insistindo: é UMA carta sem arte no acervo, não o CDN fora do ar.
    for (let i = 0; i < 5; i++) seletor.registrarFalha(0, 'OP01-001')
    expect(seletor.indice()).toBe(0)
  })

  it('três cartas diferentes falhando trocam a fonte do jogo inteiro', () => {
    const seletor = criarSeletorDeFonte(3, 3)
    const avisou = vi.fn()
    seletor.assinar(avisou)

    seletor.registrarFalha(0, 'OP01-001')
    seletor.registrarFalha(0, 'OP01-002')
    expect(seletor.indice()).toBe(0)

    seletor.registrarFalha(0, 'OP01-003')
    expect(seletor.indice()).toBe(1)
    // Quem já está na tela precisa saber pra trocar junto, sem falhar também.
    expect(avisou).toHaveBeenCalledTimes(1)
  })

  it('falha atrasada da fonte velha não derruba a nova', () => {
    const seletor = criarSeletorDeFonte(3, 1)
    seletor.registrarFalha(0, 'OP01-001')
    expect(seletor.indice()).toBe(1)

    // Imagens que já estavam no ar quando a troca aconteceu chegam depois.
    seletor.registrarFalha(0, 'OP01-002')
    seletor.registrarFalha(0, 'OP01-003')
    expect(seletor.indice()).toBe(1)
  })

  it('a última fonte não é abandonada: depois dela não tem nada', () => {
    const seletor = criarSeletorDeFonte(3, 1)
    seletor.registrarFalha(0, 'OP01-001')
    seletor.registrarFalha(1, 'OP01-001')
    expect(seletor.indice()).toBe(2)

    expect(seletor.registrarFalha(2, 'OP01-001')).toBe(false)
    expect(seletor.indice()).toBe(2)
  })

  it('diz se ainda existe fonte depois da que falhou', () => {
    const seletor = criarSeletorDeFonte(3, 3)
    expect(seletor.registrarFalha(0, 'OP01-001')).toBe(true)
    expect(seletor.registrarFalha(FONTES.length - 1, 'OP01-001')).toBe(false)
  })

  it('assinatura cancelada para de receber aviso', () => {
    const seletor = criarSeletorDeFonte(3, 1)
    const avisou = vi.fn()
    seletor.assinar(avisou)()
    seletor.registrarFalha(0, 'OP01-001')
    expect(avisou).not.toHaveBeenCalled()
  })
})
