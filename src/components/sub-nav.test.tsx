// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { SubNav } from "./sub-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

const links = [
  { href: "/cliente/medidas", label: "Minhas medidas" },
  { href: "/cliente/perfil", label: "Meu perfil" },
];

describe("SubNav", () => {
  it("renderiza a nav com o aria-label e os links recebidos", () => {
    vi.mocked(usePathname).mockReturnValue("/cliente/medidas");
    render(<SubNav ariaLabel="Área da cliente" links={links} />);

    expect(
      screen.getByRole("navigation", { name: "Área da cliente" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Minhas medidas" }),
    ).toHaveAttribute("href", "/cliente/medidas");
    expect(screen.getByRole("link", { name: "Meu perfil" })).toHaveAttribute(
      "href",
      "/cliente/perfil",
    );
  });

  it("destaca a aba da rota ativa", () => {
    vi.mocked(usePathname).mockReturnValue("/cliente/perfil");
    render(<SubNav ariaLabel="Área da cliente" links={links} />);

    expect(screen.getByRole("link", { name: "Meu perfil" })).toHaveClass(
      "bg-secondary",
    );
    expect(
      screen.getByRole("link", { name: "Minhas medidas" }),
    ).not.toHaveClass("bg-secondary");
  });

  it("centraliza as abas a partir de md:, mantendo scroll por toque abaixo disso", () => {
    vi.mocked(usePathname).mockReturnValue("/cliente/medidas");
    render(<SubNav ariaLabel="Área da cliente" links={links} />);

    const nav = screen.getByRole("navigation", { name: "Área da cliente" });
    expect(nav).toHaveClass("md:justify-center");
    expect(nav).toHaveClass("overflow-x-auto", "scrollbar-none");
  });
});
