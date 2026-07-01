import React, { useMemo } from 'react';
import { ScrollView, View, Text } from 'react-native';
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
  calcularLucroPorInstalacao,
  calcularLucroPorBairro,
  calcularLucroPorTipo,
} from '@/lib/finance-utils';

export function LucroTab() {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano } = useMonth();
  const { state: financeState } = useFinance();
  const colors = useColors();

  // Cálculos principais
  const receitaBruta = useMemo(() => {
    return calcularReceitaBruta(instalacoes, mes, ano, paymentMode);
  }, [instalacoes, mes, ano, paymentMode]);

  const despesasTotal = useMemo(() => {
    return calcularDespesasTotal(financeState.expenses, mes, ano);
  }, [financeState.expenses, mes, ano]);

  const combustivelTotal = useMemo(() => {
    return calcularCombustivelTotal(financeState.fuelSupplies, mes, ano);
  }, [financeState.fuelSupplies, mes, ano]);

  const lucroLiquido = useMemo(() => {
    return calcularLucroLiquido(receitaBruta, despesasTotal, combustivelTotal);
  }, [receitaBruta, despesasTotal, combustivelTotal]);

  const margemLucro = useMemo(() => {
    return calcularMargemLucro(lucroLiquido, receitaBruta);
  }, [lucroLiquido, receitaBruta]);

  const totalInstalacoes = useMemo(() => {
    return instalacoes.filter(i => {
      const data = new Date(i.createdAt);
      return data.getMonth() + 1 === mes && data.getFullYear() === ano;
    }).length;
  }, [instalacoes, mes, ano]);

  const lucroPorInstalacao = useMemo(() => {
    return calcularLucroPorInstalacao(lucroLiquido, totalInstalacoes);
  }, [lucroLiquido, totalInstalacoes]);

  const lucroPorBairro = useMemo(() => {
    return calcularLucroPorBairro(
      instalacoes,
      financeState.expenses,
      financeState.fuelSupplies,
      mes,
      ano,
      paymentMode
    );
  }, [instalacoes, financeState.expenses, financeState.fuelSupplies, mes, ano, paymentMode]);

  const lucroPorTipo = useMemo(() => {
    return calcularLucroPorTipo(
      instalacoes,
      financeState.expenses,
      financeState.fuelSupplies,
      mes,
      ano,
      paymentMode
    );
  }, [instalacoes, financeState.expenses, financeState.fuelSupplies, mes, ano, paymentMode]);

  return (
    <ScrollView className="flex-1 p-4">
      {/* Resumo Principal */}
      <View className="gap-3 mb-6">
        {/* Lucro Líquido */}
        <View className={`rounded-lg p-4 border ${
          lucroLiquido > 0 ? 'bg-success/10 border-success' : 'bg-error/10 border-error'
        }`}>
          <Text className="text-muted text-sm mb-1">Lucro Líquido</Text>
          <Text className={`text-3xl font-bold ${
            lucroLiquido > 0 ? 'text-success' : 'text-error'
          }`}>
            R$ {lucroLiquido.toFixed(2)}
          </Text>
          <Text className="text-xs text-muted mt-2">
            Margem: {margemLucro.toFixed(1)}%
          </Text>
        </View>

        {/* Receita vs Despesas */}
        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-foreground font-semibold mb-3">Receita vs Despesas</Text>
          <View className="gap-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-muted">Receita Bruta</Text>
              <Text className="text-success font-bold">R$ {receitaBruta.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-muted">Despesas</Text>
              <Text className="text-error font-bold">- R$ {despesasTotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-muted">Combustível</Text>
              <Text className="text-error font-bold">- R$ {combustivelTotal.toFixed(2)}</Text>
            </View>
            <View className="border-t border-border pt-2 mt-2 flex-row justify-between items-center">
              <Text className="text-foreground font-semibold">Lucro Líquido</Text>
              <Text className={`text-lg font-bold ${
                lucroLiquido > 0 ? 'text-success' : 'text-error'
              }`}>
                R$ {lucroLiquido.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Lucro por Instalação */}
        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-muted text-sm mb-1">Lucro por Instalação</Text>
          <Text className="text-2xl font-bold text-foreground">
            R$ {lucroPorInstalacao.toFixed(2)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {totalInstalacoes} instalações
          </Text>
        </View>
      </View>

      {/* Análise por Bairro */}
      {Object.keys(lucroPorBairro).length > 0 && (
        <View className="bg-surface rounded-lg p-4 border border-border mb-6">
          <Text className="text-foreground font-semibold mb-3">Lucro por Bairro</Text>
          {Object.entries(lucroPorBairro)
            .sort((a, b) => b[1] - a[1])
            .map(([bairro, lucro]) => (
              <View key={bairro} className="py-2 border-b border-border/50">
                <View className="flex-row justify-between items-center">
                  <Text className="text-muted flex-1">{bairro}</Text>
                  <Text className={`font-bold ${lucro > 0 ? 'text-success' : 'text-error'}`}>
                    R$ {lucro.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Análise por Tipo de Serviço */}
      {Object.keys(lucroPorTipo).length > 0 && (
        <View className="bg-surface rounded-lg p-4 border border-border mb-6">
          <Text className="text-foreground font-semibold mb-3">Lucro por Tipo de Serviço</Text>
          {Object.entries(lucroPorTipo)
            .sort((a, b) => b[1] - a[1])
            .map(([tipo, lucro]) => (
              <View key={tipo} className="py-2 border-b border-border/50">
                <View className="flex-row justify-between items-center">
                  <Text className="text-muted">{tipo}</Text>
                  <Text className={`font-bold ${lucro > 0 ? 'text-success' : 'text-error'}`}>
                    R$ {lucro.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Indicadores de Saúde */}
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-foreground font-semibold mb-3">Indicadores de Saúde</Text>
        
        {/* Margem de Lucro */}
        <View className="py-2 border-b border-border/50">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-muted">Margem de Lucro</Text>
            <Text className={`font-bold ${margemLucro > 30 ? 'text-success' : margemLucro > 15 ? 'text-warning' : 'text-error'}`}>
              {margemLucro.toFixed(1)}%
            </Text>
          </View>
          <View className="w-full bg-background rounded-full h-2">
            <View
              className={`h-2 rounded-full ${
                margemLucro > 30 ? 'bg-success' : margemLucro > 15 ? 'bg-warning' : 'bg-error'
              }`}
              style={{ width: `${Math.min(margemLucro, 100)}%` }}
            />
          </View>
        </View>

        {/* Proporção de Despesas */}
        <View className="py-2 border-b border-border/50 mt-3">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-muted">Proporção de Despesas</Text>
            <Text className="font-bold">
              {((despesasTotal / receitaBruta) * 100).toFixed(1)}%
            </Text>
          </View>
          <View className="w-full bg-background rounded-full h-2">
            <View
              className="h-2 rounded-full bg-error"
              style={{ width: `${Math.min((despesasTotal / receitaBruta) * 100, 100)}%` }}
            />
          </View>
        </View>

        {/* Proporção de Combustível */}
        <View className="py-2 mt-3">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-muted">Proporção de Combustível</Text>
            <Text className="font-bold">
              {((combustivelTotal / receitaBruta) * 100).toFixed(1)}%
            </Text>
          </View>
          <View className="w-full bg-background rounded-full h-2">
            <View
              className="h-2 rounded-full bg-warning"
              style={{ width: `${Math.min((combustivelTotal / receitaBruta) * 100, 100)}%` }}
            />
          </View>
        </View>
      </View>

      {/* Resumo de Metas */}
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-foreground font-semibold mb-3">Metas Financeiras</Text>
        
        <View className="py-2 border-b border-border/50">
          <View className="flex-row justify-between items-center">
            <Text className="text-muted">Meta de Faturamento</Text>
            <Text className="text-foreground font-bold">R$ {financeState.metaFaturamento.toFixed(2)}</Text>
          </View>
          <Text className="text-xs text-muted mt-1">
            Atingido: {((receitaBruta / financeState.metaFaturamento) * 100).toFixed(0)}%
          </Text>
        </View>

        <View className="py-2 border-b border-border/50 mt-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-muted">Meta de Lucro</Text>
            <Text className="text-foreground font-bold">R$ {financeState.metaLucro.toFixed(2)}</Text>
          </View>
          <Text className="text-xs text-muted mt-1">
            Atingido: {((lucroLiquido / financeState.metaLucro) * 100).toFixed(0)}%
          </Text>
        </View>

        <View className="py-2 mt-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-muted">Meta de Despesas</Text>
            <Text className="text-foreground font-bold">R$ {financeState.metaDespesasMax.toFixed(2)}</Text>
          </View>
          <Text className="text-xs text-muted mt-1">
            Gasto: {((despesasTotal / financeState.metaDespesasMax) * 100).toFixed(0)}%
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
