import { calcularValorPorTipo, type Installation, type PaymentMode } from "@/types/installation";

export type PaymentModesByMonth = Record<string, PaymentMode>;

function getMonthKey(mes: number, ano: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

function calcularValorDoMes(instalacao: Installation, totalDoMes: number, modo: PaymentMode): number {
  return calcularValorPorTipo(instalacao.tipoServico, totalDoMes, modo);
}

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
  paymentMode: PaymentMode,
  paymentModesByMonth: PaymentModesByMonth = {}
): ReportData {
  // Filtrar instalações do mês
  const instalacoesDoMes = instalacoes.filter((inst) => {
    const [d, m, a] = inst.data.split("/");
    return parseInt(m) === mes && parseInt(a) === ano;
  });

  // Calcular stats usando o modo específico do mês selecionado
  const total = instalacoesDoMes.length;
  const modoDoMes = paymentModesByMonth[getMonthKey(mes, ano)] || paymentMode;
  const valorTotal = instalacoesDoMes.reduce(
    (totalAtual, inst) => totalAtual + calcularValorDoMes(inst, total, modoDoMes),
    0,
  );

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
  const modoDoMesAnterior = paymentModesByMonth[getMonthKey(mesAnteriorNum, anoAnterior)] || "meta";
  mesAnterior.valorTotal = instalacoesAnterior.reduce(
    (totalAtual, inst) => totalAtual + calcularValorDoMes(inst, mesAnterior.total, modoDoMesAnterior),
    0,
  );

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

    const modoDoMesHistorico = paymentModesByMonth[getMonthKey(m, a)] || "meta";
    const valorMes = instsMes.reduce(
      (totalAtual, inst) => totalAtual + calcularValorDoMes(inst, instsMes.length, modoDoMesHistorico),
      0,
    );

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
    paymentMode: modoDoMes,
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
  paymentMode: PaymentMode,
  paymentModesByMonth: PaymentModesByMonth = {}
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

    const [, mes, ano] = inst.data.split('/').map(Number);
    const chave = getMonthKey(mes, ano);
    const totalDoMes = instalacoes.filter((item) => {
      const [, mesDoItem, anoDoItem] = item.data.split('/').map(Number);
      return mesDoItem === mes && anoDoItem === ano;
    }).length;
    const modoDoMes = paymentModesByMonth[chave] || paymentMode;
    const valor = calcularValorDoMes(inst, totalDoMes, modoDoMes);

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
