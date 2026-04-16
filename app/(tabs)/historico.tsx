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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useMonth, filtrarPorMes } from "@/context/MonthContext";
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
  const { instalacoes, stats, removerInstalacao, atualizarInstalacao, setInstallations, toggleFavorito } =
    useInstallations();
  const { mes, ano, mesAnoFormatado } = useMonth();
  const colors = useColors();

  // Estados
  const [editando, setEditando] = useState<Installation | null>(null);
  const [editCliente, setEditCliente] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editTipo, setEditTipo] = useState<ServiceType>("Instalação");
  const [editData, setEditData] = useState("");
  const [editObs, setEditObs] = useState("");
  const [salvandoEdit, setSalvandoEdit] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] =
    useState<Installation | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<ServiceType | "Todos">("Todos");
  const [buscaAvancadaAberta, setBuscaAvancadaAberta] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [filtroTipoBuscaAvancada, setFiltroTipoBuscaAvancada] = useState<ServiceType | "Todos">("Todos");
  const [ordenacao, setOrdenacao] = useState<"recente" | "antigo" | "valor">("recente");

  // Filtrar instalações do mês selecionado
  let instalacoesDoMes = filtrarPorMes(instalacoes, mes, ano);

  // Aplicar filtro de tipo
  if (filtroTipo !== "Todos") {
    instalacoesDoMes = instalacoesDoMes.filter(
      (inst) => inst.tipoServico === filtroTipo
    );
  }

  // Aplicar busca por cliente
  if (buscaCliente.trim()) {
    instalacoesDoMes = instalacoesDoMes.filter((inst) =>
      inst.cliente.toLowerCase().includes(buscaCliente.toLowerCase())
    );
  }

  // Aplicar busca avançada se ativa
  if (buscaAvancadaAberta) {
    if (dataInicio) {
      const [dI, mI, aI] = dataInicio.split("/");
      const timestampInicio = new Date(parseInt(aI), parseInt(mI) - 1, parseInt(dI)).getTime();
      instalacoesDoMes = instalacoesDoMes.filter((inst) => {
        const [d, m, a] = inst.data.split("/");
        const timestamp = new Date(parseInt(a), parseInt(m) - 1, parseInt(d)).getTime();
        return timestamp >= timestampInicio;
      });
    }
    if (dataFim) {
      const [dF, mF, aF] = dataFim.split("/");
      const timestampFim = new Date(parseInt(aF), parseInt(mF) - 1, parseInt(dF)).getTime();
      instalacoesDoMes = instalacoesDoMes.filter((inst) => {
        const [d, m, a] = inst.data.split("/");
        const timestamp = new Date(parseInt(a), parseInt(m) - 1, parseInt(d)).getTime();
        return timestamp <= timestampFim;
      });
    }
    if (filtroTipoBuscaAvancada !== "Todos") {
      instalacoesDoMes = instalacoesDoMes.filter((inst) => inst.tipoServico === filtroTipoBuscaAvancada);
    }
    if (valorMin) {
      const min = parseFloat(valorMin);
      instalacoesDoMes = instalacoesDoMes.filter((inst) => inst.valor >= min);
    }
    if (valorMax) {
      const max = parseFloat(valorMax);
      instalacoesDoMes = instalacoesDoMes.filter((inst) => inst.valor <= max);
    }
  }

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

  function duplicarInstalacao(instalacao: Installation) {
    // Criar nova instalação com dados da atual mas com data de hoje
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const ano = hoje.getFullYear();
    const dataHoje = `${dia}/${mes}/${ano}`;

    const novaInstalacao: Installation = {
      ...instalacao,
      id: Math.random().toString(36).substring(2, 11),
      data: dataHoje,
    };

    // Adicionar à lista de instalações
    const novaLista = [...instalacoes, novaInstalacao];
    AsyncStorage.setItem("@gbk_instalacoes", JSON.stringify(novaLista)).catch(() => {});
    setInstallations(novaLista);
    hapticSuccess();
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

  let listaOrdenada = [...instalacoesDoMes];
  if (ordenacao === "recente") {
    listaOrdenada.reverse();
  } else if (ordenacao === "antigo") {
    // manter ordem original (mais antigo primeiro)
  } else if (ordenacao === "valor") {
    listaOrdenada.sort((a, b) => stats.valorIndividual * (b.tipoServico === "Instalação" ? 1 : 1) - stats.valorIndividual * (a.tipoServico === "Instalação" ? 1 : 1));
  }

  return (
    <ScreenContainer>
      {/* Header com Mês */}
      <View
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.titulo, { color: colors.foreground }]}>
            Histórico
          </Text>
          <Text style={[styles.mesSubtexto, { color: colors.muted }]}>
            {mesAnoFormatado}
          </Text>
        </View>
        <View
          style={[styles.badgeTotal, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.badgeTotalTexto}>{instalacoesDoMes.length}</Text>
        </View>
      </View>

      {/* Filtro e Busca */}
      <View style={[styles.filtroContainer, { backgroundColor: colors.surface }]}>
        {/* Botões de Ordenação */}
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
          {(["recente", "antigo", "valor"] as const).map((tipo) => (
            <Pressable
              key={tipo}
              style={[
                styles.filtroBotao,
                ordenacao === tipo
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.border },
              ]}
              onPress={() => setOrdenacao(tipo)}
            >
              <Text
                style={[
                  styles.filtroBotaoTexto,
                  { color: ordenacao === tipo ? "#fff" : colors.foreground },
                ]}
              >
                {tipo === "recente" ? "Recente" : tipo === "antigo" ? "Antigo" : "Valor"}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, flex: 1 },
            ]}
            placeholder="Buscar cliente..."
            placeholderTextColor={colors.muted}
            value={buscaCliente}
            onChangeText={setBuscaCliente}
          />
          <Pressable
            style={[
              styles.filtroBotao,
              { backgroundColor: buscaAvancadaAberta ? colors.primary : colors.border },
            ]}
            onPress={() => setBuscaAvancadaAberta(!buscaAvancadaAberta)}
          >
            <Text style={[
              styles.filtroBotaoTexto,
              { color: buscaAvancadaAberta ? "#fff" : colors.foreground },
            ]}>🔍</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtroScroll}
        >
          {(["Todos", "Instalação", "Tipo 3", "Mudança"] as const).map((tipo) => (
            <Pressable
              key={tipo}
              style={[
                styles.filtroBotao,
                filtroTipo === tipo
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.border },
              ]}
              onPress={() => setFiltroTipo(tipo)}
            >
              <Text
                style={[
                  styles.filtroBotaoTexto,
                  { color: filtroTipo === tipo ? "#fff" : colors.foreground },
                ]}
              >
                {tipo}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {instalacoesDoMes.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={[styles.vazioTexto, { color: colors.muted }]}>
            {instalacoes.length === 0
              ? "Nenhuma instalação cadastrada."
              : `Nenhuma instalação em ${mesAnoFormatado}`}
          </Text>
          <Text style={[styles.vazioSub, { color: colors.muted }]}>
            {instalacoes.length === 0
              ? "Use \"Novo Cadastro\" para adicionar."
              : "Selecione outro mês."}
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
              onDuplicar={() => duplicarInstalacao(item)}
              onToggleFavorito={() => toggleFavorito(item.id)}
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

      {/* Modal de Busca Avançada */}
      <Modal
        visible={buscaAvancadaAberta}
        transparent
        animationType="slide"
        onRequestClose={() => setBuscaAvancadaAberta(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.background }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: colors.foreground }]}>
                Busca Avançada
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.modalFechar,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={() => setBuscaAvancadaAberta(false)}
              >
                <Text style={[styles.modalFecharTexto, { color: colors.muted }]}>
                  ✗
                </Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Data Início */}
              <Text style={[styles.campoLabel, { color: colors.foreground }]}>
                Data Início (dd/mm/aaaa)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={dataInicio}
                onChangeText={setDataInicio}
                placeholder="01/01/2026"
                placeholderTextColor={colors.muted}
              />

              {/* Data Fim */}
              <Text
                style={[
                  styles.campoLabel,
                  { color: colors.foreground, marginTop: 12 },
                ]}
              >
                Data Fim (dd/mm/aaaa)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={dataFim}
                onChangeText={setDataFim}
                placeholder="31/12/2026"
                placeholderTextColor={colors.muted}
              />

              {/* Tipo de Serviço */}
              <Text
                style={[
                  styles.campoLabel,
                  { color: colors.foreground, marginTop: 12 },
                ]}
              >
                Tipo de Serviço
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
              >
                {(["Todos", "Instalação", "Tipo 3", "Mudança"] as const).map((tipo) => (
                  <Pressable
                    key={tipo}
                    style={[
                      styles.filtroBotao,
                      filtroTipoBuscaAvancada === tipo
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.border },
                    ]}
                    onPress={() => setFiltroTipoBuscaAvancada(tipo)}
                  >
                    <Text
                      style={[
                        styles.filtroBotaoTexto,
                        {
                          color:
                            filtroTipoBuscaAvancada === tipo
                              ? "#fff"
                              : colors.foreground,
                        },
                      ]}
                    >
                      {tipo}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Valor Mínimo */}
              <Text
                style={[
                  styles.campoLabel,
                  { color: colors.foreground, marginTop: 12 },
                ]}
              >
                Valor Mínimo (R$)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={valorMin}
                onChangeText={setValorMin}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />

              {/* Valor Máximo */}
              <Text
                style={[
                  styles.campoLabel,
                  { color: colors.foreground, marginTop: 12 },
                ]}
              >
                Valor Máximo (R$)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={valorMax}
                onChangeText={setValorMax}
                placeholder="10000"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />

              {/* Botões */}
              <View style={styles.confirmBotoes}>
                <Pressable
                  style={({ pressed }) => [
                    styles.botaoCancelar,
                    {
                      backgroundColor: colors.muted,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                  onPress={() => {
                    setDataInicio("");
                    setDataFim("");
                    setValorMin("");
                    setValorMax("");
                    setFiltroTipoBuscaAvancada("Todos");
                  }}
                >
                  <Text style={styles.botaoCancelarTexto}>Limpar</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.botaoSalvar,
                    {
                      backgroundColor: colors.primary,
                      opacity: pressed ? 0.85 : 1,
                      transform: pressed ? [{ scale: 0.97 }] : [],
                    },
                  ]}
                  onPress={() => setBuscaAvancadaAberta(false)}
                >
                  <Text style={styles.botaoSalvarTexto}>Aplicar</Text>
                </Pressable>
              </View>
            </ScrollView>
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
  onDuplicar,
  onToggleFavorito,
}: {
  instalacao: Installation;
  valorIndividual: number;
  onEditar: () => void;
  onExcluir: () => void;
  onDuplicar: () => void;
  onToggleFavorito: () => void;
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text
            style={[styles.cardCliente, { color: colors.foreground, flex: 1 }]}
            numberOfLines={1}
          >
            {instalacao.cliente}
          </Text>
          <Pressable onPress={onToggleFavorito}>
            <Text style={{ fontSize: 18 }}>{instalacao.isFavorito ? "⭐" : "☆"}</Text>
          </Pressable>
        </View>
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
            { backgroundColor: colors.warning },
            pressed && { opacity: 0.7 },
          ]}
          onPress={onDuplicar}
        >
          <Text style={styles.acaoBotaoTexto}>📋</Text>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerContent: {
    flex: 1,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
  },
  mesSubtexto: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeTotal: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 40,
    alignItems: "center",
  },
  badgeTotalTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  lista: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  vazio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    minHeight: 300,
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
    marginBottom: 10,
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
  ItemSeparatorComponent: {
    height: 10,
  },
  // Filtro e Busca
  filtroContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    height: 40,
  },
  filtroScroll: {
    flexDirection: "row",
  },
  filtroBotao: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  filtroBotaoTexto: {
    fontSize: 12,
    fontWeight: "600",
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
  modalContent: {
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
