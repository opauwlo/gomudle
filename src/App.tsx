import { useEffect, useState } from 'react'
import { Cabecalho } from './componentes/Cabecalho'
import { CampoDePalpite } from './componentes/CampoDePalpite'
import { Dicas } from './componentes/Dicas'
import { ExemploDeLinha } from './componentes/ExemploDeLinha'
import { GradeDeComparacao } from './componentes/GradeDeComparacao'
import { ModalComoJogar } from './componentes/ModalComoJogar'
import { ModalEstatisticas } from './componentes/ModalEstatisticas'
import { PainelDeArte } from './componentes/PainelDeArte'
import { PainelDeEfeito } from './componentes/PainelDeEfeito'
import { PainelDeFim } from './componentes/PainelDeFim'
import { precarregar } from './componentes/precarregar'
import { Rodape } from './componentes/Rodape'
import { BarraDeControles } from './componentes/BarraDeControles'
import { Termometro } from './componentes/Termometro'
import { acharFormato, FORMATO_PADRAO, FORMATOS, type IdDeFormato } from './jogo/formatos'
import { acharModo, deckDoModo, MODO_PADRAO, MODOS } from './jogo/modos'
import { cartaDoDia } from './jogo/sorteio'
import type { IdDeModo } from './jogo/tipos'
import { useRodada } from './jogo/useRodada'

/**
 * Modo e formato vivem no hash: /#lider:egb abre direto no líder do EGB.
 * Hash antigo (só o modo) continua valendo e cai no formato padrão.
 */
function doEndereco(): { modo: IdDeModo; formato: IdDeFormato } {
  const [modo, formato] = window.location.hash.replace('#', '').split(':')
  return {
    modo: MODOS.some((m) => m.id === modo) ? (modo as IdDeModo) : MODO_PADRAO,
    formato: FORMATOS.some((f) => f.id === formato) ? (formato as IdDeFormato) : FORMATO_PADRAO,
  }
}

export function App() {
  const [endereco, setEndereco] = useState(doEndereco)
  const modo = acharModo(endereco.modo)
  const formato = acharFormato(endereco.formato)
  const rodada = useRodada(modo, formato)

  const [verAjuda, setVerAjuda] = useState(false)
  const [verEstatisticas, setVerEstatisticas] = useState(false)

  useEffect(() => {
    const aoTrocarHash = () => setEndereco(doEndereco())
    window.addEventListener('hashchange', aoTrocarHash)
    return () => window.removeEventListener('hashchange', aoTrocarHash)
  }, [])

  /*
   * Pré-carrega a arte que vem a seguir.
   *
   * Duas apostas, as duas boas: a carta do dia dos OUTROS modos, porque trocar
   * de modo é o passo natural de quem terminou um (é o que a chamada do
   * "próximo modo" empurra), e a resposta do modo atual no tamanho da
   * revelação, que é a única imagem grande que a rodada ainda vai pedir.
   *
   * O modo arte pede o tamanho dele: lá a imagem é a tela toda, e chegar
   * naquele modo com ela já guardada é a diferença entre abrir e esperar.
   *
   * O atraso é pra não competir com a tela atual. Pré-carregar na largada
   * faria a aposta no que vem depois atrasar o que está na frente da pessoa
   * agora — que é exatamente o contrário do que isto serve.
   */
  useEffect(() => {
    const id = window.setTimeout(() => {
      precarregar(rodada.resposta, 'carta')
      for (const outro of MODOS) {
        if (outro.id === modo.id) continue
        const doDia = cartaDoDia(
          deckDoModo(outro, formato),
          `${outro.id}:${formato.id}`,
          rodada.numeroDoDesafio,
        )
        precarregar(doDia, outro.id === 'arte' ? 'arte' : 'carta')
      }
    }, 1500)
    return () => window.clearTimeout(id)
  }, [modo, formato, rodada.resposta, rodada.numeroDoDesafio])

  const navegar = (proximo: { modo: IdDeModo; formato: IdDeFormato }) => {
    window.location.hash = `${proximo.modo}:${proximo.formato}`
    setEndereco(proximo)
  }

  // Empurrão pro próximo desafio: fechar um e ver que faltam três é o que traz
  // a pessoa pro segundo modo, e o segundo modo é o que cria o hábito.
  const proximoModo = MODOS.find((m) => m.id !== modo.id && rodada.resumoDoDia[m.id] == null) ?? null

  const temGrade = modo.colunas.length > 0
  const encerrada = rodada.encerrada
  const chutou = rodada.palpites.length

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-3 py-5 sm:px-5 sm:py-7">
      <Cabecalho
        habito={rodada.habito}
        aoAbrirAjuda={() => setVerAjuda(true)}
        aoAbrirEstatisticas={() => setVerEstatisticas(true)}
      />

      <BarraDeControles
        modo={endereco.modo}
        formato={endereco.formato}
        resumoDoDia={rodada.resumoDoDia}
        numeroDoDesafio={rodada.numeroDoDesafio}
        cartasNoDeck={rodada.deck.length}
        aoTrocarModo={(modo) => navegar({ ...endereco, modo })}
        aoTrocarFormato={(formato) => navegar({ ...endereco, formato })}
      />

      <main className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-tinta">
            {rodada.emTreino ? `Treino · ${modo.nome}` : modo.chamada}
            {/*
              Dia de sósia vira evento anunciado, não pegadinha. Com quatro
              colunas, 18% das cartas de personagem dividem a linha inteira com
              outra — quem sabe disso antes de começar lê o ≠ como parte do
              jogo; quem não sabe acha que o jogo quebrou.
            */}
            {rodada.diaDificil && (
              <span
                title="A carta de hoje divide todas as características com outra. A grade sozinha não resolve: confie no ≠ ou peça a dica de traços."
                className="rounded-full bg-selo-tint px-2 py-0.5 text-[0.7rem] font-semibold text-selo-strong ring-1 ring-selo-tint-border"
              >
                dia difícil
              </span>
            )}
          </h2>
          <p className="text-xs text-tinta-3">
            {rodada.emTreino && 'treino · '}
            {chutou} palpite{chutou === 1 ? '' : 's'}
          </p>
        </div>

        {modo.id === 'efeito' && <PainelDeEfeito carta={rodada.resposta} />}
        {modo.id === 'arte' && (
          <PainelDeArte carta={rodada.resposta} palpites={chutou} revelar={encerrada} />
        )}

        {!encerrada && (
          <Termometro
            candidatas={rodada.candidatas}
            total={rodada.deck.length}
            palpites={chutou}
          />
        )}

        {!encerrada && (
          <CampoDePalpite
            deck={rodada.deck}
            jaChutados={rodada.palpites.map((carta) => carta.id)}
            aoChutar={rodada.chutar}
            descricaoDoDeck={`${rodada.deck.length} ${modo.descricaoDoDeck} no ${formato.nome}`}
            comArte={modo.arteNaBusca}
          />
        )}

        {encerrada && (
          <PainelDeFim
            modo={modo}
            formato={formato}
            resposta={rodada.resposta}
            venceu={rodada.venceu}
            historico={rodada.historico}
            trilha={rodada.trilha}
            dicasPedidas={rodada.dicasPedidas}
            diaDificil={rodada.diaDificil}
            cartaDeOntem={rodada.cartaDeOntem}
            quantidadeDePalpites={chutou}
            numeroDoDesafio={rodada.numeroDoDesafio}
            emTreino={rodada.emTreino}
            proximoModo={proximoModo}
            aoIrParaModo={(id) => navegar({ ...endereco, modo: id })}
            aoTreinar={rodada.treinar}
            aoVoltarParaODiario={rodada.voltarParaODiario}
          />
        )}

        <Dicas
          carta={rodada.resposta}
          idDoModo={modo.id}
          pedidas={rodada.dicasPedidas}
          revelado={encerrada}
          aoPedir={rodada.pedirDica}
          aoAbrirLegenda={() => setVerAjuda(true)}
        />

        {temGrade && (
          <GradeDeComparacao
            colunas={modo.colunas}
            palpites={rodada.palpites}
            historico={rodada.historico}
            resposta={rodada.resposta}
          />
        )}

        {/* Novato vê a legenda; quem já jogou um dia vê a explicação do modo. */}
        {chutou === 0 && !encerrada && temGrade && rodada.habito.diasJogados === 0 && (
          <ExemploDeLinha />
        )}

        {chutou === 0 && !encerrada && (rodada.habito.diasJogados > 0 || !temGrade) && (
          <p className="mx-auto max-w-md text-center text-sm text-tinta-3">{modo.comoJoga}</p>
        )}

        {!encerrada && chutou >= 6 && (
          <button
            type="button"
            onClick={rodada.desistir}
            className="mx-auto text-sm text-tinta-3 underline decoration-dotted underline-offset-4 hover:text-tinta"
          >
            Desistir e ver a resposta
          </button>
        )}
      </main>

      <Rodape />

      {verAjuda && <ModalComoJogar aoFechar={() => setVerAjuda(false)} />}
      {verEstatisticas && (
        <ModalEstatisticas
          modo={modo}
          formato={formato}
          estatisticas={rodada.estatisticas}
          habito={rodada.habito}
          aoFechar={() => setVerEstatisticas(false)}
        />
      )}
    </div>
  )
}
