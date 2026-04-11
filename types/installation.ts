export type ServiceType = "Instalação" | "Tipo 3" | "Mudança";

export interface Installation {
  id: string;
  cliente: string;
  endereco: string;
  tipoServico: ServiceType;
  data: string; // formato dd/mm/aaaa
  observacoes: string;
  createdAt: string; // ISO string
}

export interface InstallationStats {
  total: number;
  valorTotal: number;
  valorIndividual: number; // 65 ou 70
  porTipo: {
    instalacao: number;
    tipo3: number;
    mudanca: number;
  };
}

export function calcularStats(instalacoes: Installation[]): InstallationStats {
  const total = instalacoes.length;
  const valorIndividual = total >= 104 ? 70 : 65;
  const valorTotal = total * valorIndividual;

  const porTipo = instalacoes.reduce(
    (acc, inst) => {
      if (inst.tipoServico === "Instalação") acc.instalacao++;
      else if (inst.tipoServico === "Tipo 3") acc.tipo3++;
      else if (inst.tipoServico === "Mudança") acc.mudanca++;
      return acc;
    },
    { instalacao: 0, tipo3: 0, mudanca: 0 }
  );

  return { total, valorTotal, valorIndividual, porTipo };
}

export function gerarId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
