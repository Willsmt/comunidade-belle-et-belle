// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavPrincipal } from "./nav-principal";

describe("NavPrincipal", () => {
  it("mostra só o Feed quando a pessoa não acumula nenhum papel de área", () => {
    render(<NavPrincipal papeis={[]} />);

    expect(screen.getByRole("link", { name: "Feed" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /área da cliente/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /área da parceria/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Painel" })).not.toBeInTheDocument();
  });

  it("mostra Área da cliente pro papel CLIENTE", () => {
    render(<NavPrincipal papeis={["CLIENTE"]} />);

    expect(
      screen.getByRole("link", { name: /área da cliente/i }),
    ).toHaveAttribute("href", "/cliente/medidas");
  });

  it("mostra Área da parceria pro papel PARCERIA", () => {
    render(<NavPrincipal papeis={["PARCERIA"]} />);

    expect(
      screen.getByRole("link", { name: /área da parceria/i }),
    ).toHaveAttribute("href", "/parceria/planos");
  });

  it("mostra Painel pros papéis GESTORA/ADMIN", () => {
    render(<NavPrincipal papeis={["GESTORA"]} />);

    expect(screen.getByRole("link", { name: "Painel" })).toHaveAttribute(
      "href",
      "/painel/aprovacoes",
    );
  });

  it("mostra várias áreas quando a pessoa acumula papéis (ex: Patty GESTORA + PARCERIA)", () => {
    render(<NavPrincipal papeis={["GESTORA", "PARCERIA"]} />);

    expect(
      screen.getByRole("link", { name: /área da parceria/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Painel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /área da cliente/i }),
    ).not.toBeInTheDocument();
  });
});
