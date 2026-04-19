export type ServiceType = "Instalação" | "Tipo 3" | "Mudança" | "Empresarial";
export type PaymentMode = "meta" | "fixo65" | "fixo70";

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

export function calcularValorPorTipo(
  tipoServico: ServiceType,
  totalInstalacoes: number,
  paymentMode: PaymentMode
): number {
  // Empresarial sempre é R$100
  if (tipoServico === "Empresarial") {
    return 100;
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
  paymentMode: PaymentMode = "meta"
): InstallationStats {
  const total = instalacoes.length;

  // Calcular valor total considerando cada tipo
  let valorTotal = 0;
  instalacoes.forEach((inst) => {
    valorTotal += calcularValorPorTipo(inst.tipoServico, total, paymentMode);
  });

  // Valor individual é o valor do primeiro tipo (para referência)
  const valorIndividual = total > 0 ? calcularValorPorTipo("Instalação", total, paymentMode) : 65;

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
