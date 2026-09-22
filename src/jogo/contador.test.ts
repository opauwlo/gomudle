import { describe, expect, it, vi } from 'vitest'
import {
  chaveDoDesafio,
  contarResolvidos,
  enderecoDeLeitura,
  enderecoDeRegistro,
  fraseDeResolvidos,
  lerContagem,
  type Buscar,
} from './contador'

/** Resposta de mentira, só com o que `contarResolvidos` olha. */
const resposta = (corpo: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
  }) as Response

describe('chaveDoDesafio', () => {
  it('separa modo, formato e dia', () => {
    expect(chaveDoDesafio('arte', 'egb', '2026-09-22')).toBe('arte-egb-2026-09-22')
  })

  // O serviço aceita letra, número, hífen, ponto e sublinhado. Chave com dois
  // pontos (o `modo:formato` do progresso) viraria endereço quebrado.
  it('sai limpa pra entrar num endereço', () => {
    for (const modo of ['personagem', 'efeito', 'arte']) {
      for (const formato of ['standard', 'egb']) {
        expect(chaveDoDesafio(modo, formato, '2026-01-01')).toMatch(/^[a-z0-9_.-]+$/)
      }
    }
  })

  it('dia diferente é contador diferente: o número zera sozinho à meia-noite', () => {
    expect(chaveDoDesafio('arte', 'egb', '2026-09-22')).not.toBe(
      chaveDoDesafio('arte', 'egb', '2026-09-23'),
    )
  })
})

describe('lerContagem', () => {
  it('pega o número do corpo', () => {
    expect(lerContagem({ value: 42 })).toBe(42)
  })

  // Corpo de terceiro: mudança de formato lá não pode virar "NaN pessoas".
  it('recusa tudo que não for número positivo', () => {
    expect(lerContagem({ value: '42' })).toBeNull()
    expect(lerContagem({ value: Number.NaN })).toBeNull()
    expect(lerContagem({ value: Number.POSITIVE_INFINITY })).toBeNull()
    expect(lerContagem({ value: -3 })).toBeNull()
    expect(lerContagem({ total: 42 })).toBeNull()
    expect(lerContagem(null)).toBeNull()
    expect(lerContagem('42')).toBeNull()
    expect(lerContagem([42])).toBeNull()
  })
})

describe('contarResolvidos', () => {
  it('soma 1 quando registra, e só lê quando não', async () => {
    const buscar = vi.fn<Buscar>().mockResolvedValue(resposta({ value: 7 }))

    expect(await contarResolvidos('arte-egb-2026-09-22', true, buscar)).toBe(7)
    expect(buscar.mock.calls[0]?.[0]).toBe(enderecoDeRegistro('arte-egb-2026-09-22'))

    await contarResolvidos('arte-egb-2026-09-22', false, buscar)
    expect(buscar.mock.calls[1]?.[0]).toBe(enderecoDeLeitura('arte-egb-2026-09-22'))
  })

  it('não manda o endereço da página junto', async () => {
    const buscar = vi.fn<Buscar>().mockResolvedValue(resposta({ value: 1 }))
    await contarResolvidos('chave', false, buscar)
    expect(buscar.mock.calls[0]?.[1]?.referrerPolicy).toBe('no-referrer')
  })

  // Chave que ninguém somou ainda não existe no serviço: é zero, não é erro.
  it('404 é ninguém resolveu ainda', async () => {
    const buscar = vi.fn<Buscar>().mockResolvedValue(resposta({ erro: 'not found' }, 404))
    expect(await contarResolvidos('chave', false, buscar)).toBe(0)
  })

  // A regra da casa: contador é enfeite. Qualquer tropeço vira `null`, e quem
  // chama mostra nada — nunca um recado de erro no meio da revelação.
  it('falha calado em rede caída, erro do serviço e corpo estranho', async () => {
    const caiu = vi.fn<Buscar>().mockRejectedValue(new Error('sem rede'))
    expect(await contarResolvidos('chave', true, caiu)).toBeNull()

    const quebrou = vi.fn<Buscar>().mockResolvedValue(resposta({ value: 1 }, 500))
    expect(await contarResolvidos('chave', true, quebrou)).toBeNull()

    const estranho = vi.fn<Buscar>().mockResolvedValue(resposta({ desculpa: 'mudamos tudo' }))
    expect(await contarResolvidos('chave', true, estranho)).toBeNull()

    const semJson = vi.fn<Buscar>().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('isso é HTML')),
    } as unknown as Response)
    expect(await contarResolvidos('chave', true, semJson)).toBeNull()
  })

  it('sem fetch no ambiente, devolve nada em vez de explodir', async () => {
    expect(await contarResolvidos('chave', true, undefined as unknown as Buscar)).toBeNull()
  })
})

describe('fraseDeResolvidos', () => {
  it('sem número, sem frase', () => {
    expect(fraseDeResolvidos(null, true)).toBeNull()
    expect(fraseDeResolvidos(null, false)).toBeNull()
  })

  // Quem venceu já está dentro do total. Sem descontar, o primeiro a resolver
  // leria "você e mais 1".
  it('quem venceu não se conta duas vezes', () => {
    expect(fraseDeResolvidos(1, true)).toBe('Você foi a primeira pessoa a resolver hoje.')
    expect(fraseDeResolvidos(2, true)).toBe('Você e mais 1 pessoa resolveram hoje.')
    expect(fraseDeResolvidos(3, true)).toBe('Você e mais 2 pessoas resolveram hoje.')
  })

  it('quem não venceu vê o total inteiro', () => {
    expect(fraseDeResolvidos(0, false)).toBe('Ninguém resolveu esse desafio hoje, por enquanto.')
    expect(fraseDeResolvidos(1, false)).toBe('1 pessoa resolveu esse desafio hoje.')
    expect(fraseDeResolvidos(2, false)).toBe('2 pessoas resolveram esse desafio hoje.')
  })

  it('número grande sai com separador de milhar', () => {
    expect(fraseDeResolvidos(1234, false)).toContain('1.234')
    expect(fraseDeResolvidos(1235, true)).toContain('1.234')
  })

  // Contador zerado com vitória é o serviço destrambelhado (ou contagem de
  // outro dia chegando atrasada). Não pode virar "você e mais -1".
  it('não inventa gente negativa', () => {
    expect(fraseDeResolvidos(0, true)).toBe('Você foi a primeira pessoa a resolver hoje.')
  })
})
