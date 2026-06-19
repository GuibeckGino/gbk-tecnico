import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/components/screen-container';
import { useInstallations } from '@/context/InstallationsContext';
import { useColors } from '@/hooks/use-colors';
import { DatePickerModal } from '@/components/date-picker-modal';
import * as Haptics from 'expo-haptics';
import { Installation, ServiceType } from '@/types/installation';
import { useInstallations as useInstallationsContext } from '@/context/InstallationsContext';

export default function EditarInstalacaoScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { instalacoes, atualizarInstalacao, deletarInstalacao } = useInstallations();
  const colors = useColors();

  const installationId = (route.params as any)?.id;
  const installation = instalacoes.find((i) => i.id === installationId);

  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [tipoServico, setTipoServico] = useState<ServiceType>('Instalação');
  const [data, setData] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (installation) {
      setCliente(installation.cliente);
      setEndereco(installation.endereco);
      setTipoServico(installation.tipoServico);
      setData(installation.data);
      setObservacoes(installation.observacoes);
    }
  }, [installation]);

  const handleSalvar = async () => {
    if (!cliente.trim() || !endereco.trim() || !data.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (installation) {
      try {
        atualizarInstalacao({
          ...installation,
          cliente,
          endereco,
          tipoServico,
          data,
          observacoes,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Sucesso', 'Instalação atualizada com sucesso!');
        navigation.goBack();
      } catch (error) {
        console.error('Erro ao atualizar instalação:', error);
        Alert.alert('Erro', 'Não foi possível atualizar a instalação. Tente novamente.');
      }
    }
  };

  const handleDeletar = () => {
    Alert.alert(
      'Deletar Instalação',
      'Tem certeza que deseja deletar esta instalação? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: () => {
            if (installation) {
              try {
                deletarInstalacao(installation.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Sucesso', 'Instalação deletada com sucesso!');
                navigation.goBack();
              } catch (error) {
                console.error('Erro ao deletar instalação:', error);
                Alert.alert('Erro', 'Não foi possível deletar a instalação. Tente novamente.');
              }
            }
          },
        },
      ]
    );
  };

  if (!installation) {
    return (
      <ScreenContainer>
        <Text style={{ color: colors.foreground, textAlign: 'center', marginTop: 20 }}>
          Instalação não encontrada
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.titulo, { color: colors.foreground }]}>Editar Instalação</Text>
        </View>

        {/* Campo Cliente */}
        <View style={styles.campo}>
          <Text style={[styles.label, { color: colors.foreground }]}>Cliente</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Nome do cliente"
            placeholderTextColor={colors.muted}
            value={cliente}
            onChangeText={setCliente}
          />
        </View>

        {/* Campo Endereço */}
        <View style={styles.campo}>
          <Text style={[styles.label, { color: colors.foreground }]}>Endereço</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Endereço completo"
            placeholderTextColor={colors.muted}
            value={endereco}
            onChangeText={setEndereco}
          />
        </View>

        {/* Campo Tipo de Serviço */}
        <View style={styles.campo}>
          <Text style={[styles.label, { color: colors.foreground }]}>Tipo de Serviço</Text>
          <View style={styles.tiposContainer}>
            {(['Instalação', 'Tipo 3', 'Mudança', 'Empresarial'] as ServiceType[]).map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.tipoBotao,
                  {
                    backgroundColor: tipoServico === tipo ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setTipoServico(tipo);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={{
                    color: tipoServico === tipo ? '#fff' : colors.foreground,
                    fontWeight: '600',
                    fontSize: 12,
                  }}
                >
                  {tipo}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Campo Data */}
        <View style={styles.campo}>
          <Text style={[styles.label, { color: colors.foreground }]}>Data</Text>
          <TouchableOpacity
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>{data}</Text>
          </TouchableOpacity>
        </View>

        {/* Campo Observações */}
        <View style={styles.campo}>
          <Text style={[styles.label, { color: colors.foreground }]}>Observações</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, minHeight: 80, textAlignVertical: 'top', paddingTop: 8 },
            ]}
            placeholder="Adicione observações (opcional)"
            placeholderTextColor={colors.muted}
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Botões */}
        <View style={styles.botoes}>
          <TouchableOpacity
            style={[styles.botao, { backgroundColor: colors.primary }]}
            onPress={handleSalvar}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Salvar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botao, { backgroundColor: colors.error }]}
            onPress={handleDeletar}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Deletar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelected={(selectedDate: string) => {
          setData(selectedDate);
          setShowDatePicker(false);
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
  },
  campo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  tiposContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoBotao: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  botoes: {
    gap: 12,
    marginTop: 20,
  },
  botao: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
});
