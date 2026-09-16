import { DADOS_GERADOS_EM, TODAS_AS_CARTAS } from '../jogo/cartas'

export function Rodape() {
  return (
    <footer className="mt-4 border-t border-hairline pt-4 text-center text-xs text-tinta-3">
      <p>
        {TODAS_AS_CARTAS.length} cartas, dados de {DADOS_GERADOS_EM}. Projeto de fã, sem vínculo
        com a Bandai — One Piece Card Game, os nomes e as artes são da Bandai Co., Ltd. e de
        Eiichiro Oda/Shueisha.
      </p>
    </footer>
  )
}
