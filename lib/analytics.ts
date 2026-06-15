import type { Installation } from "@/types/installation";

export interface AnalyticsSemanal {
  semana: number;
  ano: number;
  totalInstalacoes: number;
  valorTotal: number;
  dataInicio: string;
  dataFim: string;
}

export interface AnalyticsCliente {
  cliente: string;
  totalInstalacoes: number;
  valorTotal: number;
  ultimaInstalacao: string;
  tiposServico: Record<string, number>;
}

export interface AnalyticsMesAMes {
  mes: number;
  ano: number;
  totalInstalacoes: number;
  valorTotal: number;
  crescimento: number; // percentual
}

export interface AnalyticsRentabilidade {
  cliente: string;
  totalInstalacoes: number;
  valorTotal: number;
  valorMedio: number;
  frequencia: number; // instalações por mês
  ultimaInstalacao: string;
}

export interface AnalyticsTendencias {
  periodo: string;
  totalInstalacoes: number;
  valorTotal: number;
  mediaMovel: number;
  tendencia: 'crescente' | 'decrescente' | 'estavel';
}

export function obterSemanaDoAno(data: string): number {
  const [d, m, a] = data.split("/");
  const date = new Date(parseInt(a), parseInt(m) - 1, parseInt(d));
  const inicio = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - inicio.getTime();
  const umDia = 1000 * 60 * 60 * 24;
  const semana = Math.floor(diff / (umDia * 7)) + 1;
  return semana;
}

export function analisarSemanal(instalacoes: Installation[]): AnalyticsSemanal[] {
  const mapa = new Map<string, Installation[]>();

  instalacoes.forEach((inst) => {
    const semana = obterSemanaDoAno(inst.data);
    const [, , a] = inst.data.split("/");
    const chave = `${a}-${semana}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, []);
    }
    mapa.get(chave)!.push(inst);
  });

  const resultado: AnalyticsSemanal[] = [];

  mapa.forEach((insts, chave) => {
    const [ano, semana] = chave.split("-");
    const totalInstalacoes = insts.length;
    const valorIndividual = totalInstalacoes >= 104 ? 70 : 65;
    const valorTotal = totalInstalacoes * valorIndividual;

    resultado.push({
      semana: parseInt(semana),
      ano: parseInt(ano),
      totalInstalacoes,
      valorTotal,
      dataInicio: insts[0].data,
      dataFim: insts[insts.length - 1].data,
    });
  });

  return resultado.sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano;
    return b.semana - a.semana;
  });
}

export function analisarPorCliente(instalacoes: Installation[]): AnalyticsCliente[] {
  const mapa = new Map<string, Installation[]>();

  instalacoes.forEach((inst) => {
    if (!mapa.has(inst.cliente)) {
      mapa.set(inst.cliente, []);
    }
    mapa.get(inst.cliente)!.push(inst);
  });

  const resultado: AnalyticsCliente[] = [];

  mapa.forEach((insts, cliente) => {
    const totalInstalacoes = insts.length;
    const valorIndividual = totalInstalacoes >= 104 ? 70 : 65;
    const valorTotal = totalInstalacoes * valorIndividual;

    const tiposServico: Record<string, number> = {};
    insts.forEach((inst) => {
      tiposServico[inst.tipoServico] = (tiposServico[inst.tipoServico] || 0) + 1;
    });

    const ultimaInstalacao = insts.sort((a, b) => {
      const [dA, mA, aA] = a.data.split("/");
      const [dB, mB, aB] = b.data.split("/");
      const dateA = new Date(parseInt(aA), parseInt(mA) - 1, parseInt(dA));
      const dateB = new Date(parseInt(aB), parseInt(mB) - 1, parseInt(dB));
      return dateB.getTime() - dateA.getTime();
    })[0].data;

    resultado.push({
      cliente,
      totalInstalacoes,
      valorTotal,
      ultimaInstalacao,
      tiposServico,
    });
  });

  return resultado.sort((a, b) => b.totalInstalacoes - a.totalInstalacoes);
}

export function analisarRentabilidade(instalacoes: Installation[]): AnalyticsRentabilidade[] {
  const mapa = new Map<string, Installation[]>();

  instalacoes.forEach((inst) => {
    if (!mapa.has(inst.cliente)) {
      mapa.set(inst.cliente, []);
    }
    mapa.get(inst.cliente)!.push(inst);
  });

  const resultado: AnalyticsRentabilidade[] = [];

  mapa.forEach((insts, cliente) => {
    const totalInstalacoes = insts.length;
    const valorIndividual = totalInstalacoes >= 104 ? 70 : 65;
    const valorTotal = totalInstalacoes * valorIndividual;
    const valorMedio = valorTotal / totalInstalacoes;

    // Calcular frequência (instalações por mês)
    const meses = new Set<string>();
    insts.forEach((inst) => {
      const [, m, a] = inst.data.split('/');
      meses.add(`${a}-${m}`);
    });
    const frequencia = meses.size > 0 ? totalInstalacoes / meses.size : 0;

    const ultimaInstalacao = insts.sort((a, b) => {
      const [dA, mA, aA] = a.data.split('/');
      const [dB, mB, aB] = b.data.split('/');
      const dateA = new Date(parseInt(aA), parseInt(mA) - 1, parseInt(dA));
      const dateB = new Date(parseInt(aB), parseInt(mB) - 1, parseInt(dB));
      return dateB.getTime() - dateA.getTime();
    })[0].data;

    resultado.push({
      cliente,
      totalInstalacoes,
      valorTotal,
      valorMedio,
      frequencia,
      ultimaInstalacao,
    });
  });

  return resultado.sort((a, b) => b.valorTotal - a.valorTotal);
}

export function analisarTendencias(instalacoes: Installation[]): AnalyticsTendencias[] {
  const mapa = new Map<string, Installation[]>();

  instalacoes.forEach((inst) => {
    const [, m, a] = inst.data.split('/');
    const chave = `${a}-${m}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, []);
    }
    mapa.get(chave)!.push(inst);
  });

  const resultado: AnalyticsTendencias[] = [];
  const valores: number[] = [];

  mapa.forEach((insts, chave) => {
    const [ano, mes] = chave.split('-');
    const totalInstalacoes = insts.length;
    const valorIndividual = totalInstalacoes >= 104 ? 70 : 65;
    const valorTotal = totalInstalacoes * valorIndividual;
    valores.push(valorTotal);

    resultado.push({
      periodo: `${mes}/${ano}`,
      totalInstalacoes,
      valorTotal,
      mediaMovel: 0, // será calculado depois
      tendencia: 'estavel',
    });
  });

  // Calcular média móvel e tendência
  resultado.forEach((item, idx) => {
    const inicio = Math.max(0, idx - 2);
    const fim = idx + 1;
    const mediaMovel = valores.slice(inicio, fim).reduce((a, b) => a + b, 0) / (fim - inicio);
    item.mediaMovel = mediaMovel;

    if (idx > 0) {
      const anterior = valores[idx - 1];
      const diferenca = item.valorTotal - anterior;
      if (diferenca > anterior * 0.05) {
        item.tendencia = 'crescente';
      } else if (diferenca < -anterior * 0.05) {
        item.tendencia = 'decrescente';
      }
    }
  });

  return resultado.sort((a, b) => {
    const [mesA, anoA] = a.periodo.split('/');
    const [mesB, anoB] = b.periodo.split('/');
    if (parseInt(anoA) !== parseInt(anoB)) return parseInt(anoB) - parseInt(anoA);
    return parseInt(mesB) - parseInt(mesA);
  });
}

export function analisarMesAMes(instalacoes: Installation[]): AnalyticsMesAMes[] {
  const mapa = new Map<string, Installation[]>();

  instalacoes.forEach((inst) => {
    const [, m, a] = inst.data.split("/");
    const chave = `${a}-${m}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, []);
    }
    mapa.get(chave)!.push(inst);
  });

  const resultado: AnalyticsMesAMes[] = [];
  let mesAnterior: AnalyticsMesAMes | null = null;

  mapa.forEach((insts, chave) => {
    const [ano, mes] = chave.split("-");
    const totalInstalacoes = insts.length;
    const valorIndividual = totalInstalacoes >= 104 ? 70 : 65;
    const valorTotal = totalInstalacoes * valorIndividual;

    let crescimento = 0;
    if (mesAnterior && mesAnterior.valorTotal > 0) {
      crescimento = ((valorTotal - mesAnterior.valorTotal) / mesAnterior.valorTotal) * 100;
    }

    const analise: AnalyticsMesAMes = {
      mes: parseInt(mes),
      ano: parseInt(ano),
      totalInstalacoes,
      valorTotal,
      crescimento,
    };

    resultado.push(analise);
    mesAnterior = analise;
  });

  return resultado.sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano;
    return b.mes - a.mes;
  }).slice(0, 12); // Limitar aos últimos 12 meses
}


// Interface para análise dia a dia comparativa entre meses
export interface AnalyticsDiaADia {
  dia: number;
  meses: Array<{
    mes: number;
    ano: number;
    acumulado: number; // Total acumulado até esse dia
    diario: number; // Apenas nesse dia
  }>;
}

/**
 * Calcula a progressão dia a dia comparando múltiplos meses
 * Retorna para cada dia do mês, quantas instalações foram feitas em cada mês
 */
export function analisarDiaADia(
  instalacoes: Array<{ data: string; tipoServico: string }>,
  mesReferencia?: number,
  anoReferencia?: number
): AnalyticsDiaADia[] {
  const hoje = new Date();
  const mesRef = mesReferencia ?? hoje.getMonth() + 1;
  const anoRef = anoReferencia ?? hoje.getFullYear();

  // Agrupar instalações por dia e mês
  const dadosPorDia: Record<
    number,
    Record<string, number> // dia -> "mes/ano" -> quantidade
  > = {};

  instalacoes.forEach((inst) => {
    const [dia, mes, ano] = inst.data.split("/").map(Number);

    if (!dadosPorDia[dia]) {
      dadosPorDia[dia] = {};
    }

    const chave = `${mes}/${ano}`;
    dadosPorDia[dia][chave] = (dadosPorDia[dia][chave] || 0) + 1;
  });

  // Obter todos os meses únicos presentes nos dados
  const mesesUnicos = new Set<string>();
  Object.values(dadosPorDia).forEach((dias) => {
    Object.keys(dias).forEach((chave) => mesesUnicos.add(chave));
  });

  // Converter para array e ordenar
  const mesesArray = Array.from(mesesUnicos)
    .map((chave) => {
      const [mes, ano] = chave.split("/").map(Number);
      return { mes, ano, chave };
    })
    .sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });

  // Construir resultado para cada dia
  const resultado: AnalyticsDiaADia[] = [];

  for (let dia = 1; dia <= 31; dia++) {
    const dadosDia = dadosPorDia[dia] || {};

    const meses = mesesArray.map(({ mes, ano, chave }) => {
      const diario = dadosDia[chave] || 0;

      // Calcular acumulado até esse dia
      let acumulado = 0;
      for (let d = 1; d <= dia; d++) {
        acumulado += dadosPorDia[d]?.[chave] || 0;
      }

      return {
        mes,
        ano,
        acumulado,
        diario,
      };
    });

    // Apenas incluir dias que têm dados em algum mês
    if (meses.some((m) => m.acumulado > 0)) {
      resultado.push({
        dia,
        meses,
      });
    }
  }

  return resultado;
}
