import { Installation, calcularValorPorTipo } from '@/types/installation';

export interface DayProductivity {
  day: string;
  dayNumber: number; // 0 = segunda, 1 = terça, etc.
  installations: number;
  totalValue: number;
  averageValue: number;
  percentage: number;
}

export interface ProductivityReport {
  days: DayProductivity[];
  totalInstallations: number;
  totalValue: number;
  mostProductiveDay: DayProductivity | null;
  leastProductiveDay: DayProductivity | null;
  averagePerDay: number;
  trend: 'crescente' | 'decrescente' | 'estável';
}

const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

/**
 * Analisa produtividade por dia da semana
 */
export function analisarProdutividadePorDia(
  installations: Installation[],
  mes: number,
  ano: number
): ProductivityReport {
  // Inicializar array de dias
  const dayData: DayProductivity[] = dayNames.map((day, index) => ({
    day,
    dayNumber: index,
    installations: 0,
    totalValue: 0,
    averageValue: 0,
    percentage: 0,
  }));

  let totalInstallations = 0;
  let totalValue = 0;

  // Agrupar instalações por dia da semana
  installations.forEach((installation) => {
    const date = new Date(installation.data);
    
    // Verificar se é do mês/ano selecionado
    if (date.getMonth() !== mes || date.getFullYear() !== ano) {
      return;
    }

    const dayOfWeek = date.getDay();
    // Converter getDay() (0=dom, 1=seg) para nosso formato (0=seg, 1=ter)
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    if (dayData[adjustedDay]) {
      const valor = calcularValorPorTipo(installation.tipoServico, installations.length, 'meta');
      dayData[adjustedDay].installations += 1;
      dayData[adjustedDay].totalValue += valor;
      totalInstallations += 1;
      totalValue += valor;
    }
  });

  // Calcular médias e percentuais
  dayData.forEach((day) => {
    day.averageValue = day.installations > 0 ? day.totalValue / day.installations : 0;
    day.percentage = totalInstallations > 0 ? (day.installations / totalInstallations) * 100 : 0;
  });

  // Encontrar dias mais e menos produtivos
  const mostProductiveDay = dayData.reduce((max, day) =>
    day.installations > max.installations ? day : max
  );
  const leastProductiveDay = dayData.reduce((min, day) =>
    day.installations < min.installations && day.installations > 0 ? day : min
  );

  // Calcular tendência (comparar primeira metade com segunda metade)
  const firstHalf = dayData.slice(0, 3).reduce((sum, day) => sum + day.installations, 0);
  const secondHalf = dayData.slice(3).reduce((sum, day) => sum + day.installations, 0);
  let trend: 'crescente' | 'decrescente' | 'estável' = 'estável';
  if (secondHalf > firstHalf * 1.1) {
    trend = 'crescente';
  } else if (secondHalf < firstHalf * 0.9) {
    trend = 'decrescente';
  }

  return {
    days: dayData,
    totalInstallations,
    totalValue,
    mostProductiveDay: mostProductiveDay.installations > 0 ? mostProductiveDay : null,
    leastProductiveDay: leastProductiveDay.installations > 0 ? leastProductiveDay : null,
    averagePerDay: totalInstallations > 0 ? totalInstallations / 7 : 0,
    trend,
  };
}

/**
 * Formata dados para gráfico de barra
 */
export function formatarDadosParaGrafico(report: ProductivityReport) {
  return {
    labels: report.days.map((day) => day.day.substring(0, 3)), // Abreviar para 3 letras
    datasets: [
      {
        label: 'Instalações',
        data: report.days.map((day) => day.installations),
        backgroundColor: [
          '#0a7ea4', // Segunda - azul
          '#0a7ea4',
          '#0a7ea4',
          '#0a7ea4',
          '#0a7ea4',
          '#ef4444', // Sábado - vermelho
          '#ef4444', // Domingo - vermelho
        ],
      },
    ],
  };
}

/**
 * Gera resumo textual de produtividade
 */
export function gerarResumoTextual(report: ProductivityReport): string {
  if (report.totalInstallations === 0) {
    return 'Nenhuma instalação registrada neste mês.';
  }

  let resumo = `Total de ${report.totalInstallations} instalações neste mês.\n`;

  if (report.mostProductiveDay) {
    resumo += `Dia mais produtivo: ${report.mostProductiveDay.day} (${report.mostProductiveDay.installations} instalações).\n`;
  }

  if (report.leastProductiveDay) {
    resumo += `Dia menos produtivo: ${report.leastProductiveDay.day} (${report.leastProductiveDay.installations} instalações).\n`;
  }

  resumo += `Média: ${report.averagePerDay.toFixed(1)} instalações por dia.\n`;
  resumo += `Tendência: ${report.trend === 'crescente' ? '📈 Crescente' : report.trend === 'decrescente' ? '📉 Decrescente' : '➡️ Estável'}`;

  return resumo;
}
