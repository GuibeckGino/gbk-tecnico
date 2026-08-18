import { describe, expect, it } from 'vitest';
import { getChartPeriodLabel, selectChartInstallations } from '../lib/chart-period';

describe('Período dos gráficos', () => {
  const monthData = [{ id: 'month-1' }];
  const historyData = [{ id: 'month-1' }, { id: 'history-2' }];

  it('usa somente o mês selecionado quando o período é month', () => {
    expect(selectChartInstallations(monthData, historyData, 'month')).toEqual(monthData);
    expect(getChartPeriodLabel('month', 'Agosto de 2026')).toBe('Agosto de 2026');
  });

  it('usa todo o histórico quando o período é history', () => {
    expect(selectChartInstallations(monthData, historyData, 'history')).toEqual(historyData);
    expect(getChartPeriodLabel('history', 'Agosto de 2026')).toBe('Todo o histórico');
  });
});
