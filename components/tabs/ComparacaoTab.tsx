import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useInstallations } from '@/context/InstallationsContext';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/use-colors';
import {
  calcularReceitaBruta,
  calcularDespesasTotal,
  calcularCombustivelTotal,
  calcularLucroLiquido,
} from '@/lib/finance-utils';
import { LineChart } from 'react-native-chart-kit';

type PeriodoTipo = 'ultimos3' | 'ultimos6' | 'ultimos12';

export function ComparacaoTab() {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes: mesSelecionado, ano: anoSelecionado } = useMonth();
  const { state: financeState } = useFinance();
  const colors = useColors();
  const [periodo, setPeriodo] = useState<PeriodoTipo>('ultimos3');

  // Gerar dados dos últimos N meses
  const dadosMeses = useMemo(() => {
    const meses: Array<{
      mes: number;
      ano: number;
      nome: string;
      receita: number;
      lucro: number;
      despesas: number;
      combustivel: number;
    }> = [];

    let mesAtual = mesSelecionado;
    let anoAtual = anoSelecionado;
    const quantidadeMeses = periodo === 'ultimos3' ? 3 : periodo === 'ultimos6' ? 6 : 12;

    // Ir para trás N meses
    for (let i = 0; i < quantidadeMeses; i++) {
      const receita = calcularReceitaBruta(instalacoes, mesAtual, anoAtual, paymentMode);
      const despesas = calcularDespesasTotal(financeState.expenses, mesAtual, anoAtual);
      const combustivel = calcularCombustivelTotal(financeState.fuelSupplies, mesAtual, anoAtual);
      const lucro = calcularLucroLiquido(receita, despesas, combustivel);

      const nomesMeses = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
      ];

      meses.unshift({
        mes: mesAtual,
        ano: anoAtual,
        nome: `${nomesMeses[mesAtual]}/${anoAtual}`,
        receita,
        lucro,
        despesas,
        combustivel,
      });

      // Ir para o mês anterior
      if (mesAtual === 0) {
        mesAtual = 11;
        anoAtual--;
      } else {
        mesAtual--;
      }
    }

    return meses;
  }, [mesSelecionado, anoSelecionado, instalacoes, financeState.expenses, financeState.fuelSupplies, paymentMode, periodo]);

  // Dados para gráfico
  const chartData = useMemo(() => {
    return {
      labels: dadosMeses.map(m => m.nome),
      datasets: [
        {
          data: dadosMeses.map(m => m.receita),
          color: () => colors.primary,
          strokeWidth: 2,
        },
        {
          data: dadosMeses.map(m => m.lucro),
          color: () => colors.success,
          strokeWidth: 2,
        },
      ],
      legend: ['Receita', 'Lucro'],
    };
  }, [dadosMeses, colors]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalReceita = dadosMeses.reduce((sum, m) => sum + m.receita, 0);
    const totalLucro = dadosMeses.reduce((sum, m) => sum + m.lucro, 0);
    const totalDespesas = dadosMeses.reduce((sum, m) => sum + m.despesas, 0);
    const totalCombustivel = dadosMeses.reduce((sum, m) => sum + m.combustivel, 0);

    const mediaReceita = totalReceita / dadosMeses.length;
    const mediaLucro = totalLucro / dadosMeses.length;

    // Crescimento (último mês vs primeiro mês)
    const crescimentoReceita = dadosMeses.length > 1
      ? ((dadosMeses[dadosMeses.length - 1].receita - dadosMeses[0].receita) / dadosMeses[0].receita) * 100
      : 0;

    const crescimentoLucro = dadosMeses.length > 1
      ? ((dadosMeses[dadosMeses.length - 1].lucro - dadosMeses[0].lucro) / Math.max(1, dadosMeses[0].lucro)) * 100
      : 0;

    return {
      totalReceita,
      totalLucro,
      totalDespesas,
      totalCombustivel,
      mediaReceita,
      mediaLucro,
      crescimentoReceita,
      crescimentoLucro,
      melhorMesReceita: dadosMeses.reduce((max, m) => m.receita > max.receita ? m : max),
      melhorMesLucro: dadosMeses.reduce((max, m) => m.lucro > max.lucro ? m : max),
      piorMesReceita: dadosMeses.reduce((min, m) => m.receita < min.receita ? m : min),
      piorMesLucro: dadosMeses.reduce((min, m) => m.lucro < min.lucro ? m : min),
    };
  }, [dadosMeses]);

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView className="flex-1 p-4">
      {/* Seletor de Período */}
      <View className="gap-2 mb-6">
        <Text className="text-foreground font-semibold text-sm">Período</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setPeriodo('ultimos3')}
            className={`flex-1 p-3 rounded-lg border ${
              periodo === 'ultimos3'
                ? 'bg-primary border-primary'
                : 'bg-background border-border'
            }`}
          >
            <Text className={`text-center font-semibold text-sm ${
              periodo === 'ultimos3' ? 'text-white' : 'text-foreground'
            }`}>
              3 Meses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriodo('ultimos6')}
            className={`flex-1 p-3 rounded-lg border ${
              periodo === 'ultimos6'
                ? 'bg-primary border-primary'
                : 'bg-background border-border'
            }`}
          >
            <Text className={`text-center font-semibold text-sm ${
              periodo === 'ultimos6' ? 'text-white' : 'text-foreground'
            }`}>
              6 Meses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriodo('ultimos12')}
            className={`flex-1 p-3 rounded-lg border ${
              periodo === 'ultimos12'
                ? 'bg-primary border-primary'
                : 'bg-background border-border'
            }`}
          >
            <Text className={`text-center font-semibold text-sm ${
              periodo === 'ultimos12' ? 'text-white' : 'text-foreground'
            }`}>
              12 Meses
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gráfico de Linha */}
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-foreground font-semibold mb-3">Receita vs Lucro</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: colors.surface,
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 0,
            color: () => colors.border,
            labelColor: () => colors.muted,
            style: {
              borderRadius: 8,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: colors.primary,
            },
          }}
          bezier
          style={{
            borderRadius: 8,
          }}
        />
      </View>

      {/* Crescimento */}
      <View className="gap-3 mb-6">
        <View className={`rounded-lg p-4 border ${
          stats.crescimentoReceita > 0
            ? 'bg-success/10 border-success'
            : 'bg-error/10 border-error'
        }`}>
          <Text className="text-muted text-sm mb-1">Crescimento de Receita</Text>
          <Text className={`text-2xl font-bold ${
            stats.crescimentoReceita > 0 ? 'text-success' : 'text-error'
          }`}>
            {stats.crescimentoReceita > 0 ? '+' : ''}{stats.crescimentoReceita.toFixed(1)}%
          </Text>
          <Text className="text-xs text-muted mt-1">
            {dadosMeses[0].nome} → {dadosMeses[dadosMeses.length - 1].nome}
          </Text>
        </View>

        <View className={`rounded-lg p-4 border ${
          stats.crescimentoLucro > 0
            ? 'bg-success/10 border-success'
            : 'bg-error/10 border-error'
        }`}>
          <Text className="text-muted text-sm mb-1">Crescimento de Lucro</Text>
          <Text className={`text-2xl font-bold ${
            stats.crescimentoLucro > 0 ? 'text-success' : 'text-error'
          }`}>
            {stats.crescimentoLucro > 0 ? '+' : ''}{stats.crescimentoLucro.toFixed(1)}%
          </Text>
          <Text className="text-xs text-muted mt-1">
            {dadosMeses[0].nome} → {dadosMeses[dadosMeses.length - 1].nome}
          </Text>
        </View>
      </View>

      {/* Médias */}
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-foreground font-semibold mb-3">Médias do Período</Text>
        <View className="gap-2">
          <View className="flex-row justify-between items-center py-2 border-b border-border/50">
            <Text className="text-muted">Receita Média</Text>
            <Text className="text-foreground font-bold">R$ {stats.mediaReceita.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between items-center py-2 border-b border-border/50">
            <Text className="text-muted">Lucro Médio</Text>
            <Text className="text-foreground font-bold">R$ {stats.mediaLucro.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-muted">Despesas Médias</Text>
            <Text className="text-foreground font-bold">R$ {(stats.totalDespesas / dadosMeses.length).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Melhores e Piores Meses */}
      <View className="gap-3 mb-6">
        <View className="bg-success/10 rounded-lg p-4 border border-success">
          <Text className="text-muted text-sm mb-2">Melhor Mês (Receita)</Text>
          <Text className="text-foreground font-bold">{stats.melhorMesReceita.nome}</Text>
          <Text className="text-success font-bold">R$ {stats.melhorMesReceita.receita.toFixed(2)}</Text>
        </View>

        <View className="bg-success/10 rounded-lg p-4 border border-success">
          <Text className="text-muted text-sm mb-2">Melhor Mês (Lucro)</Text>
          <Text className="text-foreground font-bold">{stats.melhorMesLucro.nome}</Text>
          <Text className="text-success font-bold">R$ {stats.melhorMesLucro.lucro.toFixed(2)}</Text>
        </View>

        <View className="bg-error/10 rounded-lg p-4 border border-error">
          <Text className="text-muted text-sm mb-2">Pior Mês (Receita)</Text>
          <Text className="text-foreground font-bold">{stats.piorMesReceita.nome}</Text>
          <Text className="text-error font-bold">R$ {stats.piorMesReceita.receita.toFixed(2)}</Text>
        </View>

        <View className="bg-error/10 rounded-lg p-4 border border-error">
          <Text className="text-muted text-sm mb-2">Pior Mês (Lucro)</Text>
          <Text className="text-foreground font-bold">{stats.piorMesLucro.nome}</Text>
          <Text className="text-error font-bold">R$ {stats.piorMesLucro.lucro.toFixed(2)}</Text>
        </View>
      </View>

      {/* Totais do Período */}
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-foreground font-semibold mb-3">Totais do Período</Text>
        <View className="gap-2">
          <View className="flex-row justify-between items-center py-2 border-b border-border/50">
            <Text className="text-muted">Receita Total</Text>
            <Text className="text-primary font-bold">R$ {stats.totalReceita.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between items-center py-2 border-b border-border/50">
            <Text className="text-muted">Despesas Total</Text>
            <Text className="text-error font-bold">R$ {stats.totalDespesas.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between items-center py-2 border-b border-border/50">
            <Text className="text-muted">Combustível Total</Text>
            <Text className="text-warning font-bold">R$ {stats.totalCombustivel.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-foreground font-semibold">Lucro Total</Text>
            <Text className="text-success font-bold">R$ {stats.totalLucro.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
