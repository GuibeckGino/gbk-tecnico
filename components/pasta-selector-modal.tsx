import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { useColors } from "@/hooks/use-colors";

interface PastaSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (pastaUri: string) => void;
  titulo?: string;
}

export function PastaSelectorModal({
  visible,
  onClose,
  onSelect,
  titulo = "Escolha a Pasta",
}: PastaSelectorModalProps) {
  const colors = useColors();
  const [pastaAtual, setPastaAtual] = useState<string>(
    FileSystem.documentDirectory || ""
  );
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  React.useEffect(() => {
    if (visible) {
      carregarPasta(pastaAtual);
    }
  }, [visible]);

  async function carregarPasta(uri: string) {
    setCarregando(true);
    try {
      const conteudo = await FileSystem.readDirectoryAsync(uri);
      const itens = await Promise.all(
        conteudo.map(async (nome) => {
          const caminhoCompleto = `${uri}${uri.endsWith("/") ? "" : "/"}${nome}`;
          const info = await FileSystem.getInfoAsync(caminhoCompleto);
          return {
            nome,
            uri: caminhoCompleto,
            isDirectory: info.isDirectory,
          };
        })
      );

      // Ordenar: pastas primeiro, depois arquivos
      const ordenado = itens.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.nome.localeCompare(b.nome);
      });

      setArquivos(ordenado);
    } catch (error) {
      console.error("[PastaSelector] Erro ao carregar pasta:", error);
      Alert.alert("Erro", "Não foi possível carregar a pasta.");
    } finally {
      setCarregando(false);
    }
  }

  function voltar() {
    const partes = pastaAtual.split("/").filter((p) => p);
    if (partes.length > 1) {
      partes.pop();
      const novaPasta = "/" + partes.join("/");
      setPastaAtual(novaPasta);
      carregarPasta(novaPasta);
    }
  }

  function selecionarPasta() {
    onSelect(pastaAtual);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <Pressable onPress={onClose} style={styles.botaoFechar}>
            <Text style={[styles.textoBotao, { color: colors.primary }]}>
              Cancelar
            </Text>
          </Pressable>
          <Text style={[styles.titulo, { color: colors.foreground }]}>
            {titulo}
          </Text>
          <Pressable onPress={selecionarPasta} style={styles.botaoConfirmar}>
            <Text style={[styles.textoBotao, { color: colors.primary }]}>
              Selecionar
            </Text>
          </Pressable>
        </View>

        {/* Caminho Atual */}
        <View
          style={[
            styles.caminhoContainer,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.caminhoLabel, { color: colors.muted }]}>
            Pasta:
          </Text>
          <Text
            style={[styles.caminhoTexto, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {pastaAtual}
          </Text>
        </View>

        {/* Navegação */}
        <View style={[styles.navContainer, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={voltar}
            style={[
              styles.botaoNav,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.botaoNavTexto, { color: colors.primary }]}>
              ⬅️ Voltar
            </Text>
          </Pressable>
        </View>

        {/* Lista de Arquivos/Pastas */}
        <ScrollView
          style={styles.listaContainer}
          contentContainerStyle={styles.listaContent}
        >
          {carregando ? (
            <Text style={[styles.textoVazio, { color: colors.muted }]}>
              Carregando...
            </Text>
          ) : arquivos.length === 0 ? (
            <Text style={[styles.textoVazio, { color: colors.muted }]}>
              Pasta vazia
            </Text>
          ) : (
            arquivos.map((item) => (
              <Pressable
                key={item.uri}
                onPress={() => {
                  if (item.isDirectory) {
                    setPastaAtual(item.uri);
                    carregarPasta(item.uri);
                  }
                }}
                style={[
                  styles.itemLista,
                  {
                    backgroundColor: colors.surface,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.itemTexto,
                    {
                      color: item.isDirectory ? colors.primary : colors.foreground,
                      fontWeight: item.isDirectory ? "600" : "400",
                    },
                  ]}
                >
                  {item.isDirectory ? "📁 " : "📄 "}
                  {item.nome}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 40 : 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "600",
  },
  botaoFechar: {
    padding: 8,
  },
  botaoConfirmar: {
    padding: 8,
  },
  textoBotao: {
    fontSize: 14,
    fontWeight: "600",
  },
  caminhoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  caminhoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  caminhoTexto: {
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  navContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  botaoNav: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  botaoNavTexto: {
    fontSize: 14,
    fontWeight: "600",
  },
  listaContainer: {
    flex: 1,
  },
  listaContent: {
    paddingVertical: 8,
  },
  itemLista: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemTexto: {
    fontSize: 14,
  },
  textoVazio: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 14,
  },
});
