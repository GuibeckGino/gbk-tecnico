import { describe, expect, it } from "vitest";

import { buildCsvPreview, buildPdfPreview, formatFileSize, getFileNameFromUri } from "../lib/share-preview";

describe("pré-visualização de compartilhamento", () => {
  it("limita a prévia CSV ao número configurado de linhas e sinaliza conteúdo adicional", () => {
    expect(buildCsvPreview("cabeçalho\n1\n2\n3", 3)).toContain("A prévia mostra as primeiras 2 linhas");
    expect(buildCsvPreview("cabeçalho\n1", 3)).toBe("cabeçalho\n1");
  });

  it("resume os dados essenciais antes do compartilhamento do PDF", () => {
    const preview = buildPdfPreview({
      monthLabel: "Agosto 2026",
      total: 12,
      revenue: "R$ 840,00",
      paymentMode: "Fixo R$ 70",
      byType: { instalacao: 8, tipo3: 2, mudanca: 1, empresarial: 1 },
      growth: 10.5,
    });

    expect(preview).toContain("Faturamento: R$ 840,00");
    expect(preview).toContain("Comparativo com o mês anterior: +10.5%");
  });

  it("identifica o nome e formata o tamanho do arquivo antes do envio", () => {
    expect(getFileNameFromUri("file:///dados/relatorio%20agosto.pdf")).toBe("relatorio agosto.pdf");
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
