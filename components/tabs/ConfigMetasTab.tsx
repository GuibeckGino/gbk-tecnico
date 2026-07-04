import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/use-colors';

export function ConfigMetasTab() {
  const { state: financeState, atualizarMetas } = useFinance();
  const colors = useColors();

  const [metaFaturamento, setMetaFaturamento] = useState(
    financeState.metaFaturamento.toString()
  );
  const [metaLucro, setMetaLucro] = useState(financeState.metaLucro.toString());
  const [metaDespesasMax, setMetaDespesasMax] = useState(
    financeState.metaDespesasMax.toString()
  );
  const [precoMedioCombustivel, setPrecoMedioCombustivel] = useState(
    financeState.precoMedioCombustivel.toString()
  );
  const [consumoMedioVeiculo, setConsumoMedioVeiculo] = useState(
    financeState.consumoMedioVeiculo.toString()
  );

  const handleSalvarMetas = () => {
    try {
      const novasMetas = {
        metaFaturamento: parseFloat(metaFaturamento),
        metaLucro: parseFloat(metaLucro),
        metaDespesasMax: parseFloat(metaDespesasMax),
        precoMedioCombustivel: parseFloat(precoMedioCombustivel),
        consumoMedioVeiculo: parseFloat(consumoMedioVeiculo),
      };

      // Validar valores
      if (
        isNaN(novasMetas.metaFaturamento) ||
        isNaN(novasMetas.metaLucro) ||
        isNaN(novasMetas.metaDespesasMax) ||
        isNaN(novasMetas.precoMedioCombustivel) ||
        isNaN(novasMetas.consumoMedioVeiculo)
      ) {
        Alert.alert('Erro', 'Todos os campos devem ser números válidos');
        return;
      }

      if (
        novasMetas.metaFaturamento <= 0 ||
        novasMetas.metaLucro <= 0 ||
        novasMetas.metaDespesasMax <= 0 ||
        novasMetas.precoMedioCombustivel <= 0 ||
        novasMetas.consumoMedioVeiculo <= 0
      ) {
        Alert.alert('Erro', 'Todos os valores devem ser maiores que zero');
        return;
      }

      atualizarMetas(novasMetas);
      Alert.alert('Sucesso', 'Metas atualizadas com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar as metas');
    }
  };

  const handleResetarMetas = () => {
    Alert.alert('Confirmar', 'Deseja resetar para os valores padrão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Resetar',
        style: 'destructive',
        onPress: () => {
          setMetaFaturamento('6760');
          setMetaLucro('3380');
          setMetaDespesasMax('1352');
          setPrecoMedioCombustivel('5.50');
          setConsumoMedioVeiculo('8.00');
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="text-foreground font-semibold text-lg mb-6">
        Configurar Metas Financeiras
      </Text>

      {/* Meta de Faturamento */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold mb-2">Meta de Faturamento Mensal</Text>
        <Text className="text-muted text-sm mb-2">
          Valor esperado de receita bruta por mês
        </Text>
        <View className="flex-row items-center bg-background border border-border rounded-lg p-3">
          <Text className="text-foreground font-bold mr-2">R$</Text>
          <TextInput
            value={metaFaturamento}
            onChangeText={setMetaFaturamento}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            className="flex-1 text-foreground"
          />
        </View>
        <Text className="text-xs text-muted mt-2">
          Valor atual: R$ {financeState.metaFaturamento.toFixed(2)}
        </Text>
      </View>

      {/* Meta de Lucro */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold mb-2">Meta de Lucro Mensal</Text>
        <Text className="text-muted text-sm mb-2">
          Valor esperado de lucro líquido por mês
        </Text>
        <View className="flex-row items-center bg-background border border-border rounded-lg p-3">
          <Text className="text-foreground font-bold mr-2">R$</Text>
          <TextInput
            value={metaLucro}
            onChangeText={setMetaLucro}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            className="flex-1 text-foreground"
          />
        </View>
        <Text className="text-xs text-muted mt-2">
          Valor atual: R$ {financeState.metaLucro.toFixed(2)}
        </Text>
      </View>

      {/* Meta de Despesas Máximas */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold mb-2">Meta de Despesas Máximas</Text>
        <Text className="text-muted text-sm mb-2">
          Limite máximo de despesas operacionais por mês
        </Text>
        <View className="flex-row items-center bg-background border border-border rounded-lg p-3">
          <Text className="text-foreground font-bold mr-2">R$</Text>
          <TextInput
            value={metaDespesasMax}
            onChangeText={setMetaDespesasMax}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            className="flex-1 text-foreground"
          />
        </View>
        <Text className="text-xs text-muted mt-2">
          Valor atual: R$ {financeState.metaDespesasMax.toFixed(2)}
        </Text>
      </View>

      {/* Preço Médio Combustível */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold mb-2">Preço Médio do Combustível</Text>
        <Text className="text-muted text-sm mb-2">
          Preço esperado por litro (para alertas)
        </Text>
        <View className="flex-row items-center bg-background border border-border rounded-lg p-3">
          <Text className="text-foreground font-bold mr-2">R$</Text>
          <TextInput
            value={precoMedioCombustivel}
            onChangeText={setPrecoMedioCombustivel}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            className="flex-1 text-foreground"
          />
          <Text className="text-foreground font-bold ml-2">/L</Text>
        </View>
        <Text className="text-xs text-muted mt-2">
          Valor atual: R$ {financeState.precoMedioCombustivel.toFixed(2)}/L
        </Text>
      </View>

      {/* Consumo Médio Veículo */}
      <View className="mb-6">
        <Text className="text-foreground font-semibold mb-2">Consumo Médio do Veículo</Text>
        <Text className="text-muted text-sm mb-2">
          Consumo esperado em km/L (para alertas)
        </Text>
        <View className="flex-row items-center bg-background border border-border rounded-lg p-3">
          <TextInput
            value={consumoMedioVeiculo}
            onChangeText={setConsumoMedioVeiculo}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            className="flex-1 text-foreground"
          />
          <Text className="text-foreground font-bold ml-2">km/L</Text>
        </View>
        <Text className="text-xs text-muted mt-2">
          Valor atual: {financeState.consumoMedioVeiculo.toFixed(2)} km/L
        </Text>
      </View>

      {/* Resumo */}
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-foreground font-semibold mb-3">Resumo das Metas</Text>
        <View className="gap-2">
          <View className="flex-row justify-between py-2 border-b border-border/50">
            <Text className="text-muted">Faturamento</Text>
            <Text className="text-foreground font-bold">R$ {metaFaturamento}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-border/50">
            <Text className="text-muted">Lucro</Text>
            <Text className="text-foreground font-bold">R$ {metaLucro}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-border/50">
            <Text className="text-muted">Despesas Máximas</Text>
            <Text className="text-foreground font-bold">R$ {metaDespesasMax}</Text>
          </View>
          <View className="flex-row justify-between py-2 border-b border-border/50">
            <Text className="text-muted">Preço Combustível</Text>
            <Text className="text-foreground font-bold">R$ {precoMedioCombustivel}/L</Text>
          </View>
          <View className="flex-row justify-between py-2">
            <Text className="text-muted">Consumo Veículo</Text>
            <Text className="text-foreground font-bold">{consumoMedioVeiculo} km/L</Text>
          </View>
        </View>
      </View>

      {/* Botões */}
      <View className="flex-row gap-2 mb-6">
        <TouchableOpacity
          onPress={handleResetarMetas}
          className="flex-1 p-3 rounded-lg bg-background border border-border active:opacity-70"
        >
          <Text className="text-foreground text-center font-semibold">Resetar Padrão</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSalvarMetas}
          className="flex-1 p-3 rounded-lg bg-primary active:opacity-80"
        >
          <Text className="text-white text-center font-semibold">Salvar Metas</Text>
        </TouchableOpacity>
      </View>

      {/* Informações */}
      <View className="bg-primary/10 rounded-lg p-4 border border-primary">
        <Text className="text-foreground font-semibold mb-2">ℹ️ Informações</Text>
        <Text className="text-muted text-sm">
          As metas são usadas para:
        </Text>
        <Text className="text-muted text-sm mt-2">
          • Gerar alertas quando valores estão abaixo/acima
        </Text>
        <Text className="text-muted text-sm">
          • Calcular o Score de Saúde Financeira
        </Text>
        <Text className="text-muted text-sm">
          • Mostrar progresso em gráficos e comparações
        </Text>
      </View>
    </ScrollView>
  );
}
