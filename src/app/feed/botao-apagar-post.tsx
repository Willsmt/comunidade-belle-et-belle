"use client";

import { Trash2 } from "lucide-react";
import { apagarPost } from "./actions";
import { Button } from "@/components/ui/button";
import { useAcaoComErro } from "@/hooks/use-acao-com-erro";

function construirFormDataPostId(postId: string) {
  const formData = new FormData();
  formData.set("postId", postId);
  return formData;
}

export function BotaoApagarPost({ postId }: { postId: string }) {
  const { isPending, erro, executar } = useAcaoComErro();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Apagar post"
        disabled={isPending}
        onClick={() => {
          if (window.confirm("Apagar esse post? Essa ação não pode ser desfeita.")) {
            executar(() => apagarPost(construirFormDataPostId(postId)));
          }
        }}
      >
        <Trash2 />
      </Button>
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
