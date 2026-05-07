import { useEffect } from 'react';
import { useMonth } from '@/context/MonthContext';
import { useInstallations } from '@/context/InstallationsContext';

/**
 * Hook que carrega as configurações (paymentMode e monthlyGoal) específicas do mês selecionado
 * Deve ser usado em componentes que precisam das configurações do mês
 */
export function useMonthlyConfig() {
  const { mes, ano } = useMonth();
  const { carregarConfiguracoesDoMes } = useInstallations();

  useEffect(() => {
    carregarConfiguracoesDoMes(mes, ano);
  }, [mes, ano, carregarConfiguracoesDoMes]);
}
