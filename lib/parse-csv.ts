import type { Installation, ServiceType } from "@/types/installation";

export interface ImportRow {
  cliente: string;
  bairro: string;
  tipoServico: ServiceType;
  data: string;
  valor?: number;
  observacoes?: string;
}

export interface ParseResult {
  valid: ImportRow[];
  invalid: Array<{ row: number; error: string; data: Record<string, string> }>;
}

/**
 * Parse CSV content and validate rows
 * Expected columns: cliente, bairro, tipoServico, data, valor (optional), observacoes (optional)
 */
export function parseCSV(content: string): ParseResult {
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    return { valid: [], invalid: [] };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

  const clienteIdx = headers.indexOf("cliente");
  const bairroIdx = headers.indexOf("bairro");
  const tipoIdx = headers.indexOf("tiposervico");
  const dataIdx = headers.indexOf("data");
  const valorIdx = headers.indexOf("valor");
  const obsIdx = headers.indexOf("observacoes");

  if (clienteIdx === -1 || bairroIdx === -1 || tipoIdx === -1 || dataIdx === -1) {
    return {
      valid: [],
      invalid: [
        {
          row: 1,
          error: "Cabeçalho inválido. Colunas obrigatórias: cliente, bairro, tipoServico, data",
          data: {},
        },
      ],
    };
  }

  const valid: ImportRow[] = [];
  const invalid: Array<{ row: number; error: string; data: Record<string, string> }> = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((v) => v.trim());
    const rowData: Record<string, string> = {};

    const cliente = values[clienteIdx];
    const bairro = values[bairroIdx];
    const tipoServico = values[tipoIdx];
    const data = values[dataIdx];
    const valor = valorIdx !== -1 ? values[valorIdx] : undefined;
    const observacoes = obsIdx !== -1 ? values[obsIdx] : undefined;

    rowData.cliente = cliente;
    rowData.bairro = bairro;
    rowData.tipoServico = tipoServico;
    rowData.data = data;
    if (valor) rowData.valor = valor;
    if (observacoes) rowData.observacoes = observacoes;

    // Validate
    const errors: string[] = [];

    if (!cliente || !cliente.trim()) {
      errors.push("Cliente é obrigatório");
    }

    if (!bairro || !bairro.trim()) {
      errors.push("Bairro é obrigatório");
    }

    if (!tipoServico || !tipoServico.trim()) {
      errors.push("Tipo de Serviço é obrigatório");
    } else if (!["Instalação", "Tipo 3", "Mudança", "Empresarial"].includes(tipoServico)) {
      errors.push(`Tipo de Serviço inválido: ${tipoServico}`);
    }

    if (!data || !data.trim()) {
      errors.push("Data é obrigatória");
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
      errors.push(`Data inválida: ${data} (use dd/mm/aaaa)`);
    } else {
      const [d, m, a] = data.split("/");
      const dia = parseInt(d);
      const mes = parseInt(m);
      const ano = parseInt(a);

      if (mes < 1 || mes > 12) {
        errors.push(`Mês inválido: ${mes}`);
      }
      if (dia < 1 || dia > 31) {
        errors.push(`Dia inválido: ${dia}`);
      }
      if (ano < 2000 || ano > 2100) {
        errors.push(`Ano inválido: ${ano}`);
      }
    }

    if (valor) {
      const valorNum = parseFloat(valor);
      if (isNaN(valorNum) || valorNum <= 0) {
        errors.push(`Valor inválido: ${valor}`);
      }
    }

    if (errors.length > 0) {
      invalid.push({
        row: i + 1,
        error: errors.join("; "),
        data: rowData,
      });
    } else {
      valid.push({
        cliente: cliente.trim(),
        bairro: bairro.trim(),
        tipoServico: tipoServico.trim() as ServiceType,
        data: data.trim(),
        valor: valor ? parseFloat(valor) : undefined,
        observacoes: observacoes ? observacoes.trim() : undefined,
      });
    }
  }

  return { valid, invalid };
}

/**
 * Convert ImportRow to Installation
 */
export function importRowToInstallation(row: ImportRow): Installation {
  return {
    id: Math.random().toString(36).substring(2, 11),
    cliente: row.cliente,
    endereco: row.bairro,
    tipoServico: row.tipoServico,
    data: row.data,
    observacoes: row.observacoes || "",
    createdAt: new Date().toISOString(),
    isFavorito: false,
  };
}
