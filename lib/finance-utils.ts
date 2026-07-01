import { Installation, calcularValorPorTipo } from '@/types/installation';
import { Expense, FuelSupply, FinancialSummary, MonthlyFinancial, FinancialForecast } from '@/types/finance';

export function calcularReceitaBruta(
  instalacoes: Installation[],
  mes: number,
  ano: number,
  paymentMode: 'meta' | 'fixo65' | 'fixo70' = 'meta'
): number {
  return instalacoes
    .filter(i => {
      const data = new Date(i.createdAt);
      return data.getMonth() + 1 === mes && data.getFullYear() === ano;
    })
    .reduce((sum, i) => {
      const valor = calcularValorPorTipo(i.tipoServico, instalacoes.length, paymentMode);
      return sum + valor;
    }, 0);
}

export function calcularTotalInstalacoes(
  instalacoes: Installation[],
  mes: number,
  ano: number
): number {
  return instalacoes.filter(i => {
    const data = new Date(i.data);
    return data.getMonth() + 1 === mes && data.getFullYear() === ano;
  }).length;
}

export function calcularDespesasTotal(
  expenses: Expense[],
  mes: number,
  ano: number
): number {
  return expenses
    .filter(e => e.mes === mes && e.ano === ano)
    .reduce((sum, e) => sum + e.valor, 0);
}

export function calcularCombustivelTotal(
  fuelSupplies: FuelSupply[],
  mes: number,
  ano: number
): number {
  return fuelSupplies
    .filter(f => f.mes === mes && f.ano === ano)
    .reduce((sum, f) => sum + f.valorTotal, 0);
}

export function calcularLucroLiquido(
  receitaBruta: number,
  despesasTotal: number,
  combustivelTotal: number
): number {
  return receitaBruta - despesasTotal - combustivelTotal;
}

export function calcularTicketMedio(
  receitaBruta: number,
  totalInstalacoes: number
): number {
  return totalInstalacoes > 0 ? receitaBruta / totalInstalacoes : 0;
}

export function calcularReceitaPorDia(
  receitaBruta: number,
  diasTrabalhados: number
): number {
  return diasTrabalhados > 0 ? receitaBruta / diasTrabalhados : 0;
}

export function calcularReceitaPorBairro(
  instalacoes: Installation[],
  mes: number,
  ano: number,
  paymentMode: 'meta' | 'fixo65' | 'fixo70' = 'meta'
): { [bairro: string]: number } {
  const resultado: { [bairro: string]: number } = {};
  
  instalacoes
    .filter(i => {
      const data = new Date(i.createdAt);
      return data.getMonth() + 1 === mes && data.getFullYear() === ano;
    })
    .forEach(i => {
      const valor = calcularValorPorTipo(i.tipoServico, instalacoes.length, paymentMode);
      resultado[i.endereco] = (resultado[i.endereco] || 0) + valor;
    });
  
  return resultado;
}

export function calcularReceitaPorTipo(
  instalacoes: Installation[],
  mes: number,
  ano: number,
  paymentMode: 'meta' | 'fixo65' | 'fixo70' = 'meta'
): { [tipo: string]: number } {
  const resultado: { [tipo: string]: number } = {};
  
  instalacoes
    .filter(i => {
      const data = new Date(i.createdAt);
      return data.getMonth() + 1 === mes && data.getFullYear() === ano;
    })
    .forEach(i => {
      const valor = calcularValorPorTipo(i.tipoServico, instalacoes.length, paymentMode);
      resultado[i.tipoServico] = (resultado[i.tipoServico] || 0) + valor;
    });
  
  return resultado;
}

export function calcularMargemLucro(
  lucroLiquido: number,
  receitaBruta: number
): number {
  return receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;
}

export function calcularLucroPorInstalacao(
  lucroLiquido: number,
  totalInstalacoes: number
): number {
  return totalInstalacoes > 0 ? lucroLiquido / totalInstalacoes : 0;
}

export function calcularLucroPorBairro(
  instalacoes: Installation[],
  expenses: Expense[],
  fuelSupplies: FuelSupply[],
  mes: number,
  ano: number,
  paymentMode: 'meta' | 'fixo65' | 'fixo70' = 'meta'
): { [bairro: string]: number } {
  const receitaPorBairro = calcularReceitaPorBairro(instalacoes, mes, ano, paymentMode);
  const despesasTotal = calcularDespesasTotal(expenses, mes, ano);
  const combustivelTotal = calcularCombustivelTotal(fuelSupplies, mes, ano);
  const totalInstalacoes = calcularTotalInstalacoes(instalacoes, mes, ano);
  
  const resultado: { [bairro: string]: number } = {};
  
  Object.entries(receitaPorBairro).forEach(([bairro, receita]) => {
    const proporcao = totalInstalacoes > 0 ? 
      instalacoes.filter(i => {
        const data = new Date(i.createdAt);
        return i.endereco === bairro && 
               data.getMonth() + 1 === mes && 
               data.getFullYear() === ano;
      }).length / totalInstalacoes : 0;
    
    const despesasProporcionais = despesasTotal * proporcao;
    const combustivelProporcional = combustivelTotal * proporcao;
    
    resultado[bairro] = receita - despesasProporcionais - combustivelProporcional;
  });
  
  return resultado;
}

export function calcularLucroPorTipo(
  instalacoes: Installation[],
  expenses: Expense[],
  fuelSupplies: FuelSupply[],
  mes: number,
  ano: number,
  paymentMode: 'meta' | 'fixo65' | 'fixo70' = 'meta'
): { [tipo: string]: number } {
  const receitaPorTipo = calcularReceitaPorTipo(instalacoes, mes, ano, paymentMode);
  const despesasTotal = calcularDespesasTotal(expenses, mes, ano);
  const combustivelTotal = calcularCombustivelTotal(fuelSupplies, mes, ano);
  const totalInstalacoes = calcularTotalInstalacoes(instalacoes, mes, ano);
  
  const resultado: { [tipo: string]: number } = {};
  
  Object.entries(receitaPorTipo).forEach(([tipo, receita]) => {
    const proporcao = totalInstalacoes > 0 ? 
      instalacoes.filter(i => {
        const data = new Date(i.createdAt);
        return i.tipoServico === tipo && 
               data.getMonth() + 1 === mes && 
               data.getFullYear() === ano;
      }).length / totalInstalacoes : 0;
    
    const despesasProporcionais = despesasTotal * proporcao;
    const combustivelProporcional = combustivelTotal * proporcao;
    
    resultado[tipo] = receita - despesasProporcionais - combustivelProporcional;
  });
  
  return resultado;
}

export function calcularConsumoMedio(
  fuelSupplies: FuelSupply[],
  mes: number,
  ano: number
): number {
  const supplies = fuelSupplies.filter(f => f.mes === mes && f.ano === ano);
  if (supplies.length < 2) return 0;
  
  let totalKm = 0;
  let totalLitros = 0;
  
  for (let i = 1; i < supplies.length; i++) {
    const kmPercorrido = supplies[i].quilometragem - supplies[i - 1].quilometragem;
    if (kmPercorrido > 0) {
      totalKm += kmPercorrido;
      totalLitros += supplies[i].litros;
    }
  }
  
  return totalLitros > 0 ? totalKm / totalLitros : 0;
}

export function calcularCustoKm(
  combustivelTotal: number,
  totalKm: number
): number {
  return totalKm > 0 ? combustivelTotal / totalKm : 0;
}

export function gerarPrevisaoMensal(
  receitaBruta: number,
  despesasTotal: number,
  combustivelTotal: number,
  diaAtual: number,
  diasTrabalhados: number
): FinancialForecast {
  const diasRestantes = Math.max(1, diasTrabalhados - diaAtual);
  const receitaDiaria = diaAtual > 0 ? receitaBruta / diaAtual : 0;
  const despesaDiaria = diaAtual > 0 ? despesasTotal / diaAtual : 0;
  const combustivelDiario = diaAtual > 0 ? combustivelTotal / diaAtual : 0;
  
  const receitaPrevisaoFim = receitaBruta + (receitaDiaria * diasRestantes);
  const despesaPrevisaoFim = despesasTotal + (despesaDiaria * diasRestantes);
  const combustivelPrevisaoFim = combustivelTotal + (combustivelDiario * diasRestantes);
  const lucroPrevisaoFim = receitaPrevisaoFim - despesaPrevisaoFim - combustivelPrevisaoFim;
  
  const instalacoesPrevisaoFim = Math.round(receitaPrevisaoFim / 70); // Assumindo R$ 70 por instalação
  const percentualMeta = (receitaPrevisaoFim / 3000) * 100; // Meta padrão R$ 3000
  
  return {
    receitaPrevisaFim: receitaPrevisaoFim,
    lucroPrevisaoFim,
    despesaPrevisaoFim,
    instalacoesPrevisaoFim,
    percentualMeta,
  };
}

export function obterAlertas(
  receitaBruta: number,
  lucroLiquido: number,
  combustivelTotal: number,
  metaFaturamento: number,
  metaLucro: number,
  percentualMeta: number
): string[] {
  const alertas: string[] = [];
  
  if (percentualMeta >= 80 && percentualMeta < 100) {
    alertas.push(`Você já atingiu ${percentualMeta.toFixed(0)}% da meta de faturamento!`);
  }
  
  if (combustivelTotal > metaFaturamento * 0.3) {
    const aumento = ((combustivelTotal / (metaFaturamento * 0.3)) - 1) * 100;
    alertas.push(`Gasto com combustível aumentou ${aumento.toFixed(0)}%.`);
  }
  
  if (lucroLiquido < metaLucro * 0.8) {
    alertas.push(`Lucro está abaixo da meta esperada.`);
  }
  
  return alertas;
}

export function calcularSummary(
  instalacoes: Installation[],
  expenses: Expense[],
  fuelSupplies: FuelSupply[],
  mes: number,
  ano: number,
  diasTrabalhados: number,
  paymentMode: 'meta' | 'fixo65' | 'fixo70' = 'meta'
): FinancialSummary {
  const receitaBruta = calcularReceitaBruta(instalacoes, mes, ano, paymentMode);
  const totalInstalacoes = calcularTotalInstalacoes(instalacoes, mes, ano);
  const gastosCombustivel = calcularCombustivelTotal(fuelSupplies, mes, ano);
  const outrasDespesas = calcularDespesasTotal(expenses, mes, ano);
  const lucroLiquido = calcularLucroLiquido(receitaBruta, outrasDespesas, gastosCombustivel);
  
  return {
    receitaBruta,
    totalInstalacoes,
    gastosCombustivel,
    outrasDespesas,
    lucroLiquido,
    ticketMedio: calcularTicketMedio(receitaBruta, totalInstalacoes),
    receitaPorDia: calcularReceitaPorDia(receitaBruta, diasTrabalhados),
    receitaPorBairro: calcularReceitaPorBairro(instalacoes, mes, ano, paymentMode),
    receitaPorTipo: calcularReceitaPorTipo(instalacoes, mes, ano, paymentMode),
  };
}
