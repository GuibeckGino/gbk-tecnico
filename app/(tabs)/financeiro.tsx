import React, { useState, useMemo, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useInstallations } from '@/context/InstallationsContext';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/use-colors';
import {
  calcularSummary,
  calcularLucroLiquido,
  calcularMargemLucro,
  calcularLucroPorBairro,
  calcularLucroPorTipo,
} from '@/lib/finance-utils';
import { ReceitasTab } from '@/components/tabs/ReceitasTab';
import { DespesasTab } from '@/components/tabs/DespesasTab';
import { CombustivelTab } from '@/components/tabs/CombustivelTab';
import { LucroTab } from '@/components/tabs/LucroTab';
import { RelatoriosTab } from '@/components/tabs/RelatoriosTab';
import { AlertasFinanceiros } from '@/components/AlertasFinanceiros';

type TabType = 'resumo' | 'receitas' | 'despesas' | 'combustivel' | 'lucro' | 'relatorios';

export default function FinanceiroScreen() {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano, proximoMes, mesPrevio, mesAnoFormatado } = useMonth();
  const { state: financeState } = useFinance();
  const colors = useColors();
  const [abaSelecionada, setAbaSelecionada] = useState<TabType>('resumo');

  const summary = useMemo(() => {
    return calcularSummary(
      instalacoes,
      financeState.expenses,
      financeState.fuelSupplies,
      mes,
      ano,
      22, // dias trabalhados padrão
      paymentMode
    );
  }, [instalacoes, financeState.expenses, financeState.fuelSupplies, mes, ano, paymentMode]);

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

  const margemLucro = useMemo(() => {
    return calcularMargemLucro(summary.lucroLiquido, summary.receitaBruta);
  }, [summary]);

  const renderTabButton = (tab: TabType, label: string) => (
    <TouchableOpacity
      onPress={() => setAbaSelecionada(tab)}
      className={`flex-1 py-3 px-2 border-b-2 ${
        abaSelecionada === tab
          ? 'border-b-primary'
          : 'border-b-border'
      }`}
    >
      <Text
        className={`text-center font-semibold text-sm ${
          abaSelecionada === tab
            ? 'text-primary'
            : 'text-muted'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Cabeçalho com Navegação de Meses */}
        <View className="bg-primary p-4 mb-4">
          <Text className="text-white text-2xl font-bold">Financeiro</Text>
          
          {/* Navegação de Meses */}
          <View className="flex-row justify-between items-center mt-3">
            <TouchableOpacity
              onPress={mesPrevio}
              className="p-2 active:opacity-70"
            >
              <Text className="text-white text-lg font-bold">‹</Text>
            </TouchableOpacity>
            
            <Text className="text-white text-sm font-semibold">
              {mesAnoFormatado}
            </Text>
            
            <TouchableOpacity
              onPress={proximoMes}
              className="p-2 active:opacity-70"
            >
              <Text className="text-white text-lg font-bold">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alertas Financeiros */}
        <View className="px-4 mb-4">
          <AlertasFinanceiros />
        </View>

        {/* Abas */}
        <View className="flex-row border-b border-border">
          {renderTabButton('resumo', 'Resumo')}
          {renderTabButton('receitas', 'Receitas')}
          {renderTabButton('despesas', 'Despesas')}
          {renderTabButton('combustivel', 'Combustível')}
          {renderTabButton('lucro', 'Lucro')}
          {renderTabButton('relatorios', 'Relatórios')}
        </View>

        {/* Conteúdo das Abas */}
        <View className="flex-1 p-4">
          {abaSelecionada === 'resumo' && (
            <View className="gap-4">
              {/* Cards Principais */}
              <View className="gap-3">
                {/* Receita Bruta */}
                <View className="bg-surface rounded-lg p-4 border border-border">
                  <Text className="text-muted text-sm mb-1">Receita Bruta</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    R$ {summary.receitaBruta.toFixed(2)}
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    {summary.totalInstalacoes} instalações
                  </Text>
                </View>

                {/* Lucro Líquido */}
                <View className={`rounded-lg p-4 border border-border ${
                  summary.lucroLiquido > 0 ? 'bg-success/10' : 'bg-error/10'
                }`}>
                  <Text className="text-muted text-sm mb-1">Lucro Líquido</Text>
                  <Text className={`text-2xl font-bold ${
                    summary.lucroLiquido > 0 ? 'text-success' : 'text-error'
                  }`}>
                    R$ {summary.lucroLiquido.toFixed(2)}
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Margem: {margemLucro.toFixed(1)}%
                  </Text>
                </View>

                {/* Despesas */}
                <View className="bg-surface rounded-lg p-4 border border-border">
                  <Text className="text-muted text-sm mb-1">Despesas Totais</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    R$ {(summary.outrasDespesas + summary.gastosCombustivel).toFixed(2)}
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Combustível: R$ {summary.gastosCombustivel.toFixed(2)}
                  </Text>
                </View>

                {/* Ticket Médio */}
                <View className="bg-surface rounded-lg p-4 border border-border">
                  <Text className="text-muted text-sm mb-1">Ticket Médio</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    R$ {summary.ticketMedio.toFixed(2)}
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Receita por dia: R$ {summary.receitaPorDia.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Receita por Tipo */}
              <View className="bg-surface rounded-lg p-4 border border-border">
                <Text className="text-foreground font-semibold mb-3">Receita por Tipo</Text>
                {Object.entries(summary.receitaPorTipo).map(([tipo, valor]) => (
                  <View key={tipo} className="flex-row justify-between items-center py-2 border-b border-border/50">
                    <Text className="text-muted">{tipo}</Text>
                    <Text className="text-foreground font-semibold">R$ {valor.toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              {/* Lucro por Tipo */}
              <View className="bg-surface rounded-lg p-4 border border-border">
                <Text className="text-foreground font-semibold mb-3">Lucro por Tipo</Text>
                {Object.entries(lucroPorTipo).map(([tipo, valor]) => (
                  <View key={tipo} className="flex-row justify-between items-center py-2 border-b border-border/50">
                    <Text className="text-muted">{tipo}</Text>
                    <Text className={`font-semibold ${valor > 0 ? 'text-success' : 'text-error'}`}>
                      R$ {valor.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {abaSelecionada === 'receitas' && (
            <ReceitasTab />
          )}

          {abaSelecionada === 'despesas' && (
            <DespesasTab />
          )}

          {abaSelecionada === 'combustivel' && (
            <CombustivelTab />
          )}

          {abaSelecionada === 'lucro' && (
            <LucroTab />
          )}

          {abaSelecionada === 'relatorios' && (
            <RelatoriosTab />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
