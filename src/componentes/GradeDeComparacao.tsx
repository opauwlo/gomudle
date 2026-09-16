import type { Coluna } from '../jogo/comparar'
import type { Carta, Pista } from '../jogo/tipos'
import { ICONE } from './icones'
import { ImagemDaCarta } from './ImagemDaCarta'

// 'parcial' vira a classe 'quase' porque o token de cor no CSS tem esse nome.
const classeDe = (veredito: Pista['veredito']) =>
  veredito === 'igual' ? 'pastilha-acerto' : veredito === 'parcial' ? 'pastilha-quase' : 'pastilha-erro'

/**
 * Ícone junto da cor. Daltonismo vermelho-verde é comum o bastante pra que uma
 * grade que só muda de cor seja ilegível pra parte das pessoas — e a seta ainda
 * carrega a informação de "é maior", que cor nenhuma dá.
 */
function Marca({ pista }: { pista: Pista }) {
  const Desenho = pista.direcao
    ? pista.direcao === 'maior'
      ? ICONE.maior
      : ICONE.menor
    : pista.veredito === 'igual'
      ? ICONE.acerto
      : pista.veredito === 'parcial'
        ? ICONE.quase
        : ICONE.erro
  return <Desenho aria-hidden="true" className="size-[1.15rem]" strokeWidth={2.75} />
}

function descrever(pista: Pista): string {
  const base = `${pista.rotulo}: ${pista.valor}.`
  if (pista.veredito === 'igual') return `${base} Acertou.`
  const seta = pista.direcao ? ` A resposta é ${pista.direcao}.` : ''
  return pista.veredito === 'parcial' ? `${base} Quase.${seta}` : `${base} Errou.${seta}`
}

interface Props {
  colunas: Coluna[]
  palpites: Carta[]
  historico: Pista[][]
  resposta: Carta
}

/**
 * Planilha, não pilha de cartões.
 *
 * Antes cada palpite repetia "COR / CUSTO / PODER" dentro das próprias
 * pastilhas — o rótulo aparecia oito vezes na tela e cada tentativa comia uns
 * 200px de altura. Agora o cabeçalho é um só, grudado no topo, e a linha é uma
 * linha: dá pra varrer a coluna de cima a baixo, que é como se lê tabela e é o
 * que o jogo pede.
 *
 * As larguras vêm do `peso` de cada coluna (ver `comparar.ts`) porque traço
 * precisa de mais espaço que custo, e `repeat()` com fração igual espremeria
 * os dois do mesmo jeito.
 */
export function GradeDeComparacao({ colunas, palpites, historico, resposta }: Props) {
  if (palpites.length === 0) return null

  // A primeira coluna é só a arte: o nome truncava em "Tony ..." e "Zoro-..."
  // e a carta se reconhece pela imagem — o nome continua no `title` e no texto
  // alternativo. O resto são colunas iguais, porque agora só cabe uma marca em
  // cada uma.
  const template = `3.4rem repeat(${colunas.length}, minmax(0, 1fr))`

  return (
    // Sem `overflow-x` aqui de propósito: qualquer overflow no ancestral vira
    // um contexto de rolagem próprio e o `sticky` do cabeçalho passa a grudar
    // NELE, que não rola verticalmente — ou seja, deixa de grudar. As colunas
    // são fracionárias e encolhem sozinhas em tela estreita.
    <div>
      <div className="space-y-1">
        <div
          className="linha-grade sticky top-0 z-10 rounded-lg bg-paper/95 py-1 backdrop-blur"
          style={{ gridTemplateColumns: template }}
        >
          <span className="rotulo text-center">Carta</span>
          {colunas.map((coluna) => (
            <span key={coluna.chave} className="rotulo text-center">
              {coluna.abreviado ?? coluna.rotulo}
            </span>
          ))}
        </div>

        {/* Mais recente em cima: é a linha que a pessoa acabou de jogar. */}
        {[...palpites].reverse().map((palpite, posicao) => {
          const indice = palpites.length - 1 - posicao
          const pistas = historico[indice] ?? []
          const certa = palpite.id === resposta.id
          const gemea = !certa && pistas.length > 0 && pistas.every((p) => p.veredito === 'igual')

          return (
            <div
              key={palpite.id}
              className="linha-grade items-stretch"
              style={{ gridTemplateColumns: template }}
            >
              {/*
                Altura fixa de propósito: sem ela, `object-cover` cai na
                proporção natural da carta (63×88) e ESTICA a linha inteira pra
                65px — a altura da linha passava a ser decidida pela imagem, não
                pelo conteúdo.
              */}
              <div
                title={`${palpite.nome} (${palpite.id})${gemea ? ' — mesmas características da carta do dia, mas é outra' : ''}`}
                className={`relative h-11 overflow-hidden rounded-md ${
                  certa ? 'ring-2 ring-ok' : ''
                }`}
              >
                <ImagemDaCarta
                  carta={palpite}
                  compacta
                  className="size-full rounded-md object-cover object-top"
                />
                {gemea && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 bg-selo text-center text-[0.5rem] font-bold leading-[1.15] text-ink-fixed"
                  >
                    ≠
                  </span>
                )}
                <span className="sr-only">
                  {palpite.nome} ({palpite.id})
                  {gemea && ' — mesmas características da carta do dia, mas é outra carta'}
                </span>
              </div>

              {pistas.map((pista, ordem) => (
                // Só a marca, sem o valor.
                //
                // Repetir "Amarelo" embaixo de um X é dizer duas vezes a mesma
                // coisa: quem acabou de escolher a carta sabe o que ela tem, e
                // o X já informa "não é essa cor". Tirar o texto é o que
                // permite a linha caber em 44px e a coluna ser varrida de cima
                // a baixo de um golpe de vista, que é como se lê planilha.
                //
                // O valor continua no `title` (passar o mouse) e no texto do
                // leitor de tela — não sumiu, saiu da frente.
                <div
                  key={pista.chave}
                  title={descrever(pista)}
                  className={`pastilha anima-virar ${classeDe(pista.veredito)}`}
                  style={{ animationDelay: `${ordem * 45}ms` }}
                >
                  <Marca pista={pista} />
                  <span className="sr-only">{descrever(pista)}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
