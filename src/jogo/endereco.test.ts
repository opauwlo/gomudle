import { describe, expect, it } from 'vitest'
import { escreverEndereco, lerEndereco } from './endereco'
import { FORMATO_PADRAO } from './formatos'
import { MODO_PADRAO } from './modos'

describe('escreverEndereco', () => {
  it('o padrão não aparece: a tela inicial é endereço sem hash', () => {
    expect(escreverEndereco({ modo: MODO_PADRAO, formato: FORMATO_PADRAO })).toBe('')
  })

  it('escreve só o que foge do padrão', () => {
    expect(escreverEndereco({ modo: 'efeito', formato: FORMATO_PADRAO })).toBe('efeito')
    expect(escreverEndereco({ modo: MODO_PADRAO, formato: 'egb' })).toBe('egb')
    expect(escreverEndereco({ modo: 'efeito', formato: 'egb' })).toBe('efeito:egb')
  })
})

describe('lerEndereco', () => {
  it('sem hash, tudo padrão', () => {
    expect(lerEndereco('')).toEqual({ modo: MODO_PADRAO, formato: FORMATO_PADRAO })
    expect(lerEndereco('#')).toEqual({ modo: MODO_PADRAO, formato: FORMATO_PADRAO })
  })

  it('um pedaço só é procurado nas duas listas', () => {
    // É o que faz `#egb` funcionar. Com o parse antigo, que lia por posição, o
    // primeiro pedaço só podia ser modo — e `#egb` abria no formato padrão.
    expect(lerEndereco('#egb').formato).toBe('egb')
    expect(lerEndereco('#egb').modo).toBe(MODO_PADRAO)
    expect(lerEndereco('#efeito').modo).toBe('efeito')
    expect(lerEndereco('#efeito').formato).toBe(FORMATO_PADRAO)
  })

  it('a ordem não importa', () => {
    expect(lerEndereco('#egb:arte')).toEqual({ modo: 'arte', formato: 'egb' })
    expect(lerEndereco('#arte:egb')).toEqual({ modo: 'arte', formato: 'egb' })
  })

  it('link antigo continua abrindo onde abria', () => {
    // `#personagem:standard` era o endereço de TODA tela inicial antes de o
    // padrão sumir da URL. Se alguém salvou, tem que continuar valendo.
    expect(lerEndereco('#personagem:standard')).toEqual({
      modo: 'personagem',
      formato: 'standard',
    })
  })

  it('lixo no hash cai no padrão em vez de quebrar', () => {
    expect(lerEndereco('#lider')).toEqual({ modo: MODO_PADRAO, formato: FORMATO_PADRAO })
    expect(lerEndereco('#::')).toEqual({ modo: MODO_PADRAO, formato: FORMATO_PADRAO })
    expect(lerEndereco('#qualquer:coisa')).toEqual({
      modo: MODO_PADRAO,
      formato: FORMATO_PADRAO,
    })
  })

  it('ida e volta: escrever e ler devolve o mesmo destino', () => {
    for (const modo of ['personagem', 'efeito', 'arte'] as const) {
      for (const formato of ['standard', 'egb'] as const) {
        const destino = { modo, formato }
        expect(lerEndereco(`#${escreverEndereco(destino)}`), `${modo}:${formato}`).toEqual(destino)
      }
    }
  })
})
