export function buildCsvPreview(csv: string, maxLines = 12): string {
  const lines = csv.split("\n");
  const visibleLines = lines.slice(0, maxLines).join("\n");
  return lines.length > maxLines
    ? `${visibleLines}\n…\n\nA prévia mostra as primeiras ${maxLines - 1} linhas do arquivo.`
    : visibleLines;
}

export function buildPdfPreview(input: {
  monthLabel: string;
  total: number;
  revenue: string;
  paymentMode: string;
  byType: { instalacao: number; tipo3: number; mudanca: number; empresarial: number };
  growth: number;
}): string {
  return [
    "RELATÓRIO GBK TÉCNICO",
    input.monthLabel,
    "",
    `Total de OS: ${input.total}`,
    `Faturamento: ${input.revenue}`,
    `Modo de pagamento: ${input.paymentMode}`,
    "",
    "POR TIPO DE SERVIÇO",
    `Instalação: ${input.byType.instalacao}`,
    `Tipo 3: ${input.byType.tipo3}`,
    `Mudança: ${input.byType.mudanca}`,
    `Empresarial: ${input.byType.empresarial}`,
    "",
    `Comparativo com o mês anterior: ${input.growth >= 0 ? "+" : ""}${input.growth.toFixed(1)}%`,
  ].join("\n");
}
