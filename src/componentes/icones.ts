import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bug,
  ChartColumn,
  Check,
  CircleQuestionMark,
  EqualApproximately,
  Flame,
  Lock,
  Share2,
  Shuffle,
  X,
  type LucideIcon,
} from 'lucide-react'

export type { LucideIcon }

/**
 * O único arquivo que conhece a biblioteca de ícones.
 *
 * Emoji renderizava diferente em cada sistema — o 🃏 do Android não é o do
 * iPhone, e nenhum dos dois combinava com os selos das cartas. Aqui é tudo
 * traço vetorial da mesma família, e trocar de biblioteca um dia é mexer neste
 * arquivo, não em oito componentes.
 */
export const ICONE = {
  ajuda: CircleQuestionMark,
  estatisticas: ChartColumn,
  fechado: Lock,
  compartilhar: Share2,
  treino: Shuffle,
  sequencia: Flame,
  proximo: ArrowRight,
  reportar: Bug,
  acerto: Check,
  quase: EqualApproximately,
  erro: X,
  maior: ArrowUp,
  menor: ArrowDown,
} satisfies Record<string, LucideIcon>
