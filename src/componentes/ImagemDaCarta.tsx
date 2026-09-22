import { useEffect, useState, useSyncExternalStore } from 'react'
import { enderecoDaCarta, seletorDeFonte, type TamanhoDaImagem } from '../jogo/imagens'
import type { Carta } from '../jogo/tipos'
import { TINTA_DA_COR } from './cores'

interface Props {
  carta: Carta
  className?: string
  /** Estilo aplicado na <img>. O modo arte usa pra recortar a janela nítida. */
  estiloDaImagem?: React.CSSProperties
  /**
   * No modo arte a carta é o enigma: nem o `alt`, nem o aviso de falha, nem a
   * cor do fundo de espera podem dizer qual é. Já entregou a resposta uma vez,
   * escrito no meio da tela. (O endereço da imagem ainda tem o código da
   * carta — quem abre o inspetor consegue colar. Isso é aceito: o jogo não
   * guarda segredo de servidor.)
   */
  identidadeOculta?: boolean
  /**
   * Miniatura: o aviso de falha vira um quadrinho com a inicial do nome. O
   * texto "arte indisponível" não cabe em 40px de largura — vazava da lista de
   * sugestões inteira.
   */
  compacta?: boolean
  /** Qual tamanho pedir ao CDN. Ver `LARGURA` em `jogo/imagens.ts`. */
  tamanho?: TamanhoDaImagem
  /**
   * Fura a fila: carrega já, com prioridade alta. Só pra imagem que É a tela —
   * hoje, a arte do modo arte. Marcar mais de uma por tela não adianta nada:
   * prioridade alta em tudo é prioridade normal em tudo.
   */
  prioritaria?: boolean
  /**
   * Avisa que a imagem terminou de carregar, entregando o elemento já
   * decodificado. O modo arte desenha o mosaico a partir dele — mesma imagem
   * que já está na tela, sem segunda requisição e sem precisar saber de CDN
   * nem da fila de fontes.
   */
  aoCarregar?: (imagem: HTMLImageElement) => void
  aoFalhar?: () => void
}

/**
 * O que ocupa o espaço da carta enquanto o arquivo não chega.
 *
 * São duas camadas, e a de cima só existe onde vale a pena: a PRÉVIA (ver
 * `PREVIA` em `jogo/imagens.ts`), uma versão de 32px que chega em menos de
 * 1 kB e, esticada, já mostra as formas e as cores certas. Embaixo dela, as
 * cores da carta, que não custam requisição nenhuma e cobrem o instante antes
 * até da prévia chegar.
 *
 * As duas ficam no `background` da PRÓPRIA `<img>`: quando o arquivo de
 * verdade termina de baixar, o navegador pinta em cima e a troca acontece
 * sozinha, sem estado, sem segunda tag e sem um quadro de tela vazia no meio.
 * O `cover` acompanha o `object-cover` de quem chama, e o `clip-path` do modo
 * arte recorta o elemento inteiro — prévia e imagem final cortam igual, então
 * a janela já mostra alguma coisa antes de a arte de verdade chegar.
 */
function fundoDeEspera(carta: Carta, identidadeOculta: boolean, previa?: string): string {
  const cores = coresDeEspera(carta, identidadeOculta)
  return previa === undefined ? cores : `url("${previa}") center / cover no-repeat, ${cores}`
}

/**
 * As cores da carta como fundo. É de graça — não baixa nada — e evita o
 * pisca-pisca de retângulo vazio virando arte no meio de uma lista que se
 * refaz a cada tecla.
 *
 * No modo arte isso seria entregar a resposta de mão beijada: cor é uma das
 * colunas do jogo. Lá o fundo é neutro.
 */
function coresDeEspera(carta: Carta, identidadeOculta: boolean): string {
  const neutro = 'var(--color-surface-1)'
  if (identidadeOculta) return neutro
  const tintas = carta.cores.map(
    (cor) =>
      `color-mix(in oklab, ${TINTA_DA_COR[cor] ?? '#64748b'} 28%, var(--color-surface-1))`,
  )
  const [primeira] = tintas
  if (primeira === undefined) return neutro
  return tintas.length === 1 ? primeira : `linear-gradient(150deg, ${tintas.join(', ')})`
}

/**
 * A arte da carta, servida pela fonte que estiver de pé (ver `jogo/imagens.ts`).
 *
 * Falhou em todas, a tela mostra um quadro com o código da carta em vez de um
 * ícone quebrado — a rodada continua jogável pelas dicas e pela grade.
 */
export function ImagemDaCarta({
  carta,
  className = '',
  estiloDaImagem,
  identidadeOculta = false,
  compacta = false,
  tamanho = 'miniatura',
  prioritaria = false,
  aoCarregar,
  aoFalhar,
}: Props) {
  // A fonte é do jogo inteiro: se ela cair enquanto esta imagem está na tela,
  // esta imagem troca junto, sem esperar falhar sozinha.
  const fonteDoJogo = useSyncExternalStore(
    seletorDeFonte.assinar,
    seletorDeFonte.indice,
    seletorDeFonte.indice,
  )
  const [tentada, setTentada] = useState(fonteDoJogo)
  const indice = Math.max(tentada, fonteDoJogo)

  useEffect(() => setTentada(seletorDeFonte.indice()), [carta.id])

  const endereco = enderecoDaCarta(carta, tamanho, indice)

  /*
   * Com a identidade oculta, a imagem deixa de ser alvo de clique.
   *
   * Sem isso, o menu do botão direito em cima dela é o menu de IMAGEM — "abrir
   * imagem em nova guia" mostra a carta do dia inteira, sem recorte, sem zoom
   * e com o código dela no endereço. É o jeito mais fácil que existe de furar
   * o modo arte, e não exige saber nada.
   * Sem ser alvo, o clique atravessa pro painel atrás e o menu que abre é o da
   * página, que não tem entrada de imagem nenhuma.
   *
   * **Isto é tranca de porta, não cofre.** Quem abre as ferramentas do
   * navegador vê o endereço na aba de rede, e não tem como impedir: é o
   * navegador de quem joga que pede a imagem. Esconder de verdade exigiria um
   * servidor servindo a arte recortada, e o jogo não tem servidor — ver a
   * ressalva na `identidadeOculta` acima.
   */
  const classes = identidadeOculta ? `${className} pointer-events-none` : className

  if (endereco === null) {
    if (compacta) {
      return (
        // Sem o nome ao lado (a grade mostra só a arte), o fallback precisa
        // dizer QUAL carta é — senão, arte que não carrega deixa a linha
        // anônima e o jogo sem sentido.
        <div
          className={`flex items-center justify-center bg-linha px-0.5 text-center text-[0.5rem] font-bold leading-none text-tinta-3 ${className}`}
        >
          {carta.id.replace('-', '‑')}
        </div>
      )
    }
    return (
      <div
        className={`flex items-center justify-center bg-surface text-center text-xs text-tinta-3 ${className}`}
      >
        <span className="px-2">
          arte indisponível
          {!identidadeOculta && (
            <>
              <br />
              <strong className="text-tinta">{carta.id}</strong>
            </>
          )}
        </span>
      </div>
    )
  }

  return (
    <img
      src={endereco.src}
      srcSet={endereco.srcSet}
      // Largura e altura de verdade (o CSS manda no tamanho final): com elas o
      // navegador já sabe a proporção da carta antes do arquivo chegar e não
      // rearranja a tela quando ele chega.
      width={endereco.largura}
      height={endereco.altura}
      alt={identidadeOculta ? 'Pedaço da arte da carta do dia' : `Carta ${carta.nome} (${carta.id})`}
      className={classes}
      style={{
        background: fundoDeEspera(carta, identidadeOculta, endereco.previa),
        ...estiloDaImagem,
      }}
      referrerPolicy="no-referrer"
      loading={prioritaria ? 'eager' : 'lazy'}
      fetchPriority={prioritaria ? 'high' : 'auto'}
      // Decodificar fora da thread principal: sem isso, doze miniaturas
      // chegando juntas travam o campo de digitar por alguns quadros.
      decoding="async"
      draggable={false}
      onLoad={(evento) => aoCarregar?.(evento.currentTarget)}
      onError={() => {
        const temOutraFonte = seletorDeFonte.registrarFalha(indice, carta.id)
        setTentada(indice + 1)
        if (!temOutraFonte) aoFalhar?.()
      }}
    />
  )
}
