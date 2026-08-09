"use client";

import { alternarVisibilidadeFoto, excluirFoto } from "./actions";
import { BotaoComConfirmacao } from "@/components/botao-com-confirmacao";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

function construirFormDataFoto(fotoId: string) {
  const formData = new FormData();
  formData.set("fotoId", fotoId);
  return formData;
}

export function ItemFoto({
  fotoId,
  urlAssinada,
  data,
  publica,
}: {
  fotoId: string;
  urlAssinada: string;
  data: string;
  publica: boolean;
}) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <li>
      <img src={urlAssinada} alt="Foto de evolução" width={200} />
      <p>{data}</p>
      <p>{publica ? "Pública" : "Privada"}</p>

      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          executar(() => alternarVisibilidadeFoto(construirFormDataFoto(fotoId)))
        }
      >
        {publica ? "Tornar privada" : "Tornar pública"}
      </button>
      {erro && <p role="alert">{erro}</p>}

      <BotaoComConfirmacao
        label="Excluir"
        mensagemConfirmacao="Excluir essa foto de evolução? Essa ação não pode ser desfeita."
        action={() => excluirFoto(construirFormDataFoto(fotoId))}
      />
    </li>
  );
}
