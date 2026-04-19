import type { Installation } from "@/types/installation";

export interface ReportData {
  mes: number;
  ano: number;
  mesAnoFormatado: string;
  instalacoes: Installation[];
  paymentMode: "meta" | "fixo65" | "fixo70";
  stats: {
    total: number;
    valorTotal: number;
    porTipo: {
      instalacao: number;
      tipo3: number;
      mudanca: number;
      empresarial: number;
    };
  };
  mesAnterior?: {
    total: number;
    valorTotal: number;
  };
  ultimosMeses?: Array<{
    mes: number;
    ano: number;
    total: number;
    valorTotal: number;
  }>;
}

/**
 * Gera dados estruturados para o relatório PDF
 * Inclui resumo, análise por tipo, comparativos e top clientes
 */
export function prepararDadosRelatorio(
  instalacoes: Installation[],
  mes: number,
  ano: number,
  paymentMode: "meta" | "fixo65" | "fixo70"
): ReportData {
  // Filtrar instalações do mês
  const instalacoesDoMes = instalacoes.filter((inst) => {
    const [d, m, a] = inst.data.split("/");
    return parseInt(m) === mes && parseInt(a) === ano;
  });

  // Calcular stats
  const total = instalacoesDoMes.length;
  let valorTotal = 0;

  instalacoesDoMes.forEach((inst) => {
    if (inst.tipoServico === "Empresarial") {
      valorTotal += 100;
    } else {
      if (paymentMode === "fixo65") {
        valorTotal += 65;
      } else if (paymentMode === "fixo70") {
        valorTotal += 70;
      } else {
        valorTotal += total >= 104 ? 70 : 65;
      }
    }
  });

  const porTipo = {
    instalacao: instalacoesDoMes.filter((i) => i.tipoServico === "Instalação")
      .length,
    tipo3: instalacoesDoMes.filter((i) => i.tipoServico === "Tipo 3").length,
    mudanca: instalacoesDoMes.filter((i) => i.tipoServico === "Mudança").length,
    empresarial: instalacoesDoMes.filter((i) => i.tipoServico === "Empresarial")
      .length,
  };

  // Calcular mês anterior
  let mesAnterior = { total: 0, valorTotal: 0 };
  let mesAnteriorNum = mes - 1;
  let anoAnterior = ano;
  if (mesAnteriorNum === 0) {
    mesAnteriorNum = 12;
    anoAnterior = ano - 1;
  }

  const instalacoesAnterior = instalacoes.filter((inst) => {
    const [d, m, a] = inst.data.split("/");
    return parseInt(m) === mesAnteriorNum && parseInt(a) === anoAnterior;
  });

  mesAnterior.total = instalacoesAnterior.length;
  instalacoesAnterior.forEach((inst) => {
    if (inst.tipoServico === "Empresarial") {
      mesAnterior.valorTotal += 100;
    } else {
      if (paymentMode === "fixo65") {
        mesAnterior.valorTotal += 65;
      } else if (paymentMode === "fixo70") {
        mesAnterior.valorTotal += 70;
      } else {
        mesAnterior.valorTotal +=
          instalacoesAnterior.length >= 104 ? 70 : 65;
      }
    }
  });

  // Calcular últimos 6 meses
  const ultimosMeses = [];
  for (let i = 5; i >= 0; i--) {
    let m = mes - i;
    let a = ano;
    if (m <= 0) {
      m += 12;
      a -= 1;
    }

    const instsMes = instalacoes.filter((inst) => {
      const [d, mm, aa] = inst.data.split("/");
      return parseInt(mm) === m && parseInt(aa) === a;
    });

    let valorMes = 0;
    instsMes.forEach((inst) => {
      if (inst.tipoServico === "Empresarial") {
        valorMes += 100;
      } else {
        if (paymentMode === "fixo65") {
          valorMes += 65;
        } else if (paymentMode === "fixo70") {
          valorMes += 70;
        } else {
          valorMes += instsMes.length >= 104 ? 70 : 65;
        }
      }
    });

    ultimosMeses.push({
      mes: m,
      ano: a,
      total: instsMes.length,
      valorTotal: valorMes,
    });
  }

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return {
    mes,
    ano,
    mesAnoFormatado: `${meses[mes - 1]} de ${ano}`,
    instalacoes: instalacoesDoMes,
    paymentMode,
    stats: {
      total,
      valorTotal,
      porTipo,
    },
    mesAnterior,
    ultimosMeses,
  };
}

/**
 * Calcula estatísticas por cliente (top 5)
 */
export function calcularTopClientes(
  instalacoes: Installation[],
  paymentMode: "meta" | "fixo65" | "fixo70"
): Array<{
  cliente: string;
  quantidade: number;
  valorTotal: number;
}> {
  const clienteMap = new Map<
    string,
    { quantidade: number; valorTotal: number }
  >();

  instalacoes.forEach((inst) => {
    const existing = clienteMap.get(inst.cliente) || {
      quantidade: 0,
      valorTotal: 0,
    };

    let valor = 0;
    if (inst.tipoServico === "Empresarial") {
      valor = 100;
    } else {
      valor =
        paymentMode === "fixo65"
          ? 65
          : paymentMode === "fixo70"
            ? 70
            : 65; // padrão meta
    }

    clienteMap.set(inst.cliente, {
      quantidade: existing.quantidade + 1,
      valorTotal: existing.valorTotal + valor,
    });
  });

  return Array.from(clienteMap.entries())
    .map(([cliente, data]) => ({
      cliente,
      ...data,
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);
}

/**
 * Formata valor em moeda BRL
 */
export function formatarValor(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Calcula percentual de crescimento
 */
export function calcularCrescimento(
  valorAtual: number,
  valorAnterior: number
): number {
  if (valorAnterior === 0) return 0;
  return ((valorAtual - valorAnterior) / valorAnterior) * 100;
}
