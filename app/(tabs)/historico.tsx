import React, { useEffect, useState } from "react";
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
import { calcularValorPorTipo } from "@/types/installation";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { applyQuickEdit } from "@/lib/quick-edit";
import { obterPaymentModeDoMes } from "@/lib/monthly-payment-mode";
import type { PaymentModesByMonth } from "@/lib/analytics";
import * as Haptics from "expo-haptics";
import { PREMIUM, PremiumHeader } from "@/components/premium-ui";

const TIPOS: ServiceType[] = ["Instalação", "Tipo 3", "Mudança", "Empresarial"];

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
  const { instalacoes, paymentMode, removerInstalacao, atualizarInstalacao, setInstallations, toggleFavorito } =
    useInstallations();
  const { mes, ano, mesAnoFormatado } = useMonth();
  const colors = useColors();

  // Estados
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
  const [editando, setEditando] = useState<Installation | null>(null);
  const [editCliente, setEditCliente] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editTipo, setEditTipo] = useState<ServiceType>("Instalação");
  const [editData, setEditData] = useState("");
    const [editObservacoes, setEditObservacoes] = useState("");
  const [paymentModesByMonth, setPaymentModesByMonth] = useState<PaymentModesByMonth>({});

  useEffect(() => {
    let cancelado = false;
    const meses = Array.from(new Set(instalacoes.map((inst) => {
      const [, mesDoDado, anoDoDado] = inst.data.split('/');
      return `${anoDoDado}-${mesDoDado}`;
    })));

    Promise.all(meses.map(async (chave) => {
      const [anoDoDado, mesDoDado] = chave.split('-').map(Number);
      return [chave, await obterPaymentModeDoMes(mesDoDado - 1, anoDoDado)] as const;
    })).then((entradas) => {
      if (!cancelado) setPaymentModesByMonth(Object.fromEntries(entradas));
    });

    return () => {
      cancelado = true;
    };
  }, [instalacoes]);

  const totaisPorMes = instalacoes.reduce<Record<string, number>>((totais, inst) => {
    const [, mesDoDado, anoDoDado] = inst.data.split('/');
    const chave = `${anoDoDado}-${mesDoDado}`;
    totais[chave] = (totais[chave] || 0) + 1;
    return totais;
  }, {});

  function calcularValorDaOS(inst: Installation): number {
    const [, mesDoDado, anoDoDado] = inst.data.split('/');
    const chave = `${anoDoDado}-${mesDoDado}`;
    const modoDoMes = paymentModesByMonth[chave] || (chave === `${ano}-${String(mes + 1).padStart(2, '0')}` ? paymentMode : 'meta');
    return calcularValorPorTipo(inst.tipoServico, totaisPorMes[chave] || 1, modoDoMes);
  }

  // Filtrar instalações do mês selecionado
  let instalacoesDoMes = filtrarPorMes(instalacoes, mes, ano);

  // Aplicar filtro de tipo
  if (filtroTipo !== "Todos") {
    instalacoesDoMes = instalacoesDoMes.filter(
      (inst) => inst.tipoServico === filtroTipo
    );
  }

  // Aplicar busca por cliente, OS ou endereço
  if (buscaCliente.trim()) {
    const termo = buscaCliente.toLowerCase().trim();
    instalacoesDoMes = instalacoesDoMes.filter((inst) =>
      inst.cliente.toLowerCase().includes(termo) ||
      inst.id.toLowerCase().includes(termo) ||
      inst.endereco.toLowerCase().includes(termo)
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

  async function duplicarInstalacao(instalacao: Installation) {
    try {
      // Criar nova instalação com dados da atual mas com data de hoje
      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, "0");
      const mesHoje = String(hoje.getMonth() + 1).padStart(2, "0");
      const anoHoje = hoje.getFullYear();
      const dataHoje = `${dia}/${mesHoje}/${anoHoje}`;

      const novaInstalacao: Installation = {
        ...instalacao,
        id: Math.random().toString(36).substring(2, 11),
        data: dataHoje,
      };

      // Adicionar à lista de instalações
      const novaLista = [...instalacoes, novaInstalacao];
      await AsyncStorage.setItem("@gbk_instalacoes", JSON.stringify(novaLista));
      setInstallations(novaLista);
      hapticSuccess();
      Alert.alert("Sucesso", "Instalação duplicada com sucesso!");
    } catch (error) {
      console.error('Erro ao duplicar instalação:', error);
      hapticError();
      Alert.alert("Erro", "Não foi possível duplicar a instalação. Tente novamente.");
    }
  }

  function abrirEdicao(inst: Installation) {
    haptic();
    setEditando(inst);
    setEditCliente(inst.cliente);
    setEditEndereco(inst.endereco);
    setEditTipo(inst.tipoServico);
    setEditData(inst.data);
    setEditObservacoes(inst.observacoes || "");
  }

  function fecharEdicao() {
    setEditando(null);
  }

  async function salvarEdicao() {
    if (!editando) return;
    if (!editCliente.trim() || !editEndereco.trim() || !editData.trim()) {
      hapticError();
      Alert.alert("Campos obrigatórios", "Preencha OS/cliente, endereço e data.");
      return;
    }

    await atualizarInstalacao(applyQuickEdit(editando, {
      cliente: editCliente,
      endereco: editEndereco,
      tipoServico: editTipo,
      data: editData,
      observacoes: editObservacoes,
    }));
    hapticSuccess();
    fecharEdicao();
    Alert.alert("Salvo", "A OS foi atualizada.");
  }

  function abrirConfirmacaoExclusao(inst: Installation) {
    haptic();
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
    // Ordenar por valor decrescente (maior para menor)
    listaOrdenada.sort((a, b) => b.valor - a.valor);
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <PremiumHeader
          title="Histórico"
          subtitle={mesAnoFormatado}
          icon="list.bullet"
          style={{ flex: 1, paddingBottom: 0 }}
        />
        <View style={styles.counterGroup}>
          <View style={[styles.badgeTotal, { backgroundColor: PREMIUM.blueDeep, borderColor: PREMIUM.blue }]}>
            <IconSymbol name="doc.text.fill" size={23} color="#FFFFFF" />
            <View>
              <Text style={styles.badgeTotalTexto}>{instalacoesDoMes.length}</Text>
              <Text style={styles.badgeTotalLegenda}>neste mês</Text>
            </View>
          </View>
          <View style={styles.totalHistoricoBadge}>
            <Text style={styles.totalHistoricoNumero}>{instalacoes.length}</Text>
            <Text style={styles.totalHistoricoLegenda}>total</Text>
          </View>
        </View>
      </View>

      <View style={[styles.filtroContainer, { backgroundColor: PREMIUM.surface, borderColor: PREMIUM.divider, borderWidth: 1 }]}>
        <View style={styles.ordenacaoRow}>
          {(["recente", "antigo", "valor"] as const).map((tipo) => (
            <Pressable
              key={tipo}
              style={[styles.ordenacaoBotao, ordenacao === tipo && styles.ordenacaoBotaoAtivo]}
              onPress={() => setOrdenacao(tipo)}
            >
              <Text style={[styles.ordenacaoTexto, { color: ordenacao === tipo ? PREMIUM.blue : colors.muted }]}>
                {tipo === "recente" ? "Recente" : tipo === "antigo" ? "Antigo" : "Valor"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.buscaRow}>
          <View style={styles.searchWrap}>
            <IconSymbol name="magnifyingglass" size={25} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: PREMIUM.foreground }]}
              placeholder="Buscar cliente, OS ou endereço..."
              placeholderTextColor={colors.muted}
              value={buscaCliente}
              onChangeText={setBuscaCliente}
            />
          </View>
          <Pressable
            style={[styles.filterActionButton, { backgroundColor: buscaAvancadaAberta ? PREMIUM.blue : PREMIUM.blueDeep, borderColor: PREMIUM.blue }]}
            onPress={() => setBuscaAvancadaAberta(!buscaAvancadaAberta)}
          >
            <IconSymbol name="line.3.horizontal.decrease.circle" size={26} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtroScroll} contentContainerStyle={{ paddingRight: 8 }}>
          {(["Todos", ...TIPOS] as const).map((tipo) => (
            <Pressable
              key={tipo}
              style={[styles.filtroBotao, filtroTipo === tipo ? { backgroundColor: PREMIUM.blue, borderColor: PREMIUM.blue } : { backgroundColor: PREMIUM.background, borderColor: PREMIUM.divider }]}
              onPress={() => setFiltroTipo(tipo)}
            >
              <Text style={[styles.filtroBotaoTexto, { color: filtroTipo === tipo ? "#fff" : colors.foreground }]}>
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
              valor={calcularValorDaOS(item)}
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

      {/* Modal de Edição Rápida */}
      <Modal
        visible={editando !== null}
        transparent
        animationType="slide"
        onRequestClose={fecharEdicao}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: PREMIUM.surface, borderColor: PREMIUM.goldBorder, borderWidth: 1 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: PREMIUM.foreground }]}>Editar OS</Text>
              <Pressable onPress={fecharEdicao} style={styles.modalFechar}>
                <Text style={[styles.modalFecharTexto, { color: PREMIUM.muted }]}>✕</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <Text style={[styles.campoLabel, { color: PREMIUM.foreground }]}>OS / Cliente</Text>
              <TextInput
                style={[styles.input, { backgroundColor: PREMIUM.background, borderColor: PREMIUM.divider, color: PREMIUM.foreground }]}
                value={editCliente}
                onChangeText={setEditCliente}
                placeholder="Número da OS ou cliente"
                placeholderTextColor={PREMIUM.muted}
              />

              <Text style={[styles.campoLabel, { color: PREMIUM.foreground, marginTop: 12 }]}>Endereço / Bairro</Text>
              <TextInput
                style={[styles.input, { backgroundColor: PREMIUM.background, borderColor: PREMIUM.divider, color: PREMIUM.foreground }]}
                value={editEndereco}
                onChangeText={setEditEndereco}
                placeholder="Endereço ou bairro"
                placeholderTextColor={PREMIUM.muted}
              />

              <Text style={[styles.campoLabel, { color: PREMIUM.foreground, marginTop: 12 }]}>Tipo de Serviço</Text>
              <View style={styles.tiposRow}>
                {TIPOS.map((tipo) => (
                  <Pressable
                    key={tipo}
                    onPress={() => setEditTipo(tipo)}
                    style={[styles.tipoBotao, { borderColor: editTipo === tipo ? PREMIUM.blue : PREMIUM.divider, backgroundColor: editTipo === tipo ? PREMIUM.blueDeep : PREMIUM.background }]}
                  >
                    <Text style={[styles.tipoBotaoTexto, { color: editTipo === tipo ? '#FFFFFF' : PREMIUM.muted }]}>{tipo}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.campoLabel, { color: PREMIUM.foreground, marginTop: 12 }]}>Data</Text>
              <TextInput
                style={[styles.input, { backgroundColor: PREMIUM.background, borderColor: PREMIUM.divider, color: PREMIUM.foreground }]}
                value={editData}
                onChangeText={(texto) => setEditData(formatarData(texto))}
                placeholder="dd/mm/aaaa"
                placeholderTextColor={PREMIUM.muted}
                keyboardType="numeric"
              />

              <Text style={[styles.campoLabel, { color: PREMIUM.foreground, marginTop: 12 }]}>Observações</Text>
              <TextInput
                style={[styles.input, styles.inputMultilinha, { backgroundColor: PREMIUM.background, borderColor: PREMIUM.divider, color: PREMIUM.foreground }]}
                value={editObservacoes}
                onChangeText={setEditObservacoes}
                placeholder="Observações da OS"
                placeholderTextColor={PREMIUM.muted}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.confirmBotoes}>
                <Pressable style={[styles.botaoCancelar, { backgroundColor: PREMIUM.surfaceRaised }]} onPress={fecharEdicao}>
                  <Text style={[styles.botaoCancelarTexto, { color: PREMIUM.muted }]}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.botaoSalvar, { backgroundColor: PREMIUM.blue, flex: 1 }]} onPress={salvarEdicao}>
                  <Text style={styles.botaoSalvarTexto}>Salvar</Text>
                </Pressable>
              </View>
            </ScrollView>
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
          <View style={[styles.modalContent, { backgroundColor: PREMIUM.surface, borderColor: PREMIUM.goldBorder, borderWidth: 1 }]}>
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
                    backgroundColor: PREMIUM.background,
                    borderColor: PREMIUM.goldBorder,
                    color: PREMIUM.foreground,
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
                    backgroundColor: PREMIUM.background,
                    borderColor: PREMIUM.goldBorder,
                    color: PREMIUM.foreground,
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
                {(["Todos", ...TIPOS] as const).map((tipo) => (
                  <Pressable
                    key={tipo}
                    style={[
                      styles.filtroBotao,
                      filtroTipoBuscaAvancada === tipo
                        ? { backgroundColor: PREMIUM.blue }
                        : { backgroundColor: PREMIUM.surfaceRaised },
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
                    backgroundColor: PREMIUM.background,
                    borderColor: PREMIUM.goldBorder,
                    color: PREMIUM.foreground,
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
                    backgroundColor: PREMIUM.background,
                    borderColor: PREMIUM.goldBorder,
                    color: PREMIUM.foreground,
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
                      backgroundColor: PREMIUM.blue,
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
  valor,
  onEditar,
  onExcluir,
  onDuplicar,
  onToggleFavorito,
}: {
  instalacao: Installation;
  valor: number;
  onEditar: () => void;
  onExcluir: () => void;
  onDuplicar: () => void;
  onToggleFavorito: () => void;
}) {
  const colors = useColors();

  const corTipo: Record<ServiceType, string> = {
    Instalação: PREMIUM.blueDeep,
    "Tipo 3": '#2447A8',
    Mudança: '#2869D8',
    Empresarial: '#9B741B',
  };
  const iconeTipo: Record<ServiceType, string> = {
    Instalação: 'build.fill',
    "Tipo 3": 'square.stack.3d.up.fill',
    Mudança: 'arrow.triangle.2.circlepath',
    Empresarial: 'building.2.fill',
  };
  const horario = instalacao.createdAt
    ? new Date(instalacao.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Pressable
      onPress={onEditar}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: PREMIUM.surface,
          borderColor: PREMIUM.divider,
          borderLeftColor: PREMIUM.blue,
          borderLeftWidth: 3,
          shadowColor: '#000000',
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <View style={styles.cardServiceIcon}>
        <IconSymbol name={iconeTipo[instalacao.tipoServico]} size={35} color="#C9D8F7" />
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardCliente, { color: colors.foreground }]} numberOfLines={1}>
            OS: {instalacao.cliente}
          </Text>
          <Text style={[styles.cardDateTime, { color: colors.muted }]} numberOfLines={1}>
            • {instalacao.data}{horario ? ` ${horario}` : ''}
          </Text>
        </View>
        <View style={styles.cardAddressRow}>
          <IconSymbol name="location.fill" size={18} color={colors.muted} />
          <Text style={[styles.cardEndereco, { color: colors.muted }]} numberOfLines={1}>
            {instalacao.endereco}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <View style={[styles.badgeTipo, { backgroundColor: corTipo[instalacao.tipoServico] }]}>
            <Text style={styles.badgeTipoTexto}>{instalacao.tipoServico}</Text>
          </View>
          <Text style={[styles.cardData, { color: colors.muted }]}>{instalacao.data}</Text>
          <Text style={[styles.cardValor, { color: colors.success }]}>R$ {valor}</Text>
        </View>
      </View>

      <View style={styles.cardAcoes}>
        <Pressable onPress={onToggleFavorito} style={styles.favoriteButton}>
          <IconSymbol name={instalacao.isFavorito ? 'star.fill' : 'star'} size={30} color="#81A7F0" />
        </Pressable>
        <View style={styles.actionDivider} />
        <Pressable
          style={({ pressed }) => [styles.acaoBotao, { backgroundColor: '#513A0E', borderColor: PREMIUM.gold }, pressed && { opacity: 0.7 }]}
          onPress={onDuplicar}
        >
          <IconSymbol name="doc.on.clipboard" size={25} color="#FFFFFF" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.acaoBotao, { backgroundColor: '#681F27', borderColor: PREMIUM.error }, pressed && { opacity: 0.7 }]}
          onPress={onExcluir}
        >
          <IconSymbol name="trash.fill" size={25} color="#FFFFFF" />
        </Pressable>
      </View>
    </Pressable>
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
  counterGroup: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badgeTotal: {
    borderRadius: 24,
    paddingHorizontal: 17,
    paddingVertical: 12,
    minWidth: 104,
    flexDirection: 'row',
    gap: 9,
    alignItems: "center",
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgeTotalTexto: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "800",
  },
  badgeTotalLegenda: {
    color: '#DCE8FF',
    fontSize: 10,
    lineHeight: 13,
    marginTop: 1,
  },
  totalHistoricoBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingRight: 8,
  },
  totalHistoricoNumero: {
    color: PREMIUM.muted,
    fontSize: 16,
    fontWeight: '800',
  },
  totalHistoricoLegenda: {
    color: PREMIUM.muted,
    fontSize: 12,
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
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 154,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  cardServiceIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#102A64',
    borderWidth: 1,
    borderColor: PREMIUM.blue,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  cardDateTime: {
    fontSize: 15,
    lineHeight: 21,
    marginLeft: 6,
    flexShrink: 1,
  },
  cardAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
    minWidth: 0,
  },
  favoriteButton: {
    width: 50,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDivider: {
    width: 1,
    flex: 1,
    minHeight: 24,
    backgroundColor: PREMIUM.divider,
    marginVertical: 4,
  },
  cardCliente: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25,
    flexShrink: 1,
  },
  cardEndereco: {
    fontSize: 16,
    lineHeight: 21,
    flexShrink: 1,
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
    width: 52,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: PREMIUM.divider,
    paddingLeft: 10,
  },
  acaoBotao: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
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
    marginHorizontal: 18,
    marginBottom: 8,
    padding: 16,
    borderRadius: 18,
    gap: 14,
    borderWidth: 1,
  },
  ordenacaoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: PREMIUM.divider,
    paddingHorizontal: 2,
  },
  ordenacaoBotao: {
    minWidth: 105,
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 6,
  },
  ordenacaoBotaoAtivo: {
    borderBottomWidth: 3,
    borderBottomColor: PREMIUM.blue,
  },
  ordenacaoTexto: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  buscaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchWrap: {
    flex: 1,
    minHeight: 58,
    borderWidth: 1,
    borderColor: PREMIUM.divider,
    borderRadius: 16,
    backgroundColor: PREMIUM.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    fontSize: 16,
    height: 52,
  },
  filterActionButton: {
    width: 60,
    height: 60,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtroScroll: {
    flexDirection: "row",
  },
  filtroBotao: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
  },
  filtroBotaoTexto: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
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
