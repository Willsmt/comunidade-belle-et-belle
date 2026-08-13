// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { BottomNav } from "./bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("BottomNav", () => {
  it("mostra só o Feed quando a pessoa não acumula nenhum papel de área", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<BottomNav papeis={[]} />);

    expect(screen.getByRole("link", { name: /feed/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /área da cliente/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /área da parceria/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Painel" })).not.toBeInTheDocument();
  });

  it("mostra Área da cliente pro papel CLIENTE", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<BottomNav papeis={["CLIENTE"]} />);

    expect(
      screen.getByRole("link", { name: /área da cliente/i }),
    ).toHaveAttribute("href", "/cliente/medidas");
  });

  it("mostra Área da parceria pro papel PARCERIA", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<BottomNav papeis={["PARCERIA"]} />);

    expect(
      screen.getByRole("link", { name: /área da parceria/i }),
    ).toHaveAttribute("href", "/parceria/planos");
  });

  it("mostra Painel pros papéis GESTORA/ADMIN", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<BottomNav papeis={["GESTORA"]} />);

    expect(screen.getByRole("link", { name: "Painel" })).toHaveAttribute(
      "href",
      "/painel/aprovacoes",
    );
  });

  it("mostra várias áreas quando a pessoa acumula papéis (ex: Patty GESTORA + PARCERIA)", () => {
    vi.mocked(usePathname).mockReturnValue("/feed");
    render(<BottomNav papeis={["GESTORA", "PARCERIA"]} />);

    expect(
      screen.getByRole("link", { name: /área da parceria/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Painel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /área da cliente/i }),
    ).not.toBeInTheDocument();
  });

  it("indica a rota ativa com destaque visual", () => {
    vi.mocked(usePathname).mockReturnValue("/cliente/medidas");
    render(<BottomNav papeis={["CLIENTE"]} />);

    expect(
      screen.getByRole("link", { name: /área da cliente/i }),
    ).toHaveClass("text-primary");
    expect(screen.getByRole("link", { name: /feed/i })).not.toHaveClass(
      "text-primary",
    );
  });

  it("marca só Desafios como ativo em /cliente/desafios, não Área da cliente também", () => {
    vi.mocked(usePathname).mockReturnValue("/cliente/desafios");
    render(<BottomNav papeis={["CLIENTE"]} />);

    expect(screen.getByRole("link", { name: /^desafios$/i })).toHaveClass(
      "text-primary",
    );
    expect(
      screen.getByRole("link", { name: /área da cliente/i }),
    ).not.toHaveClass("text-primary");
  });

  it("não marca nenhum item como ativo fora das rotas conhecidas", () => {
    vi.mocked(usePathname).mockReturnValue("/bem-vinda");
    render(<BottomNav papeis={["CLIENTE"]} />);

    expect(screen.getByRole("link", { name: /feed/i })).not.toHaveClass(
      "text-primary",
    );
    expect(
      screen.getByRole("link", { name: /área da cliente/i }),
    ).not.toHaveClass("text-primary");
  });
});
