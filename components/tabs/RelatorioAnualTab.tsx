import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useInstallations } from '@/context/InstallationsContext';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/use-colors';
import {
  calcularReceitaBruta,
  calcularDespesasTotal,
  calcularCombustivelTotal,
  calcularLucroLiquido,
  calcularMargemLucro,
} from '@/lib/finance-utils';

export function RelatorioAnualTab() {
  const { instalacoes, paymentMode } = useInstallations();
  const { ano: anoSelecionado } = useMonth();
  const { state: financeState } = useFinance();
  const colors = useColors();
  const [anoSelecionadoRelatorio, setAnoSelecionadoRelatorio] = useState(anoSelecionado);

  // Gerar dados de todos os 12 meses do ano
  const dadosAno = useMemo(() => {
    const meses: Array<{
      mes: number;
      nome: string;
      receita: number;
      lucro: number;
      despesas: number;
      combustivel: number;
      margem: number;
    }> = [];

    const nomesMeses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    for (let i = 0; i < 12; i++) {
      const receita = calcularReceitaBruta(instalacoes, i, anoSelecionadoRelatorio, paymentMode);
      const despesas = calcularDespesasTotal(financeState.expenses, i, anoSelecionadoRelatorio);
      const combustivel = calcularCombustivelTotal(financeState.fuelSupplies, i, anoSelecionadoRelatorio);
      const lucro = calcularLucroLiquido(receita, despesas, combustivel);
      const margem = calcularMargemLucro(lucro, receita);

      meses.push({
        mes: i,
        nome: nomesMeses[i],
        receita,
        lucro,
        despesas,
        combustivel,
        margem,
      });
    }

    return meses;
  }, [anoSelecionadoRelatorio, instalacoes, financeState.expenses, financeState.fuelSupplies, paymentMode]);

  // Estatísticas anuais
  const statsAnuais = useMemo(() => {
    const totalReceita = dadosAno.reduce((sum, m) => sum + m.receita, 0);
    const totalLucro = dadosAno.reduce((sum, m) => sum + m.lucro, 0);
    const totalDespesas = dadosAno.reduce((sum, m) => sum + m.despesas, 0);
    const totalCombustivel = dadosAno.reduce((sum, m) => sum + m.combustivel, 0);

    const margemMedia = totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;

    const mesesComDados = dadosAno.filter(m => m.receita > 0).length;

    const melhorMes = dadosAno.reduce((max, m) => m.lucro > max.lucro ? m : max);
    const piorMes = dadosAno.reduce((min, m) => m.lucro < min.lucro ? m : min);

    return {
      totalReceita,
      totalLucro,
      totalDespesas,
      totalCombustivel,
      margemMedia,
      mesesComDados,
      melhorMes,
      piorMes,
      mediaReceitaMensal: mesesComDados > 0 ? totalReceita / mesesComDados : 0,
      mediaLucroMensal: mesesComDados > 0 ? totalLucro / mesesComDados : 0,
    };
  }, [dadosAno]);

  // Análise trimestral
  const analisisTrimestral = useMemo(() => {
    const trimestres = [
      { nome: 'Q1', meses: [0, 1, 2] },
      { nome: 'Q2', meses: [3, 4, 5] },
      { nome: 'Q3', meses: [6, 7, 8] },
      { nome: 'Q4', meses: [9, 10, 11] },
    ];

    return trimestres.map(tri => {
      const receita = tri.meses.reduce((sum, m) => sum + dadosAno[m].receita, 0);
      const lucro = tri.meses.reduce((sum, m) => sum + dadosAno[m].lucro, 0);
      const despesas = tri.meses.reduce((sum, m) => sum + dadosAno[m].despesas, 0);
      const combustivel = tri.meses.reduce((sum, m) => sum + dadosAno[m].combustivel, 0);

      return {
        nome: tri.nome,
        receita,
        lucro,
        despesas,
        combustivel,
        margem: receita > 0 ? (lucro / receita) * 100 : 0,
      };
    });
  }, [dadosAno]);

  const handleAnoAnterior = () => {
    setAnoSelecionadoRelatorio(anoSelecionadoRelatorio - 1);
  };

  const handleProximoAno = () => {
    setAnoSelecionadoRelatorio(anoSelecionadoRelatorio + 1);
  };

  return (
    <ScrollView className="flex-1 p-4">
      {/* Seletor de Ano */}
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={handleAnoAnterior} className="p-2 active:opacity-70">
            <Text className="text-primary text-lg font-bold">‹</Text>
          </TouchableOpacity>

          <Text className="text-foreground text-lg font-bold">{anoSelecionadoRelatorio}</Text>

          <TouchableOpacity onPress={handleProximoAno} className="p-2 active:opacity-70">
            <Text className="text-primary text-lg font-bold">›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Resumo Anual */}
      <View className="gap-3 mb-6">
        <View className="bg-primary/10 rounded-lg p-4 border border-primary">
          <Text className="text-muted text-sm mb-1">Receita Anual</Text>
          <Text className="text-3xl font-bold text-primary">
            R$ {statsAnuais.totalReceita.toFixed(2)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            Média mensal: R$ {statsAnuais.mediaReceitaMensal.toFixed(2)}
          </Text>
        </View>

        <View className="bg-success/10 rounded-lg p-4 border border-success">
          <Text className="text-muted text-sm mb-1">Lucro Anual</Text>
          <Text className="text-3xl font-bold text-success">
            R$ {statsAnuais.totalLucro.toFixed(2)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            Margem: {statsAnuais.margemMedia.toFixed(1)}%
          </Text>
        </View>

        <View className="bg-error/10 rounded-lg p-4 border border-error">
          <Text className="text-muted text-sm mb-1">Despesas Anuais</Text>
          <Text className="text-3xl font-bold text-error">
            R$ {statsAnuais.totalDespesas.toFixed(2)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            + Combustível: R$ {statsAnuais.totalCombustivel.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Análise Trimestral */}
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-foreground font-semibold mb-3">Análise Trimestral</Text>
        <View className="gap-2">
          {analisisTrimestral.map((tri, idx) => (
            <View key={idx} className="py-3 border-b border-border/50 last:border-b-0">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-foreground font-semibold">{tri.nome} {anoSelecionadoRelatorio}</Text>
                <Text className={`font-bold ${tri.lucro > 0 ? 'text-success' : 'text-error'}`}>
                  R$ {tri.lucro.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between text-xs text-muted">
                <Text>Receita: R$ {tri.receita.toFixed(2)}</Text>
                <Text>Margem: {tri.margem.toFixed(1)}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Melhores e Piores Meses */}
      <View className="gap-3 mb-6">
        <View className="bg-success/10 rounded-lg p-4 border border-success">
          <Text className="text-muted text-sm mb-2">Melhor Mês do Ano</Text>
          <Text className="text-foreground font-bold">{statsAnuais.melhorMes.nome}</Text>
          <Text className="text-success font-bold">Lucro: R$ {statsAnuais.melhorMes.lucro.toFixed(2)}</Text>
          <Text className="text-xs text-muted mt-1">
            Receita: R$ {statsAnuais.melhorMes.receita.toFixed(2)}
          </Text>
        </View>

        <View className="bg-error/10 rounded-lg p-4 border border-error">
          <Text className="text-muted text-sm mb-2">Pior Mês do Ano</Text>
          <Text className="text-foreground font-bold">{statsAnuais.piorMes.nome}</Text>
          <Text className="text-error font-bold">Lucro: R$ {statsAnuais.piorMes.lucro.toFixed(2)}</Text>
          <Text className="text-xs text-muted mt-1">
            Receita: R$ {statsAnuais.piorMes.receita.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Detalhes Mensais */}
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-foreground font-semibold mb-3">Detalhes Mensais</Text>
        <View className="gap-2">
          {dadosAno.map((mes, idx) => (
            <View key={idx} className="py-2 border-b border-border/50 last:border-b-0">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-foreground font-semibold">{mes.nome}</Text>
                <Text className={`font-bold ${mes.lucro > 0 ? 'text-success' : 'text-error'}`}>
                  R$ {mes.lucro.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between text-xs text-muted">
                <Text>Receita: R$ {mes.receita.toFixed(2)}</Text>
                <Text>Margem: {mes.margem.toFixed(1)}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Estatísticas Gerais */}
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-foreground font-semibold mb-3">Estatísticas Gerais</Text>
        <View className="gap-2">
          <View className="flex-row justify-between py-2 border-b border-border/50">
            <Text className="text-muted">Meses com Dados</Text>
            <Text className="text-foreground font-bold">{statsAnuais.mesesComDados}/12</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-border/50">
            <Text className="text-muted">Receita Média Mensal</Text>
            <Text className="text-foreground font-bold">R$ {statsAnuais.mediaReceitaMensal.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-border/50">
            <Text className="text-muted">Lucro Médio Mensal</Text>
            <Text className="text-foreground font-bold">R$ {statsAnuais.mediaLucroMensal.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-muted">Margem Média Anual</Text>
            <Text className="text-foreground font-bold">{statsAnuais.margemMedia.toFixed(1)}%</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
