import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useColors } from "@/hooks/use-colors";
import type { Installation, ServiceType } from "@/types/installation";
import * as Haptics from "expo-haptics";

const TIPOS: ServiceType[] = ["Instalação", "Tipo 3", "Mudança"];

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

function hapticError() {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

function hapticSuccess() {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export default function HistoricoScreen() {
  const { instalacoes, stats, removerInstalacao, atualizarInstalacao } =
    useInstallations();
  const colors = useColors();

  const [editando, setEditando] = useState<Installation | null>(null);
  const [editCliente, setEditCliente] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editTipo, setEditTipo] = useState<ServiceType>("Instalação");
  const [editData, setEditData] = useState("");
  const [editObs, setEditObs] = useState("");
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  // Modal de confirmação de exclusão
  const [confirmandoExclusao, setConfirmandoExclusao] =
    useState<Installation | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  function abrirEdicao(inst: Installation) {
    haptic();
    setEditando(inst);
    setEditCliente(inst.cliente);
    setEditEndereco(inst.endereco);
    setEditTipo(inst.tipoServico);
    setEditData(inst.data);
    setEditObs(inst.observacoes);
  }

  function fecharEdicao() {
    setEditando(null);
  }

  async function salvarEdicao() {
    if (!editCliente.trim()) {
      Alert.alert("Campo obrigatório", "Informe o nome do cliente.");
      return;
    }
    if (!editEndereco.trim()) {
      Alert.alert("Campo obrigatório", "Informe o endereço.");
      return;
    }
    if (!editData.trim() || editData.length < 10) {
      Alert.alert("Campo obrigatório", "Informe a data no formato dd/mm/aaaa.");
      return;
    }
    if (!editando) return;

    setSalvandoEdit(true);
    try {
      await atualizarInstalacao({
        ...editando,
        cliente: editCliente.trim(),
        endereco: editEndereco.trim(),
        tipoServico: editTipo,
        data: editData,
        observacoes: editObs.trim(),
      });
      hapticSuccess();
      fecharEdicao();
    } finally {
      setSalvandoEdit(false);
    }
  }

  function abrirConfirmacaoExclusao(inst: Installation) {
    hapticError();
    setConfirmandoExclusao(inst);
  }

  function fecharConfirmacaoExclusao() {
    setConfirmandoExclusao(null);
  }

  async function executarExclusao() {
    if (!confirmandoExclusao) return;
    setExcluindo(true);
    try {
      await removerInstalacao(confirmandoExclusao.id);
      hapticSuccess();
      fecharConfirmacaoExclusao();
    } finally {
      setExcluindo(false);
    }
  }

  function formatarData(texto: string) {
    const numeros = texto.replace(/\D/g, "");
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
  }

  const listaOrdenada = [...instalacoes].reverse();

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Text style={[styles.titulo, { color: colors.foreground }]}>
          Histórico
        </Text>
        <View
          style={[styles.badgeTotal, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.badgeTotalTexto}>{instalacoes.length}</Text>
        </View>
      </View>

      {instalacoes.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={[styles.vazioTexto, { color: colors.muted }]}>
            Nenhuma instalação cadastrada.
          </Text>
          <Text style={[styles.vazioSub, { color: colors.muted }]}>
            Use "Novo Cadastro" para adicionar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={listaOrdenada}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CardInstalacao
              instalacao={item}
              valorIndividual={stats.valorIndividual}
              onEditar={() => abrirEdicao(item)}
              onExcluir={() => abrirConfirmacaoExclusao(item)}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: 10 }} />
          )}
        />
      )}

      {/* Modal de Edição */}
      <Modal
        visible={editando !== null}
        animationType="slide"
        transparent
        onRequestClose={fecharEdicao}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[styles.modalTitulo, { color: colors.foreground }]}
              >
                Editar Instalação
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.modalFechar,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={fecharEdicao}
              >
                <Text
                  style={[styles.modalFecharTexto, { color: colors.muted }]}
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Cliente */}
              <Text style={[styles.campoLabel, { color: colors.foreground }]}>
                Cliente *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={editCliente}
                onChangeText={setEditCliente}
                placeholder="Nome do cliente"
                placeholderTextColor={colors.muted}
              />

              {/* Endereço */}
              <Text
                style={[
                  styles.campoLabel,
                  { color: colors.foreground, marginTop: 12 },
                ]}
              >
                Endereço *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={editEndereco}
                onChangeText={setEditEndereco}
                placeholder="Endereço"
                placeholderTextColor={colors.muted}
              />

              {/* Tipo */}
              <Text
                style={[
                  styles.campoLabel,
                  { color: colors.foreground, marginTop: 12 },
                ]}
              >
                Tipo de Serviço *
              </Text>
              <View style={styles.tiposRow}>
                {TIPOS.map((tipo) => (
                  <Pressable
                    key={tipo}
                    style={({ pressed }) => [
                      styles.tipoBotao,
                      {
                        backgroundColor:
                          editTipo === tipo ? colors.primary : colors.surface,
                        borderColor:
                          editTipo === tipo ? colors.primary : colors.border,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => {
                      haptic();
                      setEditTipo(tipo);
                    }}
                  >
                    <Text
                      style={[
                        styles.tipoBotaoTexto,
                        {
                          color: editTipo === tipo ? "#fff" : colors.foreground,
                        },
                      ]}
                    >
                      {tipo}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Data */}
              <Text
                style={[
                  styles.campoLabel,
                  { color: colors.foreground, marginTop: 12 },
                ]}
              >
                Data *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={editData}
                onChangeText={(t) => setEditData(formatarData(t))}
                placeholder="dd/mm/aaaa"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                maxLength={10}
              />

              {/* Observações */}
              <Text
                style={[
                  styles.campoLabel,
                  { color: colors.foreground, marginTop: 12 },
                ]}
              >
                Observações
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputMultilinha,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={editObs}
                onChangeText={setEditObs}
                placeholder="Observações (opcional)"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Botão Salvar */}
              <Pressable
                style={({ pressed }) => [
                  styles.botaoSalvar,
                  {
                    backgroundColor: salvandoEdit
                      ? colors.muted
                      : colors.primary,
                  },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                ]}
                onPress={salvarEdicao}
                disabled={salvandoEdit}
              >
                <Text style={styles.botaoSalvarTexto}>
                  {salvandoEdit ? "Salvando..." : "Salvar Alterações"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        visible={confirmandoExclusao !== null}
        animationType="fade"
        transparent
        onRequestClose={fecharConfirmacaoExclusao}
      >
        <View style={styles.confirmOverlay}>
          <View
            style={[
              styles.confirmContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.confirmTitulo, { color: colors.foreground }]}
            >
              Excluir Instalação
            </Text>
            <Text
              style={[styles.confirmMensagem, { color: colors.muted }]}
            >
              Tem certeza que deseja excluir a instalação de "{confirmandoExclusao?.cliente}"?
            </Text>
            <Text
              style={[styles.confirmAviso, { color: colors.error }]}
            >
              Esta ação não pode ser desfeita.
            </Text>

            <View style={styles.confirmBotoes}>
              <Pressable
                style={({ pressed }) => [
                  styles.botaoCancelar,
                  {
                    backgroundColor: colors.muted,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={fecharConfirmacaoExclusao}
                disabled={excluindo}
              >
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.botaoExcluir,
                  {
                    backgroundColor: excluindo ? colors.muted : colors.error,
                    opacity: pressed ? 0.85 : 1,
                    transform: pressed ? [{ scale: 0.97 }] : [],
                  },
                ]}
                onPress={executarExclusao}
                disabled={excluindo}
              >
                {excluindo ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.botaoExcluirTexto}>Excluir</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function CardInstalacao({
  instalacao,
  valorIndividual,
  onEditar,
  onExcluir,
}: {
  instalacao: Installation;
  valorIndividual: number;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const colors = useColors();

  const corTipo: Record<ServiceType, string> = {
    Instalação: "#1565C0",
    "Tipo 3": "#0D47A1",
    Mudança: "#1976D2",
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.foreground,
        },
      ]}
    >
      <View style={styles.cardInfo}>
        <Text
          style={[styles.cardCliente, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {instalacao.cliente}
        </Text>
        <Text
          style={[styles.cardEndereco, { color: colors.muted }]}
          numberOfLines={1}
        >
          {instalacao.endereco}
        </Text>
        <View style={styles.cardMeta}>
          <View
            style={[
              styles.badgeTipo,
              { backgroundColor: corTipo[instalacao.tipoServico] },
            ]}
          >
            <Text style={styles.badgeTipoTexto}>{instalacao.tipoServico}</Text>
          </View>
          <Text style={[styles.cardData, { color: colors.muted }]}>
            {instalacao.data}
          </Text>
          <Text style={[styles.cardValor, { color: colors.success }]}>
            R$ {valorIndividual}
          </Text>
        </View>
      </View>

      <View style={styles.cardAcoes}>
        <Pressable
          style={({ pressed }) => [
            styles.acaoBotao,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.7 },
          ]}
          onPress={onEditar}
        >
          <Text style={styles.acaoBotaoTexto}>✏️</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.acaoBotao,
            { backgroundColor: colors.error },
            pressed && { opacity: 0.7 },
          ]}
          onPress={onExcluir}
        >
          <Text style={styles.acaoBotaoTexto}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
  },
  badgeTotal: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeTotalTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  lista: {
    padding: 16,
    paddingBottom: 32,
  },
  vazio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  vazioTexto: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  vazioSub: {
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
    marginRight: 10,
  },
  cardCliente: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  cardEndereco: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  badgeTipo: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTipoTexto: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  cardData: {
    fontSize: 12,
  },
  cardValor: {
    fontSize: 13,
    fontWeight: "700",
  },
  cardAcoes: {
    gap: 8,
  },
  acaoBotao: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  acaoBotaoTexto: {
    fontSize: 16,
  },
  // Modal de Edição
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  modalFechar: {
    padding: 4,
  },
  modalFecharTexto: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  campoLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  inputMultilinha: {
    minHeight: 80,
    paddingTop: 12,
  },
  tiposRow: {
    flexDirection: "row",
    gap: 8,
  },
  tipoBotao: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  tipoBotaoTexto: {
    fontSize: 12,
    fontWeight: "600",
  },
  botaoSalvar: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  botaoSalvarTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  // Modal de Confirmação
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  confirmContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmTitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmMensagem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  confirmAviso: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  confirmBotoes: {
    flexDirection: "row",
    gap: 12,
  },
  botaoCancelar: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoCancelarTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  botaoExcluir: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  botaoExcluirTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
