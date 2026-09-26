import { describe, expect, it, vi } from "vitest";
import { AppError, executarAction } from "./executar-action";

describe("executarAction", () => {
  it("retorna o resultado normalmente quando não há erro", async () => {
    const resultado = await executarAction(async () => "ok");
    expect(resultado).toBe("ok");
  });

  it("relança AppError com a mensagem original intacta", async () => {
    await expect(
      executarAction(async () => {
        throw new AppError("Informe o nome do emblema");
      }),
    ).rejects.toThrow("Informe o nome do emblema");
  });

  it("mascara erro não-AppError com mensagem genérica e loga o original", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      executarAction(async () => {
        throw new Error(
          "Database error. Code: `23001`. Message: `update or delete on table...`",
        );
      }),
    ).rejects.toThrow("Não foi possível concluir a ação.");

    expect(consoleSpy).toHaveBeenCalledWith(
      "Erro não tratado em Server Action:",
      expect.objectContaining({
        message: expect.stringContaining("Database error"),
      }),
    );

    consoleSpy.mockRestore();
  });

  it("relança sinal de redirect do Next sem mascarar", async () => {
    const erroDeRedirect = new Error("NEXT_REDIRECT");
    Object.assign(erroDeRedirect, { digest: "NEXT_REDIRECT;push;/feed;307;" });

    await expect(
      executarAction(async () => {
        throw erroDeRedirect;
      }),
    ).rejects.toBe(erroDeRedirect);
  });
});
