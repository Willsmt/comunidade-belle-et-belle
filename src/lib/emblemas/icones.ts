import {
  Award,
  Crown,
  Flame,
  Heart,
  Medal,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const ICONES_EMBLEMA = {
  Trophy,
  Award,
  Medal,
  Star,
  Flame,
  Target,
  Crown,
  Zap,
  Heart,
  Sparkles,
} satisfies Record<string, LucideIcon>;

export type NomeIconeEmblema = keyof typeof ICONES_EMBLEMA;

export const NOMES_ICONE_EMBLEMA = Object.keys(
  ICONES_EMBLEMA,
) as NomeIconeEmblema[];

export function ehNomeIconeEmblemaValido(
  valor: string,
): valor is NomeIconeEmblema {
  return NOMES_ICONE_EMBLEMA.includes(valor as NomeIconeEmblema);
}

export function obterIconeEmblema(
  nome: string | null | undefined,
): LucideIcon | null {
  if (!nome) return null;
  return ehNomeIconeEmblemaValido(nome) ? ICONES_EMBLEMA[nome] : null;
}
