// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAcaoComErro } from "./use-acao-com-erro";

describe("useAcaoComErro", () => {
  it("começa sem erro e sem pending", () => {
    const { result } = renderHook(() => useAcaoComErro());

    expect(result.current.erro).toBeNull();
    expect(result.current.isPending).toBe(false);
  });

  it("limpa erro anterior e mantém null quando a ação dá certo", async () => {
    const { result } = renderHook(() => useAcaoComErro());

    act(() => {
      result.current.executar(() => Promise.resolve());
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.erro).toBeNull();
  });

  it("guarda a mensagem do erro lançado pela ação", async () => {
    const { result } = renderHook(() => useAcaoComErro());

    act(() => {
      result.current.executar(() =>
        Promise.reject(new Error("mensagem original do throw")),
      );
    });

    await waitFor(() =>
      expect(result.current.erro).toBe("mensagem original do throw"),
    );
    expect(result.current.isPending).toBe(false);
  });

  it("usa mensagem genérica quando o erro lançado não é um Error", async () => {
    const { result } = renderHook(() => useAcaoComErro());

    act(() => {
      result.current.executar(() => Promise.reject("string qualquer"));
    });

    await waitFor(() =>
      expect(result.current.erro).toBe("Não foi possível concluir a ação."),
    );
  });
});
