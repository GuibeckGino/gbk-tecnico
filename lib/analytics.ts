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
  });
}
