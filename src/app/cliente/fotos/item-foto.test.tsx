// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("./actions", () => ({
  alternarVisibilidadeFoto: vi.fn(),
  excluirFoto: vi.fn(),
}));

import { ItemFoto } from "./item-foto";
import { alternarVisibilidadeFoto, excluirFoto } from "./actions";

function renderizar(publica: boolean, totalPosts: number) {
  render(
    <ul>
      <ItemFoto
        fotoId="foto-1"
        urlAssinada="https://exemplo/foto-1"
        data="01/02/2026"
        publica={publica}
        totalPosts={totalPosts}
      />
    </ul>,
  );
}

describe("ItemFoto", () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.mocked(alternarVisibilidadeFoto).mockReset().mockResolvedValue(undefined);
    vi.mocked(excluirFoto).mockReset().mockResolvedValue(undefined);
    vi.restoreAllMocks();
    confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  describe("tornar privada", () => {
    it("sem posts: não pede confirmação", async () => {
      renderizar(true, 0);

      fireEvent.click(screen.getByRole("button", { name: "Tornar privada" }));

      await waitFor(() => expect(alternarVisibilidadeFoto).toHaveBeenCalledTimes(1));
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it("com 1 post: confirmação no singular", async () => {
      renderizar(true, 1);

      fireEvent.click(screen.getByRole("button", { name: "Tornar privada" }));

      expect(confirmSpy).toHaveBeenCalledWith(
        "Esta foto está em 1 post no feed. Ao torná-la privada, esse post será apagado. Deseja continuar?",
      );
      await waitFor(() => expect(alternarVisibilidadeFoto).toHaveBeenCalledTimes(1));
    });

    it("com N posts: confirmação no plural", () => {
      renderizar(true, 3);

      fireEvent.click(screen.getByRole("button", { name: "Tornar privada" }));

      expect(confirmSpy).toHaveBeenCalledWith(
        "Esta foto está em 3 posts no feed. Ao torná-la privada, esses posts serão apagados. Deseja continuar?",
      );
    });

    it("cancelar a confirmação não chama a action", () => {
      confirmSpy.mockReturnValue(false);
      renderizar(true, 2);

      fireEvent.click(screen.getByRole("button", { name: "Tornar privada" }));

      expect(alternarVisibilidadeFoto).not.toHaveBeenCalled();
    });
  });

  it("tornar pública nunca pede confirmação", async () => {
    renderizar(false, 0);

    fireEvent.click(screen.getByRole("button", { name: "Tornar pública" }));

    await waitFor(() => expect(alternarVisibilidadeFoto).toHaveBeenCalledTimes(1));
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  describe("excluir", () => {
    it("sem posts: mantém a confirmação atual", () => {
      renderizar(true, 0);

      fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

      expect(confirmSpy).toHaveBeenCalledWith(
        "Excluir essa foto de evolução? Essa ação não pode ser desfeita.",
      );
    });

    it("com 1 post: confirmação no singular", () => {
      renderizar(true, 1);

      fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

      expect(confirmSpy).toHaveBeenCalledWith(
        "Esta foto está em 1 post no feed, que também será apagado. Deseja excluir?",
      );
    });

    it("com N posts: confirmação no plural", () => {
      renderizar(true, 2);

      fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

      expect(confirmSpy).toHaveBeenCalledWith(
        "Esta foto está em 2 posts no feed, que também serão apagados. Deseja excluir?",
      );
    });
  });
});
