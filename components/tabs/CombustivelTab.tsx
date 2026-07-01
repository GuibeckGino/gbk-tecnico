import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/use-colors';
import { FuelSupply } from '@/types/finance';
import { gerarId } from '@/types/installation';

export function CombustivelTab() {
  const { mes, ano } = useMonth();
  const { state: financeState, adicionarCombustivel, atualizarCombustivel, removerCombustivel } = useFinance();
  const colors = useColors();
  const [showModal, setShowModal] = useState(false);
  const [editingFuel, setEditingFuel] = useState<FuelSupply | null>(null);
  const [posto, setPosto] = useState('');
  const [litros, setLitros] = useState('');
  const [precoLitro, setPrecoLitro] = useState('');
  const [quilometragem, setQuilometragem] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Filtrar combustível do mês
  const combustivelDoMes = useMemo(() => {
    return financeState.fuelSupplies.filter(f => f.mes === mes && f.ano === ano);
  }, [financeState.fuelSupplies, mes, ano]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = combustivelDoMes.reduce((sum, f) => sum + f.valorTotal, 0);
    const totalLitros = combustivelDoMes.reduce((sum, f) => sum + f.litros, 0);
    const precoMedio = totalLitros > 0 ? total / totalLitros : 0;

    // Calcular consumo médio (km/litro)
    let totalKm = 0;
    for (let i = 1; i < combustivelDoMes.length; i++) {
      const kmPercorrido = combustivelDoMes[i].quilometragem - combustivelDoMes[i - 1].quilometragem;
      if (kmPercorrido > 0) {
        totalKm += kmPercorrido;
      }
    }
    const consumoMedio = totalLitros > 0 ? totalKm / totalLitros : 0;

    return {
      total,
      totalLitros,
      precoMedio,
      consumoMedio,
      quantidade: combustivelDoMes.length,
    };
  }, [combustivelDoMes]);

  const handleOpenModal = (fuel?: FuelSupply) => {
    if (fuel) {
      setEditingFuel(fuel);
      setPosto(fuel.posto);
      setLitros(fuel.litros.toString());
      setPrecoLitro(fuel.precoLitro.toString());
      setQuilometragem(fuel.quilometragem.toString());
      setObservacoes(fuel.observacoes);
    } else {
      setEditingFuel(null);
      setPosto('');
      setLitros('');
      setPrecoLitro('');
      setQuilometragem('');
      setObservacoes('');
    }
    setShowModal(true);
  };

  const handleSaveFuel = () => {
    if (!posto || !litros || !precoLitro || !quilometragem) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const litrosNum = parseFloat(litros);
    const precoNum = parseFloat(precoLitro);
    const quilomNum = parseFloat(quilometragem);

    if (isNaN(litrosNum) || isNaN(precoNum) || isNaN(quilomNum) || litrosNum <= 0 || precoNum <= 0) {
      Alert.alert('Erro', 'Valores inválidos');
      return;
    }

    if (editingFuel) {
      const updated: FuelSupply = {
        ...editingFuel,
        posto,
        litros: litrosNum,
        precoLitro: precoNum,
        valorTotal: litrosNum * precoNum,
        quilometragem: quilomNum,
        observacoes,
      };
      atualizarCombustivel(updated);
      Alert.alert('Sucesso', 'Abastecimento atualizado');
    } else {
      const newFuel: FuelSupply = {
        id: gerarId(),
        posto,
        litros: litrosNum,
        precoLitro: precoNum,
        valorTotal: litrosNum * precoNum,
        quilometragem: quilomNum,
        observacoes,
        data: new Date().toISOString(),
        mes,
        ano,
      };
      adicionarCombustivel(newFuel);
      Alert.alert('Sucesso', 'Abastecimento adicionado');
    }

    setShowModal(false);
  };

  const handleDeleteFuel = (id: string) => {
    Alert.alert('Confirmar', 'Deseja remover este abastecimento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          removerCombustivel(id);
          Alert.alert('Sucesso', 'Abastecimento removido');
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 p-4">
      {/* Estatísticas */}
      <View className="gap-3 mb-6">
        {/* Total Gasto */}
        <View className="bg-warning/10 rounded-lg p-4 border border-warning">
          <Text className="text-muted text-sm mb-1">Total Gasto</Text>
          <Text className="text-2xl font-bold text-warning">
            R$ {stats.total.toFixed(2)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {stats.totalLitros.toFixed(1)}L abastecidos
          </Text>
        </View>

        {/* Preço Médio */}
        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-muted text-sm mb-1">Preço Médio</Text>
          <Text className="text-2xl font-bold text-foreground">
            R$ {stats.precoMedio.toFixed(2)}/L
          </Text>
          <Text className="text-xs text-muted mt-1">
            {stats.quantidade} abastecimentos
          </Text>
        </View>

        {/* Consumo Médio */}
        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-muted text-sm mb-1">Consumo Médio</Text>
          <Text className="text-2xl font-bold text-foreground">
            {stats.consumoMedio.toFixed(2)} km/L
          </Text>
          <Text className="text-xs text-muted mt-1">
            Eficiência do veículo
          </Text>
        </View>
      </View>

      {/* Botão Adicionar */}
      <TouchableOpacity
        onPress={() => handleOpenModal()}
        className="bg-primary rounded-lg p-4 mb-6 active:opacity-80"
      >
        <Text className="text-white text-center font-semibold">+ Adicionar Abastecimento</Text>
      </TouchableOpacity>

      {/* Lista de Abastecimentos */}
      <View className="gap-2 mb-4">
        <Text className="text-foreground font-semibold text-lg">Histórico</Text>
        {combustivelDoMes.length === 0 ? (
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-muted text-center">Nenhum abastecimento neste mês</Text>
          </View>
        ) : (
          combustivelDoMes.map(fuel => (
            <TouchableOpacity
              key={fuel.id}
              onPress={() => handleOpenModal(fuel)}
              className="bg-surface rounded-lg p-3 border border-border active:opacity-70"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{fuel.posto}</Text>
                  <Text className="text-xs text-muted">{fuel.litros}L @ R$ {fuel.precoLitro.toFixed(2)}/L</Text>
                </View>
                <View className="items-end">
                  <Text className="text-warning font-bold">R$ {fuel.valorTotal.toFixed(2)}</Text>
                  <Text className="text-xs text-muted">{fuel.quilometragem}km</Text>
                </View>
              </View>
              {fuel.observacoes && (
                <Text className="text-xs text-muted mb-2">{fuel.observacoes}</Text>
              )}
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">
                  {new Date(fuel.data).toLocaleDateString('pt-BR')}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteFuel(fuel.id)}
                  className="active:opacity-60"
                >
                  <Text className="text-error text-xs font-semibold">Deletar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Modal de Edição */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 border-t border-border">
            <Text className="text-foreground text-lg font-bold mb-4">
              {editingFuel ? 'Editar Abastecimento' : 'Adicionar Abastecimento'}
            </Text>

            {/* Posto */}
            <View className="mb-4">
              <Text className="text-muted text-sm mb-1">Posto *</Text>
              <TextInput
                value={posto}
                onChangeText={setPosto}
                placeholder="Ex: Posto Shell"
                placeholderTextColor={colors.muted}
                className="bg-background border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            {/* Litros */}
            <View className="mb-4">
              <Text className="text-muted text-sm mb-1">Litros *</Text>
              <TextInput
                value={litros}
                onChangeText={setLitros}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                className="bg-background border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            {/* Preço por Litro */}
            <View className="mb-4">
              <Text className="text-muted text-sm mb-1">Preço por Litro (R$) *</Text>
              <TextInput
                value={precoLitro}
                onChangeText={setPrecoLitro}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                className="bg-background border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            {/* Quilometragem */}
            <View className="mb-4">
              <Text className="text-muted text-sm mb-1">Quilometragem *</Text>
              <TextInput
                value={quilometragem}
                onChangeText={setQuilometragem}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                className="bg-background border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            {/* Observações */}
            <View className="mb-6">
              <Text className="text-muted text-sm mb-1">Observações</Text>
              <TextInput
                value={observacoes}
                onChangeText={setObservacoes}
                placeholder="Adicione detalhes..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={2}
                className="bg-background border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            {/* Valor Total (calculado) */}
            {litros && precoLitro && (
              <View className="mb-6 p-3 bg-primary/10 rounded-lg border border-primary">
                <Text className="text-muted text-sm">Valor Total</Text>
                <Text className="text-2xl font-bold text-primary">
                  R$ {(parseFloat(litros) * parseFloat(precoLitro)).toFixed(2)}
                </Text>
              </View>
            )}

            {/* Botões */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="flex-1 p-3 rounded-lg bg-background border border-border"
              >
                <Text className="text-foreground text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveFuel}
                className="flex-1 p-3 rounded-lg bg-primary"
              >
                <Text className="text-white text-center font-semibold">Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
