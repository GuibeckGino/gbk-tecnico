import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
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


interface FinanceWidgetsProps {
  onNavigateToFinance?: () => void;
}

export function FinanceWidgets({ onNavigateToFinance }: FinanceWidgetsProps) {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano } = useMonth();
  const { state: financeState } = useFinance();
  const colors = useColors();

  const dados = useMemo(() => {
    const receita = calcularReceitaBruta(instalacoes, mes, ano, paymentMode);
    const despesas = calcularDespesasTotal(financeState.expenses, mes, ano);
    const combustivel = calcularCombustivelTotal(financeState.fuelSupplies, mes, ano);
    const lucro = calcularLucroLiquido(receita, despesas, combustivel);

    return {
      receita,
      despesas,
      combustivel,
      lucro,
      percentualReceita: (receita / financeState.metaFaturamento) * 100,
      percentualLucro: (lucro / financeState.metaLucro) * 100,
      percentualDespesas: (despesas / financeState.metaDespesasMax) * 100,
    };
  }, [instalacoes, mes, ano, financeState, paymentMode]);

  const screenWidth = Dimensions.get('window').width;
  const widgetWidth = (screenWidth - 32) / 2;

  return (
    <View>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-foreground font-bold text-lg">Finanças do Mês</Text>
        <TouchableOpacity
          onPress={onNavigateToFinance}
          className="px-3 py-1 rounded-full bg-primary/10 active:opacity-70"
        >
          <Text className="text-primary text-xs font-semibold">Ver Tudo</Text>
        </TouchableOpacity>
      </View>

      {/* Primeira Linha: Receita e Lucro */}
      <View className="flex-row gap-3 mb-3">
        {/* Widget Receita */}
        <TouchableOpacity
          onPress={onNavigateToFinance}
          style={{ width: widgetWidth }}
          className="bg-primary/10 rounded-lg p-3 border border-primary active:opacity-70"
        >
          <Text className="text-muted text-xs mb-1">Receita</Text>
          <Text className="text-primary font-bold text-lg mb-2">
            R$ {dados.receita.toFixed(0)}
          </Text>
          <View className="flex-row items-center gap-1">
            <View className="flex-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{ width: `${Math.min(dados.percentualReceita, 100)}%` }}
              />
            </View>
            <Text className="text-xs text-muted font-semibold">
              {dados.percentualReceita.toFixed(0)}%
            </Text>
          </View>
          <Text className="text-xs text-muted mt-1">
            Meta: R$ {financeState.metaFaturamento.toFixed(0)}
          </Text>
        </TouchableOpacity>

        {/* Widget Lucro */}
        <TouchableOpacity
          onPress={onNavigateToFinance}
          style={{ width: widgetWidth }}
          className={`rounded-lg p-3 border active:opacity-70 ${
            dados.lucro > 0
              ? 'bg-success/10 border-success'
              : 'bg-error/10 border-error'
          }`}
        >
          <Text className="text-muted text-xs mb-1">Lucro</Text>
          <Text className={`font-bold text-lg mb-2 ${
            dados.lucro > 0 ? 'text-success' : 'text-error'
          }`}>
            R$ {dados.lucro.toFixed(0)}
          </Text>
          <View className="flex-row items-center gap-1">
            <View className="flex-1 h-1.5 bg-success/20 rounded-full overflow-hidden">
              <View
                className={dados.lucro > 0 ? 'bg-success' : 'bg-error'}
                style={{ 
                  height: '100%',
                  width: `${Math.min(Math.max(dados.percentualLucro, 0), 100)}%` 
                }}
              />
            </View>
            <Text className="text-xs text-muted font-semibold">
              {dados.percentualLucro.toFixed(0)}%
            </Text>
          </View>
          <Text className="text-xs text-muted mt-1">
            Meta: R$ {financeState.metaLucro.toFixed(0)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Segunda Linha: Despesas e Combustível */}
      <View className="flex-row gap-3">
        {/* Widget Despesas */}
        <TouchableOpacity
          onPress={onNavigateToFinance}
          style={{ width: widgetWidth }}
          className={`rounded-lg p-3 border active:opacity-70 ${
            dados.despesas > financeState.metaDespesasMax
              ? 'bg-error/10 border-error'
              : 'bg-warning/10 border-warning'
          }`}
        >
          <Text className="text-muted text-xs mb-1">Despesas</Text>
          <Text className={`font-bold text-lg mb-2 ${
            dados.despesas > financeState.metaDespesasMax ? 'text-error' : 'text-warning'
          }`}>
            R$ {dados.despesas.toFixed(0)}
          </Text>
          <View className="flex-row items-center gap-1">
            <View className="flex-1 h-1.5 bg-warning/20 rounded-full overflow-hidden">
              <View
                className={dados.despesas > financeState.metaDespesasMax ? 'bg-error' : 'bg-warning'}
                style={{ 
                  height: '100%',
                  width: `${Math.min(dados.percentualDespesas, 100)}%` 
                }}
              />
            </View>
            <Text className="text-xs text-muted font-semibold">
              {dados.percentualDespesas.toFixed(0)}%
            </Text>
          </View>
          <Text className="text-xs text-muted mt-1">
            Limite: R$ {financeState.metaDespesasMax.toFixed(0)}
          </Text>
        </TouchableOpacity>

        {/* Widget Combustível */}
        <TouchableOpacity
          onPress={onNavigateToFinance}
          style={{ width: widgetWidth }}
          className="bg-warning/10 rounded-lg p-3 border border-warning active:opacity-70"
        >
          <Text className="text-muted text-xs mb-1">Combustível</Text>
          <Text className="text-warning font-bold text-lg mb-2">
            R$ {dados.combustivel.toFixed(0)}
          </Text>
          <View className="flex-row items-center gap-1">
            <View className="flex-1 h-1.5 bg-warning/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-warning"
                style={{ 
                  width: `${Math.min((dados.combustivel / (dados.receita * 0.15)), 100)}%` 
                }}
              />
            </View>
            <Text className="text-xs text-muted font-semibold">
              {((dados.combustivel / dados.receita) * 100).toFixed(0)}%
            </Text>
          </View>
          <Text className="text-xs text-muted mt-1">
            {((dados.combustivel / dados.receita) * 100).toFixed(1)}% da receita
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Status Geral */}
      <View className="bg-surface rounded-lg p-3 border border-border mt-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-foreground font-semibold text-sm">Saúde Financeira</Text>
          <Text className="text-primary font-bold">
            {Math.round(
              ((dados.receita / financeState.metaFaturamento) * 0.4 +
                (Math.max(dados.lucro, 0) / financeState.metaLucro) * 0.4 +
                (Math.max(1 - dados.despesas / financeState.metaDespesasMax, 0)) * 0.2) *
                100
            )}%
          </Text>
        </View>
        <View className="h-2 bg-background rounded-full overflow-hidden">
          <View
            className="h-full bg-primary"
            style={{
              width: `${Math.min(
                ((dados.receita / financeState.metaFaturamento) * 0.4 +
                  (Math.max(dados.lucro, 0) / financeState.metaLucro) * 0.4 +
                  (Math.max(1 - dados.despesas / financeState.metaDespesasMax, 0)) * 0.2) *
                  100,
                100
              )}%`,
            }}
          />
        </View>
      </View>
    </View>
  );
}
