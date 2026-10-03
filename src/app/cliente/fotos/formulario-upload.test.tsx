// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("./actions", () => ({
  enviarFoto: vi.fn(),
}));

import { FormularioUpload } from "./formulario-upload";
import { enviarFoto } from "./actions";

const MENSAGEM_PADRAO =
  "Não foi possível enviar a foto. Confira o formato (JPEG, PNG ou WebP) e o tamanho (até 5MB).";

function enviarFormulario() {
  fireEvent.submit(screen.getByRole("form", { name: "Enviar foto de evolução" }));
}

describe("FormularioUpload", () => {
  beforeEach(() => {
    vi.mocked(enviarFoto).mockReset();
    mockRefresh.mockReset();
  });

  it("mostra a mensagem do erro da action (ex.: cota atingida)", async () => {
    vi.mocked(enviarFoto).mockRejectedValue(
      new Error("Você atingiu o limite de 100 fotos. Exclua fotos antigas para enviar novas."),
    );
    render(<FormularioUpload />);

    enviarFormulario();

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Você atingiu o limite de 100 fotos. Exclua fotos antigas para enviar novas.",
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("usa a mensagem padrão quando o erro não traz texto", async () => {
    vi.mocked(enviarFoto).mockRejectedValue("falha desconhecida");
    render(<FormularioUpload />);

    enviarFormulario();

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", MENSAGEM_PADRAO);
  });

  it("atualiza a página e não mostra erro quando o envio dá certo", async () => {
    vi.mocked(enviarFoto).mockResolvedValue(undefined);
    render(<FormularioUpload />);

    enviarFormulario();

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
