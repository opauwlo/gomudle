import { describe, expect, it } from 'vitest'
import { gradeDeEmojis, textoDeCompartilhamento } from './compartilhar'
import type { Pista } from './tipos'

const linha = (...vereditos: Pista['veredito'][]): Pista[] =>
  vereditos.map((veredito, i) => ({ chave: `c${i}`, rotulo: 'X', valor: '1', veredito }))

describe('gradeDeEmojis', () => {
  it('desenha uma linha por palpite, na ordem do jogo', () => {
    const grade = gradeDeEmojis([linha('diferente', 'parcial'), linha('igual', 'igual')], true)
    expect(grade).toBe('⬛🟨\n🟩🟩')
  })

  // Modo efeito e arte não têm grade de pistas: sem este caso, a mensagem
  // compartilhada sairia vazia.
  it('nos modos sem grade, um quadrado por palpite e o verde só no acerto', () => {
    expect(gradeDeEmojis([[], [], []], true)).toBe('⬛\n⬛\n🟩')
    expect(gradeDeEmojis([[], []], false)).toBe('⬛\n⬛')
  })
})

describe('textoDeCompartilhamento', () => {
  const base = {
    modo: 'Personagem',
    emojiDoModo: '🃏',
    numeroDoDesafio: 259,
    trilha: [] as number[],
    dicasPedidas: 0,
    diaDificil: false,
    endereco: 'https://gomudle.exemplo',
  }

  it('conta os palpites e fecha com o endereço', () => {
    const texto = textoDeCompartilhamento({
      ...base,
      historico: [linha('diferente'), linha('igual')],
      venceu: true,
    })
    expect(texto.split('\n')[0]).toBe('Gomudle 🃏 Personagem #259 — 2 palpites · sem dica')
    expect(texto).toContain('⬛\n🟩')
    expect(texto.endsWith('https://gomudle.exemplo')).toBe(true)
  })

  it('mostra quantas dicas foram pedidas', () => {
    const texto = textoDeCompartilhamento({
      ...base,
      dicasPedidas: 2,
      historico: [linha('igual')],
      venceu: true,
    })
    expect(texto).toContain('· 2 dicas')
  })

  it('anuncia o dia difícil no texto compartilhado', () => {
    const texto = textoDeCompartilhamento({
      ...base,
      diaDificil: true,
      historico: [linha('igual')],
      venceu: true,
    })
    expect(texto).toContain('#259 (dia difícil)')
  })

  it('escreve palpite no singular quando foi de primeira', () => {
    const texto = textoDeCompartilhamento({ ...base, historico: [linha('igual')], venceu: true })
    expect(texto).toContain('— 1 palpite · sem dica')
  })

  it('marca X quando a pessoa desistiu', () => {
    const texto = textoDeCompartilhamento({
      ...base,
      historico: [linha('diferente'), linha('diferente')],
      venceu: false,
    })
    expect(texto).toContain('#259 — X palpites')
  })

  it('conta a história do afunilamento quando ela existe', () => {
    const texto = textoDeCompartilhamento({
      ...base,
      trilha: [702, 41, 6],
      historico: [linha('diferente'), linha('parcial'), linha('igual')],
      venceu: true,
    })
    expect(texto).toContain('702 → 41 → 6')
  })

  it('omite a linha do afunilamento quando foi de primeira', () => {
    const texto = textoDeCompartilhamento({
      ...base,
      trilha: [0],
      historico: [linha('igual')],
      venceu: true,
    })
    expect(texto).not.toContain('→')
  })

  it('não entrega a carta do dia', () => {
    const texto = textoDeCompartilhamento({
      ...base,
      historico: [linha('igual', 'parcial')],
      venceu: true,
    })
    expect(texto).not.toMatch(/OP\d\d-\d\d\d/)
  })
})
