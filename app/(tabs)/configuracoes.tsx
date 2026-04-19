import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useMonth } from "@/context/MonthContext";
import { useGBKTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/use-colors";

import * as Haptics from "expo-haptics";
import { useState as useStateReact, useEffect } from "react";

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

export default function ConfiguracoesScreen() {
  const { instalacoes, stats, limparDados, exportarJSON, importarJSON, paymentMode, setPaymentMode } =
    useInstallations();
  const { mes, ano, mesAnoFormatado } = useMonth();
  const { modoEscuro, toggleModoEscuro } = useGBKTheme();
  const colors = useColors();
  const [exportando, setExportando] = useStateReact(false);
  const [importando, setImportando] = useStateReact(false);
  const [showPaymentModes, setShowPaymentModes] = useStateReact(false);

  // Modal de confirmação para limpar dados
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useStateReact(false);
  const [limpando, setLimpando] = useStateReact(false);

  async function compartilharMes() {
    const instalacoesDoMes = instalacoes.filter((inst) => {
      const [d, m, a] = inst.data.split("/");
      return parseInt(m) === mes && parseInt(a) === ano;
    });

    if (instalacoesDoMes.length === 0) {
      Alert.alert("Sem dados", `Não há instalações em ${mesAnoFormatado}.`);
      return;
    }

    const totalInstalacoes = instalacoesDoMes.length;
    const valorIndividual = totalInstalacoes >= 104 ? 70 : 65;
    const totalValor = totalInstalacoes * valorIndividual;
    const valorFormatado = totalValor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const contagem = {
      Instalacao: instalacoesDoMes.filter((i) => i.tipoServico === "Instalação").length,
      Tipo3: instalacoesDoMes.filter((i) => i.tipoServico === "Tipo 3").length,
      Mudanca: instalacoesDoMes.filter((i) => i.tipoServico === "Mudança").length,
    };

    const mensagem = `📊 *Relatório GBK Técnico - ${mesAnoFormatado}*\n\n` +
      `📦 Total de Instalações: ${totalInstalacoes}\n` +
      `💰 Valor Total: ${valorFormatado}\n\n` +
      `📋 Por Tipo:\n` +
      `  • Instalação: ${contagem.Instalacao}\n` +
      `  • Tipo 3: ${contagem.Tipo3}\n` +
      `  • Mudança: ${contagem.Mudanca}\n\n` +
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`;

    if (Platform.OS === "web") {
      Alert.alert(
        "Compartilhar",
        "Compartilhamento disponível apenas no dispositivo móvel."
      );
      return;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(mensagem, {
        dialogTitle: "Compartilhar Relatório",
      });
    }
  }




  async function exportarCSV() {
    if (instalacoes.length === 0) {
      Alert.alert("Sem dados", "Não há instalações para exportar.");
      return;
    }
    setExportando(true);
    try {
      const cabecalho = "Cliente,Endereço,Tipo,Data,Observações";
      const linhas = instalacoes.map((inst) => {
        const campos = [
          `"${inst.cliente.replace(/"/g, '""')}"`,
          `"${inst.endereco.replace(/"/g, '""')}"`,
          `"${inst.tipoServico}"`,
          `"${inst.data}"`,
          `"${inst.observacoes.replace(/"/g, '""')}"`,
        ];
        return campos.join(",");
      });
      const csv = [cabecalho, ...linhas].join("\n");

      if (Platform.OS === "web") {
        Alert.alert(
          "Exportação",
          "Exportação CSV disponível apenas no dispositivo móvel."
        );
        return;
      }

      const uri = `${FileSystem.documentDirectory}gbk_instalacoes.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "text/csv",
          dialogTitle: "Exportar CSV",
        });
      } else {
        Alert.alert("Exportado", `Arquivo salvo em: ${uri}`);
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível exportar o CSV.");
    } finally {
      setExportando(false);
    }
  }

  async function exportarBackup() {
    if (instalacoes.length === 0) {
      Alert.alert("Sem dados", "Não há instalações para exportar.");
      return;
    }
    setExportando(true);
    try {
      const json = exportarJSON();

      if (Platform.OS === "web") {
        Alert.alert(
          "Exportação",
          "Exportação de backup disponível apenas no dispositivo móvel."
        );
        return;
      }

      const uri = `${FileSystem.documentDirectory}gbk_backup.json`;
      await FileSystem.writeAsStringAsync(uri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/json",
          dialogTitle: "Exportar Backup",
        });
      } else {
        Alert.alert("Exportado", `Backup salvo em: ${uri}`);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível exportar o backup.");
    } finally {
      setExportando(false);
    }
  }

  async function restaurarBackup() {
    if (Platform.OS === "web") {
      Alert.alert(
        "Restauração",
        "Restauração de backup disponível apenas no dispositivo móvel."
      );
      return;
    }
    setImportando(true);
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (resultado.canceled || !resultado.assets?.[0]) {
        return;
      }

      const uri = resultado.assets[0].uri;
      const conteudo = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert(
        "Restaurar Backup",
        "Isso substituirá todos os dados atuais. Deseja continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Restaurar",
            style: "destructive",
            onPress: async () => {
              const sucesso = await importarJSON(conteudo);
              if (sucesso) {
                hapticSuccess();
                Alert.alert("Sucesso", "Backup restaurado com sucesso!");
              } else {
                hapticError();
                Alert.alert("Erro", "Arquivo de backup inválido.");
              }
            },
          },
        ]
      );
    } catch {
      Alert.alert("Erro", "Não foi possível ler o arquivo de backup.");
    } finally {
      setImportando(false);
    }
  }

  function abrirConfirmacaoLimpeza() {
    hapticError();
    setConfirmandoLimpeza(true);
  }



  function fecharConfirmacaoLimpeza() {
    setConfirmandoLimpeza(false);
  }

  async function executarLimpeza() {
    setLimpando(true);
    try {
      await limparDados();
      hapticSuccess();
      fecharConfirmacaoLimpeza();
    } finally {
      setLimpando(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.titulo, { color: colors.foreground }]}>
          Configurações
        </Text>

        {/* Seção Aparência */}
        <Secao titulo="Aparência">
          <ItemConfig
            icone="🌙"
            label="Modo Escuro"
            direita={
              <Switch
                value={modoEscuro}
                onValueChange={() => {
                  haptic();
                  toggleModoEscuro();
                }}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor="#fff"
              />
            }
          />
        </Secao>

        {/* Seção Modo de Pagamento */}
        <Secao titulo="Modo de Pagamento">
          <ItemConfig
            icone="💳"
            label="Modo Atual"
            sublabel={paymentMode === "meta" ? "Meta Progressiva" : paymentMode === "fixo65" ? "Fixo R$ 65" : "Fixo R$ 70"}
            onPress={() => setShowPaymentModes(true)}
          />
        </Secao>

        {/* Seção Dados */}
        <Secao titulo="Dados">
          <ItemConfig
            icone="📄"
            label="Exportar CSV"
            sublabel={`${instalacoes.length} instalações`}
            onPress={exportarCSV}
            desabilitado={exportando}
          />
          <Divisor />
          <ItemConfig
            icone="💾"
            label="Exportar Backup (JSON)"
            sublabel="Salvar todos os dados"
            onPress={exportarBackup}
            desabilitado={exportando}
          />
          <Divisor />
          <ItemConfig
            icone="📂"
            label="Restaurar Backup"
            sublabel="Importar arquivo JSON"
            onPress={restaurarBackup}
            desabilitado={importando}
          />
        </Secao>

        {/* Seção Compartilhamento */}
        <Secao titulo="Compartilhamento">
          <ItemConfig
            icone="📤"
            label="Compartilhar Relatório"
            sublabel={`Mês: ${mesAnoFormatado}`}
            onPress={compartilharMes}
          />
        </Secao>

        {/* Seção Perigo */}
        <Secao titulo="Zona de Perigo">
          <ItemConfig
            icone="🗑️"
            label="Limpar Todos os Dados"
            sublabel="Apaga todas as instalações"
            onPress={abrirConfirmacaoLimpeza}
            cor="error"
          />
        </Secao>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={[styles.infoTexto, { color: colors.muted }]}>
            GBK Técnico v1.1.0
          </Text>
          <Text style={[styles.infoTexto, { color: colors.muted }]}>
            100% offline · AsyncStorage
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Seleção de Modo de Pagamento */}
      <Modal
        visible={showPaymentModes}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPaymentModes(false)}
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
              Modo de Pagamento
            </Text>
            <Text
              style={[styles.confirmMensagem, { color: colors.muted }]}
            >
              Selecione como o valor será calculado:
            </Text>

            <View style={styles.paymentModesContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.paymentModeButton,
                  {
                    backgroundColor: paymentMode === "meta" ? colors.primary : colors.surface,
                    borderColor: paymentMode === "meta" ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={async () => {
                  haptic();
                  await setPaymentMode("meta");
                  setShowPaymentModes(false);
                }}
              >
                <Text
                  style={[
                    styles.paymentModeLabel,
                    { color: paymentMode === "meta" ? "#fff" : colors.foreground },
                  ]}
                >
                  Meta Progressiva
                </Text>
                <Text
                  style={[
                    styles.paymentModeDesc,
                    { color: paymentMode === "meta" ? "rgba(255,255,255,0.8)" : colors.muted },
                  ]}
                >
                  &lt; 104: R$ 65 | ≥ 104: R$ 70
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.paymentModeButton,
                  {
                    backgroundColor: paymentMode === "fixo65" ? colors.primary : colors.surface,
                    borderColor: paymentMode === "fixo65" ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={async () => {
                  haptic();
                  await setPaymentMode("fixo65");
                  setShowPaymentModes(false);
                }}
              >
                <Text
                  style={[
                    styles.paymentModeLabel,
                    { color: paymentMode === "fixo65" ? "#fff" : colors.foreground },
                  ]}
                >
                  Fixo R$ 65
                </Text>
                <Text
                  style={[
                    styles.paymentModeDesc,
                    { color: paymentMode === "fixo65" ? "rgba(255,255,255,0.8)" : colors.muted },
                  ]}
                >
                  Todas as instalações
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.paymentModeButton,
                  {
                    backgroundColor: paymentMode === "fixo70" ? colors.primary : colors.surface,
                    borderColor: paymentMode === "fixo70" ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={async () => {
                  haptic();
                  await setPaymentMode("fixo70");
                  setShowPaymentModes(false);
                }}
              >
                <Text
                  style={[
                    styles.paymentModeLabel,
                    { color: paymentMode === "fixo70" ? "#fff" : colors.foreground },
                  ]}
                >
                  Fixo R$ 70
                </Text>
                <Text
                  style={[
                    styles.paymentModeDesc,
                    { color: paymentMode === "fixo70" ? "rgba(255,255,255,0.8)" : colors.muted },
                  ]}
                >
                  Todas as instalações
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.botaoCancelar,
                {
                  backgroundColor: colors.muted,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => setShowPaymentModes(false)}
            >
              <Text style={styles.botaoCancelarTexto}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação de Limpeza */}
      <Modal
        visible={confirmandoLimpeza}
        animationType="fade"
        transparent
        onRequestClose={fecharConfirmacaoLimpeza}
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
              Limpar Todos os Dados
            </Text>
            <Text
              style={[styles.confirmMensagem, { color: colors.muted }]}
            >
              Isso apagará permanentemente todas as {instalacoes.length} instalações cadastradas.
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
                onPress={fecharConfirmacaoLimpeza}
                disabled={limpando}
              >
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.botaoLimpar,
                  {
                    backgroundColor: limpando ? colors.muted : colors.error,
                    opacity: pressed ? 0.85 : 1,
                    transform: pressed ? [{ scale: 0.97 }] : [],
                  },
                ]}
                onPress={executarLimpeza}
                disabled={limpando}
              >
                {limpando ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.botaoLimparTexto}>Limpar Tudo</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.secao}>
      <Text style={[styles.secaoTitulo, { color: colors.muted }]}>
        {titulo.toUpperCase()}
      </Text>
      <View
        style={[
          styles.secaoCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Divisor() {
  const colors = useColors();
  return (
    <View
      style={[styles.divisor, { backgroundColor: colors.border }]}
    />
  );
}

function ItemConfig({
  icone,
  label,
  sublabel,
  direita,
  onPress,
  desabilitado,
  cor,
}: {
  icone: string;
  label: string;
  sublabel?: string;
  direita?: React.ReactNode;
  onPress?: () => void;
  desabilitado?: boolean;
  cor?: "error";
}) {
  const colors = useColors();
  const corLabel = cor === "error" ? colors.error : colors.foreground;

  const conteudo = (
    <View style={styles.itemConfig}>
      <Text style={styles.itemIcone}>{icone}</Text>
      <View style={styles.itemTextos}>
        <Text
          style={[
            styles.itemLabel,
            { color: desabilitado ? colors.muted : corLabel },
          ]}
        >
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.itemSublabel, { color: colors.muted }]}>
            {sublabel}
          </Text>
        )}
      </View>
      {direita && <View style={styles.itemDireita}>{direita}</View>}
      {onPress && !direita && (
        <Text style={[styles.itemSeta, { color: colors.muted }]}>›</Text>
      )}
    </View>
  );

  if (!onPress) return conteudo;

  return (
    <Pressable
      style={({ pressed }) => [pressed && { opacity: 0.6 }]}
      onPress={() => {
        if (!desabilitado) {
          haptic();
          onPress();
        }
      }}
      disabled={desabilitado}
    >
      {conteudo}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  secao: {
    marginBottom: 20,
  },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  secaoCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  divisor: {
    height: 1,
    marginLeft: 52,
  },
  itemConfig: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemIcone: {
    fontSize: 20,
    width: 36,
  },
  itemTextos: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  itemSublabel: {
    fontSize: 12,
    marginTop: 1,
    lineHeight: 16,
  },
  itemDireita: {
    marginLeft: 8,
  },
  itemSeta: {
    fontSize: 22,
    fontWeight: "300",
    marginLeft: 8,
  },
  infoContainer: {
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  infoTexto: {
    fontSize: 12,
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
  botaoLimpar: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  botaoLimparTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  paymentModesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  paymentModeButton: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
  },
  paymentModeLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentModeDesc: {
    fontSize: 12,
    fontWeight: "400",
  },
});
