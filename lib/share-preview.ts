export function buildCsvPreview(csv: string, maxLines = 12): string {
  const lines = csv.split("\n");
  const visibleLines = lines.slice(0, maxLines).join("\n");
  return lines.length > maxLines
    ? `${visibleLines}\n…\n\nA prévia mostra as primeiras ${maxLines - 1} linhas do arquivo.`
    : visibleLines;
}

export function getFileNameFromUri(uri: string): string {
  const cleanUri = uri.split("?")[0] ?? uri;
  const segment = cleanUri.split("/").filter(Boolean).pop();
  return segment ? decodeURIComponent(segment) : "arquivo";
}

export function formatFileSize(bytes: number | undefined): string {
  const safeBytes = Math.max(0, bytes ?? 0);
  if (safeBytes < 1024) return `${safeBytes} B`;
  if (safeBytes < 1024 * 1024) return `${(safeBytes / 1024).toFixed(1)} KB`;
  return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
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
