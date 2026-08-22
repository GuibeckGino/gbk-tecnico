import { describe, expect, it } from "vitest";
import { obterDataAtual, validarData } from "../lib/input-masks";

describe("preenchimento de data do cadastro", () => {
  it("formata a data atual no padrão brasileiro usado pelo calendário", () => {
    expect(obterDataAtual(new Date(2026, 7, 1))).toBe("01/08/2026");
    expect(obterDataAtual(new Date(2026, 11, 31))).toBe("31/12/2026");
  });

  it("produz uma data válida para o formulário", () => {
    expect(validarData(obterDataAtual(new Date(2026, 1, 28)))).toBe(true);
  });
});
