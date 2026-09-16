import { FORMATO_PADRAO, FORMATOS, type IdDeFormato } from './formatos'
import { MODO_PADRAO, MODOS } from './modos'
import type { IdDeModo } from './tipos'

/**
 * Modo e formato vivem no hash: `/#efeito:egb` abre direto no efeito do EGB.
 *
 * O que é padrão NÃO aparece: o modo da grade no Standard é `/`, sem hash
 * nenhum. Escrever `#personagem:standard` pra dizer "o de sempre" é barulho na
 * barra de endereço, e ainda espalha o id interno do modo, que por acaso ainda
 * se chama `personagem` (ver a 13 do NOTAS).
 *
 * A leitura não liga pra ordem nem pra quantidade: cada pedaço é procurado nas
 * duas listas. É o que faz `#efeito`, `#egb`, `#efeito:egb` e o antigo
 * `#personagem:standard` funcionarem todos — link que alguém salvou continua
 * abrindo onde abria.
 */
export function lerEndereco(hash: string): { modo: IdDeModo; formato: IdDeFormato } {
  const pedacos = hash.replace(/^#/, '').split(':').filter((pedaco) => pedaco !== '')
  const modo = pedacos.find((pedaco) => MODOS.some((m) => m.id === pedaco))
  const formato = pedacos.find((pedaco) => FORMATOS.some((f) => f.id === pedaco))
  return {
    modo: (modo as IdDeModo | undefined) ?? MODO_PADRAO,
    formato: (formato as IdDeFormato | undefined) ?? FORMATO_PADRAO,
  }
}

/** O hash de um destino, com o que é padrão omitido. Vazio é a tela inicial. */
export function escreverEndereco(destino: { modo: IdDeModo; formato: IdDeFormato }): string {
  return [
    destino.modo === MODO_PADRAO ? null : destino.modo,
    destino.formato === FORMATO_PADRAO ? null : destino.formato,
  ]
    .filter((pedaco) => pedaco !== null)
    .join(':')
}
