export type ServiceType = "Instalação" | "Tipo 3" | "Mudança" | "Empresarial";
export type PaymentMode = "meta" | "fixo65" | "fixo70";

export interface CustomPrices {
  instalacao: number;
  tipo3: number;
  mudanca: number;
  empresarial: number;
}

export interface Installation {
  id: string;
  cliente: string;
  endereco: string;
  tipoServico: ServiceType;
  data: string; // formato dd/mm/aaaa
  observacoes: string;
  createdAt: string; // ISO string
  isFavorito?: boolean; // marcado como favorito
}

export interface InstallationStats {
  total: number;
  valorTotal: number;
  valorIndividual: number; // 65, 70 ou 100
  porTipo: {
    instalacao: number;
    tipo3: number;
    mudanca: number;
    empresarial: number;
  };
}

/**
 * Verifica se a data da instalação é anterior a 1 de agosto de 2026 (dd/mm/aaaa)
 */
export function isAnteriorAgnosto2026(dataStr: string): boolean {
  if (!dataStr || typeof dataStr !== "string") return false;
  const parts = dataStr.split("/");
  if (parts.length !== 3) return false;
  const dia = parseInt(parts[0], 10);
  const mes = parseInt(parts[1], 10);
  const ano = parseInt(parts[2], 10);

  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return false;
  if (ano < 2026) return true;
  if (ano === 2026 && mes < 8) return true;
  return false;
}

export function calcularValorPorTipo(
  tipoServico: ServiceType,
  totalInstalacoes: number,
  paymentMode: PaymentMode,
  customPrices?: CustomPrices,
  dataInstalacao?: string
): number {
  // Empresarial sempre é R$100 (ou preço customizado se fornecido)
  if (tipoServico === "Empresarial") {
    if (customPrices && customPrices.empresarial > 0) {
      return customPrices.empresarial;
    }
    return 100;
  }

  // Tipo 3: vale R$ 60 apenas a partir de 01/08/2026. Antes disso, segue o padrão ou preço customizado.
  if (tipoServico === "Tipo 3") {
    if (customPrices && customPrices.tipo3 > 0) {
      return customPrices.tipo3;
    }
    if (dataInstalacao && isAnteriorAgnosto2026(dataInstalacao)) {
      // Antes de agosto de 2026, Tipo 3 seguia o valor padrão de Instalação/Mudança ou 50
      return paymentMode === "fixo70" ? 70 : 65;
    }
    return 60; // A partir de agosto de 2026
  }

  // Mudança customizada
  if (tipoServico === "Mudança" && customPrices && customPrices.mudanca > 0) {
    return customPrices.mudanca;
  }

  // Instalação customizada
  if (tipoServico === "Instalação" && customPrices && customPrices.instalacao > 0) {
    return customPrices.instalacao;
  }

  // Outros tipos seguem o modo de pagamento
  if (paymentMode === "fixo65") {
    return 65;
  }

  if (paymentMode === "fixo70") {
    return 70;
  }

  // Meta progressiva: < 104 = 65, >= 104 = 70
  if (paymentMode === "meta") {
    return totalInstalacoes >= 104 ? 70 : 65;
  }

  return 65; // padrão
}

export function calcularStats(
  instalacoes: Installation[],
  paymentMode: PaymentMode = "meta",
  customPrices?: CustomPrices
): InstallationStats {
  const total = instalacoes.length;

  let valorTotal = 0;
  instalacoes.forEach((inst) => {
    valorTotal += calcularValorPorTipo(inst.tipoServico, total, paymentMode, customPrices, inst.data);
  });

  const valorIndividual = total > 0 ? calcularValorPorTipo("Instalação", total, paymentMode, customPrices, instalacoes[0]?.data) : 65;

  const porTipo = instalacoes.reduce(
    (acc, inst) => {
      if (inst.tipoServico === "Instalação") acc.instalacao++;
      else if (inst.tipoServico === "Tipo 3") acc.tipo3++;
      else if (inst.tipoServico === "Mudança") acc.mudanca++;
      else if (inst.tipoServico === "Empresarial") acc.empresarial++;
      return acc;
    },
    { instalacao: 0, tipo3: 0, mudanca: 0, empresarial: 0 }
  );

  return { total, valorTotal, valorIndividual, porTipo };
}

export function gerarId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
