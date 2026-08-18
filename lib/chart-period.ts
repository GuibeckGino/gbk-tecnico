export type ChartPeriod = 'month' | 'history';

export function selectChartInstallations<T>(monthInstallations: T[], historyInstallations: T[], period: ChartPeriod): T[] {
  return period === 'month' ? monthInstallations : historyInstallations;
}

export function getChartPeriodLabel(period: ChartPeriod, monthLabel: string): string {
  return period === 'month' ? monthLabel : 'Todo o histórico';
}
