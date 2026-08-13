// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { HeaderPrincipal } from "./header-principal";

vi.mock("@/lib/auth/actions", () => ({
  sair: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("HeaderPrincipal", () => {
  it("mostra o wordmark Belle et Belle", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<HeaderPrincipal papeis={[]} />);

    expect(screen.getByText("Belle et Belle")).toBeInTheDocument();
  });

  it("mostra o botão de Sair", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<HeaderPrincipal papeis={[]} />);

    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });

  it("mostra a nav de desktop só com Feed quando a pessoa não acumula nenhum papel de área", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<HeaderPrincipal papeis={[]} />);

    expect(
      screen.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Feed" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /área da cliente/i }),
    ).not.toBeInTheDocument();
  });

  it("inclui Área da cliente, Área da parceria e Painel conforme os papéis", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<HeaderPrincipal papeis={["CLIENTE", "GESTORA", "PARCERIA"]} />);

    expect(
      screen.getByRole("link", { name: /área da cliente/i }),
    ).toHaveAttribute("href", "/cliente/medidas");
    expect(
      screen.getByRole("link", { name: /área da parceria/i }),
    ).toHaveAttribute("href", "/parceria/planos");
    expect(screen.getByRole("link", { name: "Painel" })).toHaveAttribute(
      "href",
      "/painel/aprovacoes",
    );
  });

  it("indica a rota ativa com destaque visual", () => {
    vi.mocked(usePathname).mockReturnValue("/painel/membros");
    render(<HeaderPrincipal papeis={["ADMIN"]} />);

    expect(screen.getByRole("link", { name: "Painel" })).toHaveClass(
      "text-primary",
    );
    expect(screen.getByRole("link", { name: "Feed" })).not.toHaveClass(
      "text-primary",
    );
  });

  it("marca só Desafios como ativo em /cliente/desafios, não Área da cliente também", () => {
    vi.mocked(usePathname).mockReturnValue("/cliente/desafios");
    render(<HeaderPrincipal papeis={["CLIENTE"]} />);

    expect(screen.getByRole("link", { name: "Desafios" })).toHaveClass(
      "text-primary",
    );
    expect(
      screen.getByRole("link", { name: "Área da cliente" }),
    ).not.toHaveClass("text-primary");
  });

  it("mostra o ícone de perfil pra quem tem papel CLIENTE, linkando pro perfil público próprio", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<HeaderPrincipal papeis={["CLIENTE"]} userId="cliente-1" />);

    expect(screen.getByRole("link", { name: /meu perfil/i })).toHaveAttribute(
      "href",
      "/perfil/cliente-1",
    );
  });

  it("não mostra o ícone de perfil pra quem não tem papel CLIENTE", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<HeaderPrincipal papeis={["GESTORA"]} userId="gestora-1" />);

    expect(
      screen.queryByRole("link", { name: /meu perfil/i }),
    ).not.toBeInTheDocument();
  });

  it("não mostra o ícone de perfil se o userId não estiver disponível, mesmo com papel CLIENTE", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<HeaderPrincipal papeis={["CLIENTE"]} />);

    expect(
      screen.queryByRole("link", { name: /meu perfil/i }),
    ).not.toBeInTheDocument();
  });
});
