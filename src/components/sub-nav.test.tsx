// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { SubNav } from "./sub-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// O <a href> real do Link dispara a navegação padrão do browser ao ser
// clicado, que o jsdom não implementa ("Not implemented: navigation to
// another Document" — só ruído no teste). O Next real sempre chama
// preventDefault() antes de rotear no client; replicamos isso aqui pros
// testes que clicam num item da lista, sem depender do RouterContext.
vi.mock("next/link", () => ({
  default: ({ href, children, onClick, ...props }: ComponentProps<"a">) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  ),
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

    const desktop = screen.getByTestId("subnav-desktop");
    expect(desktop).toHaveClass("md:justify-center");
    expect(desktop).toHaveClass("overflow-x-auto", "scrollbar-none");
  });

  it("mobile: mostra o item ativo no trigger, fechado por padrão", () => {
    vi.mocked(usePathname).mockReturnValue("/cliente/perfil");
    render(<SubNav ariaLabel="Área da cliente" links={links} />);

    const trigger = screen.getByTestId("subnav-trigger");
    expect(trigger).toHaveTextContent("Meu perfil");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("subnav-lista")).not.toBeInTheDocument();
  });

  it("mobile: tocar no trigger expande a lista com todos os itens, incluindo o ativo destacado", () => {
    vi.mocked(usePathname).mockReturnValue("/cliente/perfil");
    render(<SubNav ariaLabel="Área da cliente" links={links} />);

    fireEvent.click(screen.getByTestId("subnav-trigger"));

    expect(screen.getByTestId("subnav-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    const lista = screen.getByTestId("subnav-lista");
    expect(
      within(lista).getByRole("link", { name: "Minhas medidas" }),
    ).toBeInTheDocument();
    expect(within(lista).getByRole("link", { name: "Meu perfil" })).toHaveClass(
      "bg-secondary",
    );
  });

  it("mobile: tocar no trigger de novo recolhe a lista", () => {
    vi.mocked(usePathname).mockReturnValue("/cliente/medidas");
    render(<SubNav ariaLabel="Área da cliente" links={links} />);

    const trigger = screen.getByTestId("subnav-trigger");
    fireEvent.click(trigger);
    expect(screen.getByTestId("subnav-lista")).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByTestId("subnav-lista")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("mobile: tocar num item da lista recolhe de volta", () => {
    vi.mocked(usePathname).mockReturnValue("/cliente/medidas");
    render(<SubNav ariaLabel="Área da cliente" links={links} />);

    fireEvent.click(screen.getByTestId("subnav-trigger"));
    const lista = screen.getByTestId("subnav-lista");
    fireEvent.click(within(lista).getByRole("link", { name: "Meu perfil" }));

    expect(screen.queryByTestId("subnav-lista")).not.toBeInTheDocument();
    expect(screen.getByTestId("subnav-trigger")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
