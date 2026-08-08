// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BotaoComConfirmacao } from "./botao-com-confirmacao";

describe("BotaoComConfirmacao", () => {
  const mockAction = vi.fn();
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockAction.mockReset();
    confirmSpy = vi.spyOn(window, "confirm");
  });

  it("não chama a action se o usuário cancelar a confirmação", () => {
    confirmSpy.mockReturnValue(false);
    render(
      <BotaoComConfirmacao label="Rejeitar" mensagemConfirmacao="Tem certeza?" action={mockAction} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Rejeitar" }));

    expect(confirmSpy).toHaveBeenCalledWith("Tem certeza?");
    expect(mockAction).not.toHaveBeenCalled();
  });

  it("chama a action se o usuário confirmar", async () => {
    confirmSpy.mockReturnValue(true);
    mockAction.mockResolvedValue(undefined);
    render(
      <BotaoComConfirmacao label="Rejeitar" mensagemConfirmacao="Tem certeza?" action={mockAction} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Rejeitar" }));

    await waitFor(() => expect(mockAction).toHaveBeenCalledTimes(1));
  });
});
