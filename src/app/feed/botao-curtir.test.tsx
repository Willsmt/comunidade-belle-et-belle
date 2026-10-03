// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("./actions", () => ({
  alternarCurtida: vi.fn(),
}));

import { BotaoCurtir } from "./botao-curtir";
import { alternarCurtida } from "./actions";

type RespostaCurtida = { curtiu: boolean; total: number };

function renderizar(curtidoPeloUsuario: boolean, totalCurtidas: number) {
  return render(
    <BotaoCurtir
      postId="post-1"
      curtidoPeloUsuario={curtidoPeloUsuario}
      totalCurtidas={totalCurtidas}
    />,
  );
}

function textoDoBotao() {
  return screen.getByRole("button").textContent;
}

function respostaPendente() {
  let resolver: (valor: RespostaCurtida) => void = () => {};
  const promessa = new Promise<RespostaCurtida>((resolve) => {
    resolver = resolve;
  });
  vi.mocked(alternarCurtida).mockReturnValue(promessa);
  return resolver;
}

describe("BotaoCurtir", () => {
  beforeEach(() => {
    vi.mocked(alternarCurtida).mockReset();
  });

  it("curte na hora, antes do servidor responder", () => {
    respostaPendente();
    renderizar(false, 5);

    fireEvent.click(screen.getByRole("button"));

    expect(textoDoBotao()).toBe("Descurtir (6)");
  });

  it("descurte na hora, antes do servidor responder", () => {
    respostaPendente();
    renderizar(true, 5);

    fireEvent.click(screen.getByRole("button"));

    expect(textoDoBotao()).toBe("Curtir (4)");
  });

  it("reconcilia com o total devolvido pelo servidor", async () => {
    const resolver = respostaPendente();
    renderizar(false, 5);

    fireEvent.click(screen.getByRole("button"));
    resolver({ curtiu: true, total: 8 });

    await waitFor(() => expect(textoDoBotao()).toBe("Descurtir (8)"));
  });

  it("desfaz a curtida e mostra o erro quando a action falha", async () => {
    vi.mocked(alternarCurtida).mockRejectedValue(
      new Error("Não foi possível concluir a ação."),
    );
    renderizar(false, 5);

    fireEvent.click(screen.getByRole("button"));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Não foi possível concluir a ação.",
    );
    expect(textoDoBotao()).toBe("Curtir (5)");
  });

  it("envia o postId no FormData", async () => {
    vi.mocked(alternarCurtida).mockResolvedValue({ curtiu: true, total: 1 });
    renderizar(false, 0);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(alternarCurtida).toHaveBeenCalledTimes(1));
    const formData = vi.mocked(alternarCurtida).mock.calls[0][0];
    expect(formData.get("postId")).toBe("post-1");
  });

  it("adota os valores do servidor quando as props mudam", () => {
    const { rerender } = renderizar(false, 5);

    rerender(<BotaoCurtir postId="post-1" curtidoPeloUsuario={true} totalCurtidas={9} />);

    expect(textoDoBotao()).toBe("Descurtir (9)");
  });
});
