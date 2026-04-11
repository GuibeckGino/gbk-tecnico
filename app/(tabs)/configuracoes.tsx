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
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useGBKTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export default function ConfiguracoesScreen() {
  const { instalacoes, limparDados, exportarJSON, importarJSON } =
    useInstallations();
  const { modoEscuro, toggleModoEscuro } = useGBKTheme();
  const colors = useColors();
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);

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
        Alert.alert("Exportação", "Exportação CSV disponível apenas no dispositivo móvel.");
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
        Alert.alert("Exportação", "Exportação de backup disponível apenas no dispositivo móvel.");
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
      Alert.alert("Restauração", "Restauração de backup disponível apenas no dispositivo móvel.");
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
                Alert.alert("Sucesso", "Backup restaurado com sucesso!");
              } else {
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

  function confirmarLimpeza() {
    haptic();
    Alert.alert(
      "Limpar Todos os Dados",
      `Isso apagará permanentemente todas as ${instalacoes.length} instalações cadastradas. Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar Tudo",
          style: "destructive",
          onPress: async () => {
            await limparDados();
            Alert.alert("Concluído", "Todos os dados foram apagados.");
          },
        },
      ]
    );
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

        {/* Seção Perigo */}
        <Secao titulo="Zona de Perigo">
          <ItemConfig
            icone="🗑️"
            label="Limpar Todos os Dados"
            sublabel="Apaga todas as instalações"
            onPress={confirmarLimpeza}
            cor="error"
          />
        </Secao>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={[styles.infoTexto, { color: colors.muted }]}>
            GBK Técnico v1.0.0
          </Text>
          <Text style={[styles.infoTexto, { color: colors.muted }]}>
            100% offline · AsyncStorage
          </Text>
        </View>
      </ScrollView>
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
});
