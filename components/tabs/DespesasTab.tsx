import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useMonth } from '@/context/MonthContext';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/use-colors';
import { Expense } from '@/types/finance';
import { gerarId } from '@/types/installation';

export function DespesasTab() {
  const { mes, ano } = useMonth();
  const { state: financeState, adicionarDespesa, atualizarDespesa, removerDespesa } = useFinance();
  const colors = useColors();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<Expense['categoria']>('Outros');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<Expense['formaPagamento']>('PIX');

  const categorias: Expense['categoria'][] = [
    'Combustível',
    'Alimentação',
    'Pedágio',
    'Ferramentas',
    'Peças',
    'Internet',
    'Telefone',
    'Manutenção',
    'Impostos',
    'Outros',
  ];

  const formasPagamento: Expense['formaPagamento'][] = [
    'Dinheiro',
    'Débito',
    'Crédito',
    'PIX',
    'Outro',
  ];

  // Filtrar despesas do mês
  const despesasDoMes = useMemo(() => {
    return financeState.expenses.filter(e => e.mes === mes && e.ano === ano);
  }, [financeState.expenses, mes, ano]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = despesasDoMes.reduce((sum, e) => sum + e.valor, 0);
    const porCategoria: { [key: string]: number } = {};

    despesasDoMes.forEach(e => {
      porCategoria[e.categoria] = (porCategoria[e.categoria] || 0) + e.valor;
    });

    return { total, porCategoria, quantidade: despesasDoMes.length };
  }, [despesasDoMes]);

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setTitulo(expense.titulo);
      setCategoria(expense.categoria);
      setValor(expense.valor.toString());
      setDescricao(expense.descricao);
      setFormaPagamento(expense.formaPagamento);
    } else {
      setEditingExpense(null);
      setTitulo('');
      setCategoria('Outros');
      setValor('');
      setDescricao('');
      setFormaPagamento('PIX');
    }
    setShowModal(true);
  };

  const handleSaveExpense = () => {
    if (!titulo || !valor) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      Alert.alert('Erro', 'Valor inválido');
      return;
    }

    if (editingExpense) {
      const updated: Expense = {
        ...editingExpense,
        titulo,
        categoria,
        valor: valorNum,
        descricao,
        formaPagamento,
      };
      atualizarDespesa(updated);
      Alert.alert('Sucesso', 'Despesa atualizada');
    } else {
      const newExpense: Expense = {
        id: gerarId(),
        titulo,
        categoria,
        valor: valorNum,
        descricao,
        formaPagamento,
        data: new Date().toISOString(),
        mes,
        ano,
      };
      adicionarDespesa(newExpense);
      Alert.alert('Sucesso', 'Despesa adicionada');
    }

    setShowModal(false);
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert('Confirmar', 'Deseja remover esta despesa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          removerDespesa(id);
          Alert.alert('Sucesso', 'Despesa removida');
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 p-4">
      {/* Estatísticas */}
      <View className="gap-3 mb-6">
        {/* Total */}
        <View className="bg-error/10 rounded-lg p-4 border border-error">
          <Text className="text-muted text-sm mb-1">Total de Despesas</Text>
          <Text className="text-2xl font-bold text-error">
            R$ {stats.total.toFixed(2)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {stats.quantidade} despesas
          </Text>
        </View>

        {/* Média por despesa */}
        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-muted text-sm mb-1">Média por Despesa</Text>
          <Text className="text-2xl font-bold text-foreground">
            R$ {(stats.quantidade > 0 ? stats.total / stats.quantidade : 0).toFixed(2)}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {stats.quantidade} registros
          </Text>
        </View>
      </View>

      {/* Botão Adicionar */}
      <TouchableOpacity
        onPress={() => handleOpenModal()}
        className="bg-primary rounded-lg p-4 mb-6 active:opacity-80"
      >
        <Text className="text-white text-center font-semibold">+ Adicionar Despesa</Text>
      </TouchableOpacity>

      {/* Despesas por Categoria */}
      {Object.keys(stats.porCategoria).length > 0 && (
        <View className="bg-surface rounded-lg p-4 border border-border mb-6">
          <Text className="text-foreground font-semibold mb-3">Por Categoria</Text>
          {Object.entries(stats.porCategoria).map(([cat, val]) => (
            <View key={cat} className="flex-row justify-between items-center py-2 border-b border-border/50">
              <Text className="text-muted">{cat}</Text>
              <Text className="text-foreground font-semibold">R$ {val.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Lista de Despesas */}
      <View className="gap-2 mb-4">
        <Text className="text-foreground font-semibold text-lg">Detalhes</Text>
        {despesasDoMes.length === 0 ? (
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-muted text-center">Nenhuma despesa neste mês</Text>
          </View>
        ) : (
          despesasDoMes.map(expense => (
            <TouchableOpacity
              key={expense.id}
              onPress={() => handleOpenModal(expense)}
              className="bg-surface rounded-lg p-3 border border-border active:opacity-70"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{expense.titulo}</Text>
                  <Text className="text-xs text-muted">{expense.categoria}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-error font-bold">R$ {expense.valor.toFixed(2)}</Text>
                  <Text className="text-xs text-muted">{expense.formaPagamento}</Text>
                </View>
              </View>
              {expense.descricao && (
                <Text className="text-xs text-muted mb-2">{expense.descricao}</Text>
              )}
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted">
                  {new Date(expense.data).toLocaleDateString('pt-BR')}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteExpense(expense.id)}
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
              {editingExpense ? 'Editar Despesa' : 'Adicionar Despesa'}
            </Text>

            {/* Título */}
            <View className="mb-4">
              <Text className="text-muted text-sm mb-1">Título *</Text>
              <TextInput
                value={titulo}
                onChangeText={setTitulo}
                placeholder="Ex: Combustível"
                placeholderTextColor={colors.muted}
                className="bg-background border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            {/* Valor */}
            <View className="mb-4">
              <Text className="text-muted text-sm mb-1">Valor (R$) *</Text>
              <TextInput
                value={valor}
                onChangeText={setValor}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                className="bg-background border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            {/* Categoria */}
            <View className="mb-4">
              <Text className="text-muted text-sm mb-2">Categoria</Text>
              <View className="flex-row flex-wrap gap-2">
                {categorias.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategoria(cat)}
                    className={`px-3 py-2 rounded-lg border ${
                      categoria === cat
                        ? 'bg-primary border-primary'
                        : 'bg-background border-border'
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${
                      categoria === cat ? 'text-white' : 'text-foreground'
                    }`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Forma de Pagamento */}
            <View className="mb-4">
              <Text className="text-muted text-sm mb-2">Forma de Pagamento</Text>
              <View className="flex-row flex-wrap gap-2">
                {formasPagamento.map(forma => (
                  <TouchableOpacity
                    key={forma}
                    onPress={() => setFormaPagamento(forma)}
                    className={`px-3 py-2 rounded-lg border ${
                      formaPagamento === forma
                        ? 'bg-primary border-primary'
                        : 'bg-background border-border'
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${
                      formaPagamento === forma ? 'text-white' : 'text-foreground'
                    }`}>
                      {forma}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Descrição */}
            <View className="mb-6">
              <Text className="text-muted text-sm mb-1">Descrição</Text>
              <TextInput
                value={descricao}
                onChangeText={setDescricao}
                placeholder="Adicione detalhes..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                className="bg-background border border-border rounded-lg p-3 text-foreground"
              />
            </View>

            {/* Botões */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="flex-1 p-3 rounded-lg bg-background border border-border"
              >
                <Text className="text-foreground text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveExpense}
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
