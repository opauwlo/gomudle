import { CardRulesText } from 'optcg-card-rules'
import iconeDeContador from 'optcg-card-rules/counter.svg'
import type { PalavraChave } from '../jogo/palavras-chave'

/**
 * Desenha a palavra-chave como a carta imprime: selo laranja de ponta dupla pra
 * habilidade (Blocker, Rush), azul pra tempo (On Play), octógono preto pro
 * DON!!, bandeira amarela pro Trigger.
 *
 * Quem desenha é o `optcg-card-rules` (MIT), o mesmo renderizador de texto de
 * regras que sites de OPTCG usam — em vez de eu aproximar os formatos no CSS e
 * errar a cor de um deles. `tagsOnly` faz ele devolver só o selo, sem texto.
 *
 * O selo carrega os colchetes em texto invisível, então copiar a pista cola
 * "[On Play]" e o leitor de tela lê a palavra-chave inteira.
 */
export function SeloDePalavraChave({ chave, explicacao }: PalavraChave) {
  return (
    <span className="inline-flex" title={explicacao === '' ? chave : `${chave} — ${explicacao}`}>
      <CardRulesText text={`[${chave}]`} tagsOnly counterIconSrc={iconeDeContador} />
    </span>
  )
}
