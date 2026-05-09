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
 * Calcula dias úteis entre duas datas
 * @param dataInicio Data inicial
 * @param dataFim Data final
 * @param diasTrabalhoCodigos Array com dias da semana que trabalha (0=seg, 1=ter, ..., 6=dom)
 */
export function calcularDiasUteis(
  dataInicio: Date,
  dataFim: Date,
  diasTrabalhoCodigos: number[] = [0, 1, 2, 3, 4] // Padrão: seg-sex
): number {
  let dias = 0;
  const data = new Date(dataInicio);

  while (data <= dataFim) {
    // Converter getDay (0=dom, 1=seg, ..., 6=sab) para nosso formato (0=seg, 1=ter, ..., 6=dom)
    let diaSemanaLocal = data.getDay();
    diaSemanaLocal = diaSemanaLocal === 0 ? 6 : diaSemanaLocal - 1;

    if (diasTrabalhoCodigos.includes(diaSemanaLocal)) {
      dias++;
    }
    data.setDate(data.getDate() + 1);
  }

  return dias;
}

/**
 * Retorna o primeiro dia útil do mês
 * @param mes Mês (1-12)
 * @param ano Ano
 * @param diasTrabalhoCodigos Array com dias da semana que trabalha
 */
export function getPrimeiroDiaUtilMes(
  mes: number,
  ano: number,
  diasTrabalhoCodigos: number[] = [0, 1, 2, 3, 4]
): Date {
  let data = new Date(ano, mes - 1, 1);

  // Encontrar o primeiro dia que é dia de trabalho
  while (data.getMonth() === mes - 1) {
    let diaSemanaLocal = data.getDay();
    diaSemanaLocal = diaSemanaLocal === 0 ? 6 : diaSemanaLocal - 1;

    if (diasTrabalhoCodigos.includes(diaSemanaLocal)) {
      break;
    }
    data.setDate(data.getDate() + 1);
  }

  return data;
}

/**
 * Retorna o último dia útil do mês
 * @param mes Mês (1-12)
 * @param ano Ano
 * @param diasTrabalhoCodigos Array com dias da semana que trabalha
 */
export function getUltimoDiaUtilMes(
  mes: number,
  ano: number,
  diasTrabalhoCodigos: number[] = [0, 1, 2, 3, 4]
): Date {
  // Último dia do mês
  let data = new Date(ano, mes, 0);

  // Encontrar o último dia que é dia de trabalho
  while (data.getMonth() === mes - 1) {
    let diaSemanaLocal = data.getDay();
    diaSemanaLocal = diaSemanaLocal === 0 ? 6 : diaSemanaLocal - 1;

    if (diasTrabalhoCodigos.includes(diaSemanaLocal)) {
      break;
    }
    data.setDate(data.getDate() - 1);
  }

  return data;
}

/**
 * Calcula estatísticas de meta do mês
 * @param feitas Número de instalações feitas
 * @param mes Mês (0-11)
 * @param ano Ano
 * @param hojeFeZ Instalações feitas hoje
 * @param diasTrabalhoCodigos Array com dias da semana que trabalha
 */
export function calcularMetaStats(
  feitas: number,
  mes: number,
  ano: number,
  hojeFeZ: number = 0,
  diasTrabalhoCodigos: number[] = [0, 1, 2, 3, 4]
): MetaStats {
  const hoje = new Date();
  const hoje_dia = hoje.getDate();
  const hoje_mes = hoje.getMonth() + 1;
  const hoje_ano = hoje.getFullYear();

  // Converter mes de 0-based para 1-based para comparação
  const mesBased = mes + 1;

  // Se estamos em um mês diferente, usar o último dia do mês solicitado
  const dataFim =
    mesBased === hoje_mes && ano === hoje_ano
      ? new Date(hoje_ano, hoje_mes - 1, hoje_dia)
      : getUltimoDiaUtilMes(mesBased, ano, diasTrabalhoCodigos);

  const dataInicio = getPrimeiroDiaUtilMes(mesBased, ano, diasTrabalhoCodigos);

  const diasUteisTotais = calcularDiasUteis(
    dataInicio,
    getUltimoDiaUtilMes(mesBased, ano, diasTrabalhoCodigos),
    diasTrabalhoCodigos
  );
  const diasUteisPassados = calcularDiasUteis(dataInicio, dataFim, diasTrabalhoCodigos);
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
