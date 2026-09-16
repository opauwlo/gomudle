/**
 * A escada do modo arte: quanto da carta aparece a cada palpite.
 *
 * A primeira versão abria em 7,5× com 2,5px de desfoque. Era zoom demais: o
 * que se via não era um pedaço da arte, era uma mancha colorida — não dava pra
 * deduzir nada, e chutar sem ter o que deduzir não é jogar, é sortear. Sem
 * contar que 7,5× estica um punhado de pixels da origem pela tela inteira, e
 * aí a imagem fica feia por cima de difícil.
 *
 * Agora abre em 3×, que mostra um pedaço grande o bastante pra reconhecer
 * traço, pose e cenário sem entregar a carta, e o desfoque é leve e some cedo
 * — a dificuldade sai do recorte, não da vista embaçada.
 */
export interface ZoomDaArte {
  escala: number
  /** Raio do desfoque em px. Zero é imagem limpa. */
  desfoque: number
}

/** Onde a escada começa: 3× mostra cerca de um terço da carta. */
const ESCALA_INICIAL = 3
/**
 * Onde ela termina. Acima de 1 de propósito: no último palpite ainda sobra um
 * fiapo de recorte, senão o palpite final e a revelação mostrariam a mesma
 * imagem e a revelação deixaria de ser um acontecimento.
 */
const ESCALA_FINAL = 1.08
/** Desfoque do primeiro olhar. Some no quarto passo. */
const DESFOQUE_INICIAL = 1.8
const PASSOS_COM_DESFOQUE = 3

/**
 * Depois do sexto palpite a rodada acaba. A escada para aqui pra não depender
 * de quem chama passar o número certo.
 */
const ULTIMO_PASSO = 6

const PASSO_DA_ESCALA = (ESCALA_INICIAL - ESCALA_FINAL) / ULTIMO_PASSO
const PASSO_DO_DESFOQUE = DESFOQUE_INICIAL / PASSOS_COM_DESFOQUE

/**
 * Duas casas bastam pra tela, e arredondar tira o lixo do ponto flutuante:
 * sem isso o desfoque do passo 3 dá 2,2e-16 em vez de zero, e o navegador
 * monta uma camada de `blur()` pra desfocar nada.
 */
const arredondar = (valor: number) => Math.round(valor * 100) / 100

export function zoomDaArte(palpites: number, revelar: boolean): ZoomDaArte {
  if (revelar) return { escala: 1, desfoque: 0 }

  const passo = Math.min(Math.max(palpites, 0), ULTIMO_PASSO)
  return {
    escala: arredondar(Math.max(ESCALA_FINAL, ESCALA_INICIAL - passo * PASSO_DA_ESCALA)),
    desfoque: arredondar(Math.max(0, DESFOQUE_INICIAL - passo * PASSO_DO_DESFOQUE)),
  }
}

/**
 * Ponto do recorte, estável por carta: todo mundo vê o mesmo pedaço no mesmo
 * dia, e a pessoa que recarrega a página não ganha um ângulo novo.
 *
 * A faixa é apertada de propósito: o recorte fica no miolo da carta. Perto da
 * borda ele cairia na moldura, no custo ou na caixa de texto — tudo parte da
 * carta, nada disso é a arte que o modo pede pra reconhecer.
 */
export function focoDaArte(id: string): { x: number; y: number } {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  // `>>>`, não `>>`: o hash passa de 2³¹ e o deslocamento COM sinal devolve
  // número negativo, que no resto vira porcentagem negativa. Era o que
  // acontecia em 708 das 840 cartas — o recorte ancorava na borda de cima ou
  // fora dela, e o modo arte abria no topo da moldura em vez de na arte.
  return { x: 28 + (h % 45), y: 22 + ((h >>> 8) % 40) }
}
