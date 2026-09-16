import { enderecoDaCarta, seletorDeFonte, type TamanhoDaImagem } from '../jogo/imagens'
import type { Carta } from '../jogo/tipos'

/**
 * Pede a arte agora pra ela já estar guardada quando a tela precisar.
 *
 * Não desenha nada: o navegador baixa, o cache do HTTP guarda e o service
 * worker (`public/sw.js`) guarda junto. Quando a `<img>` de verdade aparecer,
 * o endereço é o mesmo e a imagem já está ali.
 *
 * Prioridade baixa de propósito. Pré-carregar é sempre aposta no que a pessoa
 * VAI fazer, e aposta não pode roubar banda do que ela está olhando agora.
 *
 * Mora aqui, e não em `jogo/imagens.ts`, porque toca em DOM: `jogo/` monta o
 * endereço e não sabe que existe navegador. Quem baixa é a tela.
 */
export function precarregar(carta: Carta, tamanho: TamanhoDaImagem): void {
  // Fora do navegador (teste, build) não existe `Image` — e não há o que
  // pré-carregar de qualquer jeito.
  if (typeof Image === 'undefined') return

  const endereco = enderecoDaCarta(carta, tamanho, seletorDeFonte.indice())
  if (endereco === null) return

  const imagem = new Image()
  // Por atributo, não por propriedade: `fetchpriority` é recente e nem toda
  // definição de tipo do DOM conhece ainda.
  imagem.setAttribute('fetchpriority', 'low')
  imagem.decoding = 'async'
  if (endereco.srcSet !== undefined) imagem.srcset = endereco.srcSet
  imagem.src = endereco.src
}
