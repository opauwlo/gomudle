/**
 * Quantas pessoas já resolveram o desafio de hoje.
 *
 * **Este é o único número do jogo que não mora no navegador de quem joga.** O
 * resto do Gomudle é página estática de propósito (ver o README e a 21 do
 * NOTAS): sem backend, sem conta, progresso no `localStorage`. Contar gente
 * exige um lugar compartilhado, e um lugar compartilhado exige servidor — então
 * ou entrava um terceiro, ou o contador não existia.
 *
 * Entrou um terceiro: o Abacus, contador público que não pede conta nem chave.
 * Duas rotas, as duas `GET` e com CORS liberado:
 *
 *     /hit/<espaço>/<chave>   soma 1 e devolve o novo total (cria na primeira)
 *     /get/<espaço>/<chave>   só lê; 404 quando ninguém somou ainda
 *
 * As duas respondem `{"value": 42}`.
 *
 * O que isso custa, escrito aqui porque some da memória em duas semanas:
 *
 * 1. **Dá pra inflar.** A rota é pública e não autentica nada: quem abrir o
 *    endereço no navegador soma 1. É placar de jogo de fã, não urna — o preço
 *    de não ter servidor é esse, e a alternativa era não ter contador.
 * 2. **É terceiro, e terceiro fecha.** O CountAPI, que fazia isso antes, fechou.
 *    Por isso tudo aqui FALHA CALADO: sem resposta, sem número, sem recado de
 *    erro na tela e sem rodada travada. O contador é enfeite, nunca dependência.
 * 3. **O navegador de quem joga fala com o Abacus.** Vai o IP e vai a chave, que
 *    diz qual desafio a pessoa terminou. `no-referrer` corta o endereço da
 *    página; o resto é o que qualquer requisição carrega.
 *
 * Trocar de serviço é mexer em `SERVICO` e nas duas funções de endereço. O
 * resto do jogo só conhece "um número ou nada".
 */

export const SERVICO = 'https://abacus.jasoncameron.dev'

/** Espaço de nomes no serviço. É público: chave de outro projeto não colide. */
export const ESPACO = 'gomudle'

/** Depois disso a rede desistiu. Contador que demora não pode segurar a tela. */
const TEMPO_LIMITE = 5000

/**
 * Uma chave por desafio: modo, formato e dia.
 *
 * Contar tudo junto misturaria seis desafios diferentes por dia — a arte do
 * EGB não é a carta do Standard. E o dia na chave é o que faz o número voltar
 * a zero à meia-noite sem ninguém precisar limpar nada no serviço.
 */
export function chaveDoDesafio(modo: string, formato: string, dia: string): string {
  return `${modo}-${formato}-${dia}`
}

export const enderecoDeRegistro = (chave: string) => `${SERVICO}/hit/${ESPACO}/${chave}`
export const enderecoDeLeitura = (chave: string) => `${SERVICO}/get/${ESPACO}/${chave}`

/**
 * O número dentro da resposta, ou `null` se não veio número nenhum.
 *
 * Desconfia do corpo inteiro de propósito: é JSON de terceiro, e mudança de
 * formato lá não pode virar `NaN pessoas resolveram` aqui.
 */
export function lerContagem(corpo: unknown): number | null {
  if (typeof corpo !== 'object' || corpo === null) return null
  const valor = (corpo as { value?: unknown }).value
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) return null
  return Math.floor(valor)
}

/** `fetch` por injeção: assim o teste não precisa de rede nem de mock global. */
export type Buscar = (endereco: string, opcoes?: RequestInit) => Promise<Response>

/**
 * Lê o contador do desafio — somando 1 antes, quando `registrar`.
 *
 * `null` é "não deu": serviço fora do ar, rede caída, resposta estranha, aba
 * fechando. Quem chama mostra nada nesse caso, nunca um erro.
 */
export async function contarResolvidos(
  chave: string,
  registrar: boolean,
  buscar: Buscar = globalThis.fetch?.bind(globalThis),
): Promise<number | null> {
  if (typeof buscar !== 'function') return null

  try {
    const resposta = await buscar(
      registrar ? enderecoDeRegistro(chave) : enderecoDeLeitura(chave),
      {
        // Sem referrer: o endereço da página não interessa ao contador.
        referrerPolicy: 'no-referrer',
        // Sem cache: número de ontem em cache é pior que número nenhum.
        cache: 'no-store',
        signal: 'timeout' in AbortSignal ? AbortSignal.timeout(TEMPO_LIMITE) : undefined,
      },
    )

    // Chave que ninguém somou ainda não existe no serviço, e isso é uma
    // informação boa: zero pessoas resolveram.
    if (resposta.status === 404) return 0
    if (!resposta.ok) return null
    return lerContagem(await resposta.json())
  } catch {
    return null
  }
}

/**
 * A frase que vai pra tela. `null` quando não há número — aí a linha inteira
 * some, que é o contrário de mostrar "— pessoas resolveram".
 */
export function fraseDeResolvidos(contagem: number | null, venceu: boolean): string | null {
  if (contagem === null) return null
  const numero = (valor: number) => valor.toLocaleString('pt-BR')

  if (venceu) {
    // O próprio acerto já está no total, então o que sobra pros outros é um a
    // menos. Sem isso, quem resolve primeiro lê "você e mais 1".
    const outros = Math.max(0, contagem - 1)
    if (outros === 0) return 'Você foi a primeira pessoa a resolver hoje.'
    return outros === 1
      ? 'Você e mais 1 pessoa resolveram hoje.'
      : `Você e mais ${numero(outros)} pessoas resolveram hoje.`
  }

  if (contagem === 0) return 'Ninguém resolveu esse desafio hoje, por enquanto.'
  return contagem === 1
    ? '1 pessoa resolveu esse desafio hoje.'
    : `${numero(contagem)} pessoas resolveram esse desafio hoje.`
}
