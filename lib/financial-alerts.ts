import { FinancialAlert } from '@/types/finance';
import { Installation } from '@/types/installation';
import { Expense, FuelSupply } from '@/types/finance';
import { gerarId } from '@/types/installation';

export interface AlertConfig {
  metaFaturamento: number;
  metaLucro: number;
  metaDespesasMax: number;
  precoMedioCombustivel: number;
  consumoMedioVeiculo: number;
}

export function gerarAlertasFinanceiros(
  instalacoes: Installation[],
  expenses: Expense[],
  fuelSupplies: FuelSupply[],
  mes: number,
  ano: number,
  config: AlertConfig,
  paymentMode: 'meta' | 'fixo65' | 'fixo70' = 'meta'
): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];

  // Filtrar dados do mês
  const instalacoesDoMes = instalacoes.filter(i => {
    const data = new Date(i.createdAt);
    return data.getMonth() + 1 === mes && data.getFullYear() === ano;
  });

  const despesasDoMes = expenses.filter(e => e.mes === mes && e.ano === ano);
  const combustivelDoMes = fuelSupplies.filter(f => f.mes === mes && f.ano === ano);

  // Calcular valores
  const receitaBruta = instalacoesDoMes.reduce((sum, i) => {
    const valor = paymentMode === 'fixo65' ? 65 : paymentMode === 'fixo70' ? 70 : instalacoesDoMes.length >= 104 ? 70 : 65;
    return sum + valor;
  }, 0);

  const despesasTotal = despesasDoMes.reduce((sum, e) => sum + e.valor, 0);
  const combustivelTotal = combustivelDoMes.reduce((sum, f) => sum + f.valorTotal, 0);
  const lucroLiquido = receitaBruta - despesasTotal - combustivelTotal;

  const diaAtual = new Date().getDate();
  const diasDoMes = new Date(ano, mes, 0).getDate();

  // ALERTA 1: Meta de Faturamento
  if (receitaBruta < config.metaFaturamento * 0.5) {
    alerts.push({
      id: gerarId(),
      tipo: 'erro',
      mensagem: `⚠️ Faturamento crítico! Apenas R$ ${receitaBruta.toFixed(2)} de R$ ${config.metaFaturamento.toFixed(2)}`,
      data: new Date().toISOString(),
      lido: false,
    });
  } else if (receitaBruta < config.metaFaturamento * 0.8) {
    alerts.push({
      id: gerarId(),
      tipo: 'aviso',
      mensagem: `📊 Faturamento abaixo da meta. Atual: R$ ${receitaBruta.toFixed(2)} de R$ ${config.metaFaturamento.toFixed(2)}`,
      data: new Date().toISOString(),
      lido: false,
    });
  }

  // ALERTA 2: Meta de Lucro
  if (lucroLiquido < config.metaLucro * 0.5) {
    alerts.push({
      id: gerarId(),
      tipo: 'erro',
      mensagem: `💰 Lucro crítico! Apenas R$ ${lucroLiquido.toFixed(2)} de R$ ${config.metaLucro.toFixed(2)}`,
      data: new Date().toISOString(),
      lido: false,
    });
  } else if (lucroLiquido < config.metaLucro * 0.8) {
    alerts.push({
      id: gerarId(),
      tipo: 'aviso',
      mensagem: `📉 Lucro abaixo da meta. Atual: R$ ${lucroLiquido.toFixed(2)} de R$ ${config.metaLucro.toFixed(2)}`,
      data: new Date().toISOString(),
      lido: false,
    });
  }

  // ALERTA 3: Despesas Altas
  if (despesasTotal > config.metaDespesasMax) {
    const percentual = ((despesasTotal / config.metaDespesasMax) * 100).toFixed(0);
    alerts.push({
      id: gerarId(),
      tipo: 'aviso',
      mensagem: `🚨 Despesas acima do limite! R$ ${despesasTotal.toFixed(2)} (${percentual}% da meta)`,
      data: new Date().toISOString(),
      lido: false,
    });
  }

  // ALERTA 4: Combustível Caro
  if (combustivelDoMes.length > 0) {
    const precoMedioCombustivel = combustivelTotal / combustivelDoMes.reduce((sum, f) => sum + f.litros, 0);
    if (precoMedioCombustivel > config.precoMedioCombustivel * 1.2) {
      alerts.push({
        id: gerarId(),
        tipo: 'aviso',
        mensagem: `⛽ Combustível acima da média! R$ ${precoMedioCombustivel.toFixed(2)}/L (esperado: R$ ${config.precoMedioCombustivel.toFixed(2)}/L)`,
        data: new Date().toISOString(),
        lido: false,
      });
    }
  }

  // ALERTA 5: Consumo Alto
  if (combustivelDoMes.length > 1) {
    let totalKm = 0;
    let totalLitros = 0;
    for (let i = 1; i < combustivelDoMes.length; i++) {
      const kmPercorrido = combustivelDoMes[i].quilometragem - combustivelDoMes[i - 1].quilometragem;
      if (kmPercorrido > 0) {
        totalKm += kmPercorrido;
        totalLitros += combustivelDoMes[i].litros;
      }
    }
    if (totalLitros > 0) {
      const consumoMedio = totalKm / totalLitros;
      if (consumoMedio < config.consumoMedioVeiculo * 0.8) {
        alerts.push({
          id: gerarId(),
          tipo: 'aviso',
          mensagem: `🚗 Consumo acima do normal! ${consumoMedio.toFixed(2)} km/L (esperado: ${config.consumoMedioVeiculo.toFixed(2)} km/L)`,
          data: new Date().toISOString(),
          lido: false,
        });
      }
    }
  }

  // ALERTA 6: Progresso de Meta (Projeção)
  const diasRestantes = diasDoMes - diaAtual;
  if (diasRestantes > 0) {
    const receitaDiaria = diaAtual > 0 ? receitaBruta / diaAtual : 0;
    const receitaProjetada = receitaBruta + (receitaDiaria * diasRestantes);
    
    if (receitaProjetada < config.metaFaturamento * 0.9) {
      const percentualProjetado = ((receitaProjetada / config.metaFaturamento) * 100).toFixed(0);
      alerts.push({
        id: gerarId(),
        tipo: 'aviso',
        mensagem: `📈 Projeção: ${percentualProjetado}% da meta até fim do mês (R$ ${receitaProjetada.toFixed(2)})`,
        data: new Date().toISOString(),
        lido: false,
      });
    } else {
      const percentualProjetado = ((receitaProjetada / config.metaFaturamento) * 100).toFixed(0);
      alerts.push({
        id: gerarId(),
        tipo: 'sucesso',
        mensagem: `✅ Projeção: ${percentualProjetado}% da meta até fim do mês (R$ ${receitaProjetada.toFixed(2)})`,
        data: new Date().toISOString(),
        lido: false,
      });
    }
  }

  // ALERTA 7: Margem de Lucro
  const margemLucro = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;
  if (margemLucro < 15) {
    alerts.push({
      id: gerarId(),
      tipo: 'aviso',
      mensagem: `⚠️ Margem de lucro baixa! ${margemLucro.toFixed(1)}% (recomendado: >30%)`,
      data: new Date().toISOString(),
      lido: false,
    });
  } else if (margemLucro > 30) {
    alerts.push({
      id: gerarId(),
      tipo: 'sucesso',
      mensagem: `🎉 Margem de lucro excelente! ${margemLucro.toFixed(1)}%`,
      data: new Date().toISOString(),
      lido: false,
    });
  }

  // ALERTA 8: Sem Instalações
  if (instalacoesDoMes.length === 0 && diaAtual > 10) {
    alerts.push({
      id: gerarId(),
      tipo: 'erro',
      mensagem: `⚠️ Nenhuma instalação registrada ainda! Estamos no dia ${diaAtual} do mês.`,
      data: new Date().toISOString(),
      lido: false,
    });
  }

  return alerts;
}

export function calcularScoreSaude(
  receitaBruta: number,
  lucroLiquido: number,
  despesasTotal: number,
  metaFaturamento: number,
  metaLucro: number
): number {
  let score = 50; // Base 50

  // Faturamento (até +25)
  const percentualFaturamento = (receitaBruta / metaFaturamento) * 100;
  if (percentualFaturamento >= 100) score += 25;
  else if (percentualFaturamento >= 80) score += 20;
  else if (percentualFaturamento >= 60) score += 10;
  else if (percentualFaturamento >= 40) score += 5;

  // Lucro (até +25)
  const percentualLucro = (lucroLiquido / metaLucro) * 100;
  if (percentualLucro >= 100) score += 25;
  else if (percentualLucro >= 80) score += 20;
  else if (percentualLucro >= 60) score += 10;
  else if (percentualLucro >= 40) score += 5;

  return Math.min(100, score);
}
