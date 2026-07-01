import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import { useInstallations } from '@/context/InstallationsContext';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/use-colors';
import { calcularValorPorTipo } from '@/types/installation';
import { ReceiptStatus } from '@/types/finance';

interface ReceiptDisplay {
  id: string;
  instalacaoId: string;
  cliente: string;
  endereco: string;
  tipoServico: string;
  data: string;
  status: 'Recebido' | 'Pendente' | 'Cancelado';
  valorPrevisto: number;
  valorRecebido: number;
}

export function ReceitasTab() {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano } = useMonth();
  const { state: financeState, atualizarRecebimento } = useFinance();
  const colors = useColors();
  const [showModal, setShowModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptStatus | null>(null);
  const [newStatus, setNewStatus] = useState<'Recebido' | 'Pendente' | 'Cancelado'>('Recebido');

  // Filtrar instalações do mês
  const instalacoesDoMes = useMemo(() => {
    return instalacoes.filter(i => {
      const data = new Date(i.createdAt);
      return data.getMonth() + 1 === mes && data.getFullYear() === ano;
    });
  }, [instalacoes, mes, ano]);

  // Gerar receitas baseado em instalações
  const receitas = useMemo(() => {
    return instalacoesDoMes.map(inst => {
      const valor = calcularValorPorTipo(inst.tipoServico, instalacoesDoMes.length, paymentMode);
      const receiptId = `receipt_${inst.id}`;
      
      // Procurar receipt existente
      const existingReceipt = financeState.receipts.find(r => r.id === receiptId);
      
      const display: ReceiptDisplay = {
        id: receiptId,
        instalacaoId: inst.id,
        cliente: inst.cliente,
        endereco: inst.endereco,
        tipoServico: inst.tipoServico,
        data: inst.createdAt,
        status: (existingReceipt?.status || 'Recebido') as 'Recebido' | 'Pendente' | 'Cancelado',
        valorPrevisto: valor,
        valorRecebido: existingReceipt?.valorRecebido || valor,
      };
      
      return display;
    });
  }, [instalacoesDoMes, financeState.receipts, paymentMode]);

  // Estatísticas
  const stats = useMemo(() => {
    const recebido = receitas
      .filter(r => r.status === 'Recebido')
      .reduce((sum, r) => sum + r.valorRecebido, 0);
    
    const pendente = receitas
      .filter(r => r.status === 'Pendente')
      .reduce((sum, r) => sum + r.valorPrevisto, 0);
    
    const cancelado = receitas
      .filter(r => r.status === 'Cancelado')
      .length;

    return {
      total: receitas.length,
      recebido,
      pendente,
      cancelado,
      percentualRecebimento: receitas.length > 0 ? (recebido / (recebido + pendente)) * 100 : 0,
    };
  }, [receitas]);

  const handleStatusChange = (receipt: ReceiptDisplay) => {
    const receiptStatus: ReceiptStatus = {
      id: receipt.id,
      instalacaoId: receipt.instalacaoId,
      status: receipt.status,
      valorPrevisto: receipt.valorPrevisto,
      valorRecebido: receipt.valorRecebido,
      data: receipt.data,
      mes,
      ano,
    };
    setSelectedReceipt(receiptStatus);
    setNewStatus(receipt.status);
    setShowModal(true);
  };

  const handleSaveStatus = () => {
    if (!selectedReceipt) return;

    const updatedReceipt: ReceiptStatus = {
      ...selectedReceipt,
      status: newStatus,
      mes,
      ano,
    };

    atualizarRecebimento(updatedReceipt);
    setShowModal(false);
    Alert.alert('Sucesso', 'Status da receita atualizado');
  };

  return (
    <ScrollView className="flex-1 p-4">
      {/* Estatísticas */}
      <View className="gap-3 mb-6">
        {/* Total Previsto */}
        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-muted text-sm mb-1">Receita Prevista</Text>
          <Text className="text-2xl font-bold text-foreground">
            R$ {(stats.recebido + stats.pendente).toFixed(2)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {stats.total} instalações
          </Text>
        </View>

        {/* Recebido */}
        <View className="bg-success/10 rounded-lg p-4 border border-success">
          <Text className="text-muted text-sm mb-1">Receita Recebida</Text>
          <Text className="text-2xl font-bold text-success">
            R$ {stats.recebido.toFixed(2)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {stats.percentualRecebimento.toFixed(0)}% do total
          </Text>
        </View>

        {/* Pendente */}
        <View className="bg-warning/10 rounded-lg p-4 border border-warning">
          <Text className="text-muted text-sm mb-1">Receita Pendente</Text>
          <Text className="text-2xl font-bold text-warning">
            R$ {stats.pendente.toFixed(2)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {stats.cancelado} canceladas
          </Text>
        </View>
      </View>

      {/* Lista de Receitas */}
      <View className="gap-2 mb-4">
        <Text className="text-foreground font-semibold text-lg">Detalhes por Instalação</Text>
        {receitas.length === 0 ? (
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-muted text-center">Nenhuma instalação neste mês</Text>
          </View>
        ) : (
          receitas.map(receipt => (
            <TouchableOpacity
              key={receipt.id}
              onPress={() => handleStatusChange(receipt)}
              className={`rounded-lg p-3 border ${
                receipt.status === 'Recebido'
                  ? 'bg-success/10 border-success'
                  : receipt.status === 'Pendente'
                  ? 'bg-warning/10 border-warning'
                  : 'bg-error/10 border-error'
              }`}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{receipt.cliente}</Text>
                  <Text className="text-xs text-muted">{receipt.endereco}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-foreground font-bold">R$ {receipt.valorRecebido.toFixed(2)}</Text>
                  <Text className={`text-xs font-semibold ${
                    receipt.status === 'Recebido'
                      ? 'text-success'
                      : receipt.status === 'Pendente'
                      ? 'text-warning'
                      : 'text-error'
                  }`}>
                    {receipt.status}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between text-xs text-muted">
                <Text>{receipt.tipoServico}</Text>
                <Text>{new Date(receipt.data).toLocaleDateString('pt-BR')}</Text>
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
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-surface rounded-lg p-6 w-full max-w-sm border border-border">
            <Text className="text-foreground text-lg font-bold mb-4">
              Atualizar Status de Recebimento
            </Text>

            {selectedReceipt && (
              <View className="mb-4 p-3 bg-background rounded border border-border">
                <Text className="text-foreground font-semibold">
                  {receitas.find(r => r.id === selectedReceipt.id)?.cliente || 'Cliente'}
                </Text>
                <Text className="text-muted text-sm">
                  {receitas.find(r => r.id === selectedReceipt.id)?.endereco || 'Endereço'}
                </Text>
                <Text className="text-foreground font-bold mt-2">
                  R$ {selectedReceipt.valorRecebido.toFixed(2)}
                </Text>
              </View>
            )}

            {/* Botões de Status */}
            <View className="gap-2 mb-6">
              {(['Recebido', 'Pendente', 'Cancelado'] as const).map(status => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setNewStatus(status)}
                  className={`p-3 rounded-lg border ${
                    newStatus === status
                      ? 'bg-primary border-primary'
                      : 'bg-background border-border'
                  }`}
                >
                  <Text className={`text-center font-semibold ${
                    newStatus === status
                      ? 'text-white'
                      : 'text-foreground'
                  }`}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botões de Ação */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="flex-1 p-3 rounded-lg bg-background border border-border"
              >
                <Text className="text-foreground text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveStatus}
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
