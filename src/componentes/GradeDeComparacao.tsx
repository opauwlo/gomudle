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

/**
 * O texto que o leitor de tela lê e que aparece ao passar o mouse.
 *
 * O sentido da seta sai da COLUNA porque "maior" não serve pra tudo: em
 * coleção a seta é tempo, e "a resposta é maior" não quer dizer nada sobre uma
 * coleção. Ver `sentido` em `jogo/comparar.ts`.
 */
function descrever(pista: Pista, coluna?: Coluna): string {
  const base = `${pista.rotulo}: ${pista.valor}.`
  if (pista.veredito === 'igual') return `${base} Acertou.`
  const seta = pista.direcao
    ? ` A resposta é ${coluna?.sentido?.[pista.direcao] ?? pista.direcao}.`
    : ''
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
  const colunaPorChave = new Map(colunas.map((coluna) => [coluna.chave, coluna]))

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
                A caixa tem a proporção da carta impressa (63×88), então a
                miniatura aparece INTEIRA — arte, nome, custo, tudo. Antes eram
                44px de altura fixa com `object-cover`, que mostrava só a faixa
                de cima e cortava a carta no meio.
                É a imagem que decide a altura da linha agora (uns 76px na
                largura de 3.4rem). Foi a troca escolhida: a linha ficou mais
                alta e cabe menos palpite na tela de uma vez, e em troca dá pra
                reconhecer a carta sem passar o mouse.
              */}
              <div
                title={`${palpite.nome} (${palpite.id})${gemea ? ' — mesmas características da carta do dia, mas é outra' : ''}`}
                className={`relative aspect-[63/88] overflow-hidden rounded-md ${
                  certa ? 'ring-2 ring-ok' : ''
                }`}
              >
                <ImagemDaCarta
                  carta={palpite}
                  compacta
                  className="size-full rounded-md object-contain"
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
                // deixa a coluna ser varrida de cima a baixo de um golpe de
                // vista, que é como se lê planilha.
                //
                // O valor continua no `title` (passar o mouse) e no texto do
                // leitor de tela — não sumiu, saiu da frente.
                <div
                  key={pista.chave}
                  title={descrever(pista, colunaPorChave.get(pista.chave))}
                  className={`pastilha anima-virar ${classeDe(pista.veredito)}`}
                  style={{ animationDelay: `${ordem * 45}ms` }}
                >
                  <Marca pista={pista} />
                  <span className="sr-only">{descrever(pista, colunaPorChave.get(pista.chave))}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
