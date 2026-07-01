import React, { useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useInstallations } from '@/context/InstallationsContext';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/use-colors';
import { gerarAlertasFinanceiros, calcularScoreSaude } from '@/lib/financial-alerts';
import {
  calcularReceitaBruta,
  calcularDespesasTotal,
  calcularCombustivelTotal,
  calcularLucroLiquido,
} from '@/lib/finance-utils';

export function AlertasFinanceiros() {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano } = useMonth();
  const { state: financeState, adicionarAlerta, removerAlerta } = useFinance();
  const colors = useColors();

  // Cálculos
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

  // Gerar alertas
  const alertas = useMemo(() => {
    return gerarAlertasFinanceiros(
      instalacoes,
      financeState.expenses,
      financeState.fuelSupplies,
      mes,
      ano,
      {
        metaFaturamento: financeState.metaFaturamento,
        metaLucro: financeState.metaLucro,
        metaDespesasMax: financeState.metaDespesasMax,
        precoMedioCombustivel: financeState.precoMedioCombustivel,
        consumoMedioVeiculo: financeState.consumoMedioVeiculo,
      },
      paymentMode
    );
  }, [
    instalacoes,
    financeState.expenses,
    financeState.fuelSupplies,
    mes,
    ano,
    financeState.metaFaturamento,
    financeState.metaLucro,
    financeState.metaDespesasMax,
    financeState.precoMedioCombustivel,
    financeState.consumoMedioVeiculo,
    paymentMode,
  ]);

  // Score de saúde
  const scoreSaude = useMemo(() => {
    return calcularScoreSaude(
      receitaBruta,
      lucroLiquido,
      despesasTotal,
      financeState.metaFaturamento,
      financeState.metaLucro
    );
  }, [receitaBruta, lucroLiquido, despesasTotal, financeState.metaFaturamento, financeState.metaLucro]);

  // Cores do score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success/10';
    if (score >= 60) return 'bg-warning/10';
    return 'bg-error/10';
  };

  if (alertas.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      {/* Score de Saúde */}
      <View className={`rounded-lg p-4 border ${getScoreBgColor(scoreSaude)} border-current`}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-muted text-sm">Saúde Financeira</Text>
          <Text className={`text-2xl font-bold ${getScoreColor(scoreSaude)}`}>
            {scoreSaude.toFixed(0)}
          </Text>
        </View>
        <View className="w-full bg-background rounded-full h-2">
          <View
            className={`h-2 rounded-full ${
              scoreSaude >= 80 ? 'bg-success' : scoreSaude >= 60 ? 'bg-warning' : 'bg-error'
            }`}
            style={{ width: `${scoreSaude}%` }}
          />
        </View>
      </View>

      {/* Alertas */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
        {alertas.map(alerta => (
          <TouchableOpacity
            key={alerta.id}
            onPress={() => removerAlerta(alerta.id)}
            className={`rounded-lg p-3 min-w-[280px] border ${
              alerta.tipo === 'erro'
                ? 'bg-error/10 border-error'
                : alerta.tipo === 'sucesso'
                ? 'bg-success/10 border-success'
                : 'bg-warning/10 border-warning'
            }`}
          >
            <Text className={`text-sm font-semibold ${
              alerta.tipo === 'erro'
                ? 'text-error'
                : alerta.tipo === 'sucesso'
                ? 'text-success'
                : 'text-warning'
            }`}>
              {alerta.mensagem}
            </Text>
            <Text className="text-xs text-muted mt-1">Toque para descartar</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
