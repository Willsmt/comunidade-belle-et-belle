// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormularioPerfil } from "./formulario-perfil";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("./actions", () => ({
  atualizarPerfil: vi.fn(),
}));

describe("FormularioPerfil", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("não avisa sobre FieldControl não-controlado quando o nome muda entre renders", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { rerender } = render(
      <FormularioPerfil perfil={null} nome="Nome Antigo" fotoUrl={null} />,
    );

    rerender(
      <FormularioPerfil perfil={null} nome="Nome Novo" fotoUrl={null} />,
    );

    const mensagens = errorSpy.mock.calls.map((chamada) => chamada.join(" "));
    expect(mensagens.some((mensagem) => mensagem.includes("Base UI"))).toBe(
      false,
    );
  });

  it("mantém o valor digitado no campo nome mesmo se o prop nome mudar depois", () => {
    const { rerender } = render(
      <FormularioPerfil perfil={null} nome="Nome Antigo" fotoUrl={null} />,
    );

    const campoNome = screen.getByLabelText(/nome de exibição/i);
    expect(campoNome).toHaveValue("Nome Antigo");

    rerender(
      <FormularioPerfil perfil={null} nome="Nome Novo" fotoUrl={null} />,
    );

    expect(screen.getByLabelText(/nome de exibição/i)).toHaveValue(
      "Nome Antigo",
    );
  });
});
