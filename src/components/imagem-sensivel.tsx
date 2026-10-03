import Image from "next/image";
import type { ComponentProps } from "react";

// Fotos corporais e comprovantes nunca passam pelo otimizador /_next/image:
// ele guarda cache por horas e fica fora do matcher do middleware, o que
// anularia a expiração curta das signed URLs do R2. `unoptimized` vem depois
// do spread de propósito, para não poder ser sobrescrito.
export function ImagemSensivel({ alt, ...props }: ComponentProps<typeof Image>) {
  return <Image alt={alt} {...props} unoptimized />;
}
