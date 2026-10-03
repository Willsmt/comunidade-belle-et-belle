// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("./actions", () => ({
  enviarPlano: vi.fn(),
}));

import { FormularioEnvio } from "./formulario-envio";
import { enviarPlano } from "./actions";

const MENSAGEM_PADRAO =
  "Não foi possível enviar o plano. Confira os campos e o arquivo (PDF, até 5MB).";

function enviarFormulario() {
  fireEvent.submit(screen.getByRole("form", { name: "Enviar plano" }));
}

describe("FormularioEnvio", () => {
  beforeEach(() => {
    vi.mocked(enviarPlano).mockReset();
    mockRefresh.mockReset();
  });

  it("mostra a mensagem do erro da action (ex.: PDF inválido)", async () => {
    vi.mocked(enviarPlano).mockRejectedValue(new Error("Arquivo não é um PDF válido."));
    render(<FormularioEnvio clientes={[]} />);

    enviarFormulario();

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Arquivo não é um PDF válido.",
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("usa a mensagem padrão quando o erro não traz texto", async () => {
    vi.mocked(enviarPlano).mockRejectedValue("falha desconhecida");
    render(<FormularioEnvio clientes={[]} />);

    enviarFormulario();

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", MENSAGEM_PADRAO);
  });

  it("atualiza a página e não mostra erro quando o envio dá certo", async () => {
    vi.mocked(enviarPlano).mockResolvedValue(undefined);
    render(<FormularioEnvio clientes={[]} />);

    enviarFormulario();

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
