// Fuso fixo: o desafio vira à meia-noite de Brasília pra todo mundo. Usar o
// fuso do navegador faria o mesmo dia ter cartas diferentes conforme quem
// abre — e aí compartilhar o resultado deixa de fazer sentido.
export const FUSO = 'America/Sao_Paulo'

/** Dia 1 do jogo. Muda isso e a numeração de todos os desafios muda junto. */
export const EPOCA = '2026-01-01'

const formatador = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Data do desafio em Brasília, no formato AAAA-MM-DD. */
export function diaDoJogo(agora: Date = new Date()): string {
  return formatador.format(agora)
}

function paraUTC(dia: string): number {
  const [ano, mes, data] = dia.split('-').map(Number)
  return Date.UTC(ano ?? 1970, (mes ?? 1) - 1, data ?? 1)
}

/** Número do desafio: 1 no dia da época, 2 no dia seguinte, e assim por diante. */
export function numeroDoDesafio(dia: string): number {
  return Math.round((paraUTC(dia) - paraUTC(EPOCA)) / 86_400_000) + 1
}

/**
 * Quanto falta pro próximo desafio, em milissegundos.
 *
 * O deslocamento do fuso é medido no próprio instante em vez de fixar -03:00:
 * o Brasil já teve horário de verão e pode ter de novo, e quando isso
 * acontecer a contagem continua certa sem ninguém lembrar deste arquivo.
 */
export function msAteVirar(agora: Date = new Date()): number {
  const local = new Date(agora.toLocaleString('en-US', { timeZone: FUSO }))
  const referencia = new Date(agora.toLocaleString('en-US', { timeZone: 'UTC' }))
  const deslocamento = local.getTime() - referencia.getTime()

  const amanha = new Date(local)
  amanha.setHours(24, 0, 0, 0)
  return amanha.getTime() - deslocamento - agora.getTime()
}

export function formatarContagem(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
