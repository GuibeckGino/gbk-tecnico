import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useInstallations } from '@/context/InstallationsContext';
import { useColors } from '@/hooks/use-colors';
import type { Installation, ServiceType } from '@/types/installation';
import * as Haptics from 'expo-haptics';

const TIPOS: ServiceType[] = ['Instalação', 'Tipo 3', 'Mudança', 'Empresarial'];

function haptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

function hapticSuccess() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

function hapticError() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

export default function DetalhesOSScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { instalacoes, atualizarInstalacao, removerInstalacao } = useInstallations();
  const colors = useColors();

  const osId = params.id as string;
  const [os, setOs] = useState<Installation | null>(null);
  const [editando, setEditando] = useState(false);
  const [deletando, setDeletando] = useState(false);

  // Estados de edição
  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [tipoServico, setTipoServico] = useState<ServiceType>('Instalação');
  const [data, setData] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    const osEncontrada = instalacoes.find(i => i.id === osId);
    if (osEncontrada) {
      setOs(osEncontrada);
      setCliente(osEncontrada.cliente);
      setEndereco(osEncontrada.endereco);
      setTipoServico(osEncontrada.tipoServico);
      setData(osEncontrada.data);
      setObservacoes(osEncontrada.observacoes || '');
    }
  }, [osId, instalacoes]);

  const handleSalvar = async () => {
    if (!cliente.trim() || !endereco.trim() || !data.trim()) {
      hapticError();
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      haptic();
      const osAtualizada: Installation = {
        ...os!,
        cliente,
        endereco,
        tipoServico,
        data,
        observacoes,
      };
      await atualizarInstalacao(osAtualizada);
      hapticSuccess();
      setOs(osAtualizada);
      setEditando(false);
      Alert.alert('Sucesso', 'OS atualizada com sucesso');
    } catch (error) {
      hapticError();
      Alert.alert('Erro', 'Não foi possível atualizar a OS');
    }
  };

  const handleDeletar = () => {
    Alert.alert(
      'Deletar OS',
      `Tem certeza que deseja deletar a OS de ${os?.cliente}?`,
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Deletar',
          onPress: async () => {
            try {
              setDeletando(true);
              haptic();
              await removerInstalacao(osId);
              hapticSuccess();
              router.back();
            } catch (error) {
              hapticError();
              Alert.alert('Erro', 'Não foi possível deletar a OS');
            } finally {
              setDeletando(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (!os) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        {/* Cabeçalho */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 16,
            backgroundColor: colors.primary,
            marginBottom: 20,
          }}
        >
          <Pressable
            onPress={() => {
              haptic();
              router.back();
            }}
            style={{ marginBottom: 12 }}
          >
            <Text style={{ fontSize: 18, color: colors.background, fontWeight: '600' }}>
              ← Voltar
            </Text>
          </Pressable>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.background, marginBottom: 4 }}>
            Detalhes da OS
          </Text>
          <Text style={{ fontSize: 13, color: colors.background, opacity: 0.9 }}>
            {os.cliente}
          </Text>
        </View>

        {!editando ? (
          <>
            {/* Informações da OS */}
            <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
              {/* Card Principal */}
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 16,
                }}
              >
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                    Cliente
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                    {os.cliente}
                  </Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                    Tipo de Serviço
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.background }}>
                      {os.tipoServico}
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                    Data
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.foreground }}>
                    {os.data}
                  </Text>
                </View>



                <View>
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                    Endereço
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.foreground }}>
                    {os.endereco}
                  </Text>
                </View>
              </View>

              {/* Observações */}
              {os.observacoes && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
                    Observações
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
                    {os.observacoes}
                  </Text>
                </View>
              )}

              {/* Botões de Ação */}
              <View style={{ gap: 12 }}>
                <Pressable
                  onPress={() => {
                    haptic();
                    setEditando(true);
                  }}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.primary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.background,
                      textAlign: 'center',
                    }}
                  >
                    ✏️ Editar
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleDeletar}
                  disabled={deletando}
                  style={({ pressed }) => [
                    {
                      backgroundColor: '#EF4444',
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      opacity: pressed ? 0.8 : deletando ? 0.5 : 1,
                    },
                  ]}
                >
                  {deletando ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: colors.background,
                        textAlign: 'center',
                      }}
                    >
                      🗑️ Deletar
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Modo Edição */}
            <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
                      <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 6, fontWeight: '600' }}>
                  Cliente *
                </Text>
                <TextInput
                  value={cliente}
                  onChangeText={setCliente}
                  placeholder="Nome do cliente"
                  placeholderTextColor={colors.muted}
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: colors.foreground,
                  }}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 6, fontWeight: '600' }}>
                  Tipo de Serviço *
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 8 }}
                >
                  {TIPOS.map(tipo => (
                    <Pressable
                      key={tipo}
                      onPress={() => {
                        haptic();
                        setTipoServico(tipo);
                      }}
                      style={({ pressed }) => [
                        {
                          backgroundColor: tipoServico === tipo ? colors.primary : colors.surface,
                          borderWidth: 1,
                          borderColor: tipoServico === tipo ? colors.primary : colors.border,
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          marginRight: 8,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: tipoServico === tipo ? colors.background : colors.foreground,
                        }}
                      >
                        {tipo}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 6, fontWeight: '600' }}>
                  Data *
                </Text>
                <TextInput
                  value={data}
                  onChangeText={setData}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.muted}
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: colors.foreground,
                  }}
                />
              </View>



              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 6, fontWeight: '600' }}>
                  Endereço *
                </Text>
                <TextInput
                  value={endereco}
                  onChangeText={setEndereco}
                  placeholder="Endereço completo"
                  placeholderTextColor={colors.muted}
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: colors.foreground,
                  }}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 6, fontWeight: '600' }}>
                  Observações
                </Text>
                <TextInput
                  value={observacoes}
                  onChangeText={setObservacoes}
                  placeholder="Adicione observações (opcional)"
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={4}
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: colors.foreground,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              {/* Botões de Ação */}
              <View style={{ gap: 12 }}>
                <Pressable
                  onPress={handleSalvar}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.primary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.background,
                      textAlign: 'center',
                    }}
                  >
                    💾 Salvar
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    haptic();
                    setEditando(false);
                  }}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.foreground,
                      textAlign: 'center',
                    }}
                  >
                    ✕ Cancelar
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
