import { describe, it, expect } from "vitest";
import { calcularStats } from "../types/installation";
import type { Installation } from "../types/installation";

function criarInstalacoes(quantidade: number): Installation[] {
  return Array.from({ length: quantidade }, (_, i) => ({
    id: `id-${i}`,
    cliente: `Cliente ${i}`,
    endereco: `Rua ${i}`,
    tipoServico: "Instalação" as const,
    data: "01/01/2026",
    observacoes: "",
    createdAt: new Date().toISOString(),
  }));
}

describe("Regra financeira retroativa", () => {
  it("100 instalações = R$6500", () => {
    const stats = calcularStats(criarInstalacoes(100));
    expect(stats.total).toBe(100);
    expect(stats.valorIndividual).toBe(65);
    expect(stats.valorTotal).toBe(6500);
  });

  it("103 instalações = R$6695", () => {
    const stats = calcularStats(criarInstalacoes(103));
    expect(stats.total).toBe(103);
    expect(stats.valorIndividual).toBe(65);
    expect(stats.valorTotal).toBe(6695);
  });

  it("104 instalações = R$7280 (retroativo)", () => {
    const stats = calcularStats(criarInstalacoes(104));
    expect(stats.total).toBe(104);
    expect(stats.valorIndividual).toBe(70);
    expect(stats.valorTotal).toBe(7280);
  });

  it("105 instalações = R$7350", () => {
    const stats = calcularStats(criarInstalacoes(105));
    expect(stats.total).toBe(105);
    expect(stats.valorIndividual).toBe(70);
    expect(stats.valorTotal).toBe(7350);
  });

  it("110 instalações = R$7700", () => {
    const stats = calcularStats(criarInstalacoes(110));
    expect(stats.total).toBe(110);
    expect(stats.valorIndividual).toBe(70);
    expect(stats.valorTotal).toBe(7700);
  });

  it("0 instalações = R$0", () => {
    const stats = calcularStats([]);
    expect(stats.total).toBe(0);
    expect(stats.valorTotal).toBe(0);
  });

  it("contagem por tipo está correta", () => {
    const instalacoes: Installation[] = [
      ...criarInstalacoes(3),
      ...Array.from({ length: 2 }, (_, i) => ({
        id: `tipo3-${i}`,
        cliente: `C ${i}`,
        endereco: `R ${i}`,
        tipoServico: "Tipo 3" as const,
        data: "01/01/2026",
        observacoes: "",
        createdAt: new Date().toISOString(),
      })),
      {
        id: "mudanca-1",
        cliente: "M",
        endereco: "R",
        tipoServico: "Mudança" as const,
        data: "01/01/2026",
        observacoes: "",
        createdAt: new Date().toISOString(),
      },
    ];
    const stats = calcularStats(instalacoes);
    expect(stats.porTipo.instalacao).toBe(3);
    expect(stats.porTipo.tipo3).toBe(2);
    expect(stats.porTipo.mudanca).toBe(1);
  });
});
