import { obterIniciais } from "@/lib/iniciais";
import { cn } from "@/lib/utils";

const TAMANHOS = {
  sm: "size-6 text-[10px]",
  lg: "size-16 text-lg",
} as const;

export function AvatarPessoa({
  nome,
  fotoUrl,
  tamanho = "sm",
  className,
}: {
  nome: string | null;
  fotoUrl: string | null;
  tamanho?: keyof typeof TAMANHOS;
  className?: string;
}) {
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={`Foto de perfil de ${nome ?? ""}`}
        className={cn(TAMANHOS[tamanho], "shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        TAMANHOS[tamanho],
        "flex shrink-0 items-center justify-center rounded-full bg-secondary font-medium text-secondary-foreground",
        className,
      )}
      aria-hidden="true"
    >
      {obterIniciais(nome)}
    </div>
  );
}
