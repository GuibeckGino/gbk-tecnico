/**
 * Utilitário para cálculo de dias úteis (segunda a sábado)
 * Ignora domingos
 */

export interface MetaStats {
  diasUteisPassados: number;
  diasUteisRestantes: number;
  diasUteisTotais: number;
  metaDia: number;
  mediadiaria: number;
  projecao: number;
  hojeFeZ: number;
}

/**
 * Calcula dias úteis (segunda a sábado) entre duas datas
 * Ignora domingos (0)
 */
export function calcularDiasUteis(dataInicio: Date, dataFim: Date): number {
  let dias = 0;
  const data = new Date(dataInicio);

  while (data <= dataFim) {
    const diaSemana = data.getDay();
    // 0 = domingo, 1-6 = segunda a sábado
    if (diaSemana !== 0) {
      dias++;
    }
    data.setDate(data.getDate() + 1);
  }

  return dias;
}

/**
 * Retorna o primeiro dia útil do mês (segunda a sábado)
 */
export function getPrimeiroDiaUtilMes(mes: number, ano: number): Date {
  let data = new Date(ano, mes - 1, 1);
  const diaSemana = data.getDay();

  // Se for domingo, avança para segunda
  if (diaSemana === 0) {
    data.setDate(data.getDate() + 1);
  }

  return data;
}

/**
 * Retorna o último dia útil do mês (segunda a sábado)
 */
export function getUltimoDiaUtilMes(mes: number, ano: number): Date {
  // Último dia do mês
  let data = new Date(ano, mes, 0);
  const diaSemana = data.getDay();

  // Se for domingo, volta para sábado
  if (diaSemana === 0) {
    data.setDate(data.getDate() - 1);
  }

  return data;
}

/**
 * Calcula estatísticas de meta do mês
 */
export function calcularMetaStats(
  feitas: number,
  mes: number,
  ano: number,
  hojeFeZ: number = 0
): MetaStats {
  const hoje = new Date();
  const hoje_dia = hoje.getDate();
  const hoje_mes = hoje.getMonth() + 1;
  const hoje_ano = hoje.getFullYear();

  // Se estamos em um mês diferente, usar o último dia do mês solicitado
  const dataFim =
    mes === hoje_mes && ano === hoje_ano
      ? new Date(hoje_ano, hoje_mes - 1, hoje_dia)
      : getUltimoDiaUtilMes(mes, ano);

  const dataInicio = getPrimeiroDiaUtilMes(mes, ano);

  const diasUteisTotais = calcularDiasUteis(dataInicio, getUltimoDiaUtilMes(mes, ano));
  const diasUteisPassados = calcularDiasUteis(dataInicio, dataFim);
  const diasUteisRestantes = Math.max(0, diasUteisTotais - diasUteisPassados);

  const faltam = Math.max(0, 104 - feitas);
  const metaDia = diasUteisRestantes > 0 ? Math.ceil(faltam / diasUteisRestantes) : 0;

  const mediadiaria = diasUteisPassados > 0 ? feitas / diasUteisPassados : 0;
  const projecao = Math.round(mediadiaria * diasUteisTotais);

  return {
    diasUteisPassados,
    diasUteisRestantes,
    diasUteisTotais,
    metaDia,
    mediadiaria,
    projecao,
    hojeFeZ,
  };
}

/**
 * Formata a meta do dia para exibição
 */
export function formatarMetaDia(metaDia: number): string {
  if (metaDia === 0) {
    return "Meta atingida!";
  }
  return `Você precisa fazer ${metaDia} por dia`;
}
