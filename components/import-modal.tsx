import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useColors } from "@/hooks/use-colors";
import { parseCSV, importRowToInstallation, type ParseResult } from "@/lib/parse-csv";
import type { Installation } from "@/types/installation";
import * as Haptics from "expo-haptics";

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (installations: Installation[]) => Promise<void>;
}

export function ImportModal({ visible, onClose, onImport }: ImportModalProps) {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);

  async function pickFile() {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "application/vnd.ms-excel"],
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];

      // Read file content
      const response = await fetch(file.uri);
      const text = await response.text();

      // Parse CSV
      const parsed = parseCSV(text);
      setParseResult(parsed);

      if (Platform.OS !== "web") {
        if (parsed.invalid.length > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao ler o arquivo. Verifique se é um CSV válido.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function confirmImport() {
    if (!parseResult || parseResult.valid.length === 0) {
      Alert.alert("Aviso", "Nenhuma instalação válida para importar.");
      return;
    }

    try {
      setImporting(true);
      const installations = parseResult.valid.map(importRowToInstallation);
      await onImport(installations);

      Alert.alert(
        "Sucesso",
        `${installations.length} instalação(ões) importada(s) com sucesso!`
      );

      // Reset state
      setParseResult(null);
      onClose();
    } catch (error) {
      Alert.alert("Erro", "Falha ao importar instalações.");
      console.error(error);
    } finally {
      setImporting(false);
    }
  }

  function resetImport() {
    setParseResult(null);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            marginTop: 60,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Importar Instalações
            </Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={{ fontSize: 24, color: colors.muted }}>✕</Text>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {!parseResult ? (
              // Initial state - pick file
              <View style={{ gap: 16 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 20 }}>
                  Selecione um arquivo CSV com as seguintes colunas obrigatórias:
                </Text>

                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    gap: 8,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>
                    Colunas Obrigatórias:
                  </Text>
                  <Text style={{ color: colors.foreground, fontSize: 13 }}>
                    • cliente - Nome do cliente
                  </Text>
                  <Text style={{ color: colors.foreground, fontSize: 13 }}>
                    • bairro - Bairro da instalação
                  </Text>
                  <Text style={{ color: colors.foreground, fontSize: 13 }}>
                    • tipoServico - Tipo de serviço (Instalação, Tipo 3, Mudança, Empresarial)
                  </Text>
                  <Text style={{ color: colors.foreground, fontSize: 13 }}>
                    • data - Data no formato dd/mm/aaaa
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    gap: 8,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>
                    Colunas Opcionais:
                  </Text>
                  <Text style={{ color: colors.foreground, fontSize: 13 }}>
                    • valor - Valor da instalação (não usado, apenas referência)
                  </Text>
                  <Text style={{ color: colors.foreground, fontSize: 13 }}>
                    • observacoes - Observações adicionais
                  </Text>
                </View>

                <Pressable
                  onPress={pickFile}
                  disabled={loading}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.primary,
                      borderRadius: 8,
                      paddingVertical: 12,
                      alignItems: "center",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      📁 Selecionar Arquivo CSV
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              // Preview state
              <View style={{ gap: 16 }}>
                {/* Summary */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    gap: 8,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>
                    Resumo da Importação
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.success, fontWeight: "600" }}>
                      ✓ Válidas: {parseResult.valid.length}
                    </Text>
                    {parseResult.invalid.length > 0 && (
                      <Text style={{ color: colors.error, fontWeight: "600" }}>
                        ✗ Inválidas: {parseResult.invalid.length}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Valid rows preview */}
                {parseResult.valid.length > 0 && (
                  <View>
                    <Text style={{ color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                      Instalações a Importar ({parseResult.valid.length}):
                    </Text>
                    <FlatList
                      data={parseResult.valid.slice(0, 5)}
                      keyExtractor={(_, i) => `valid-${i}`}
                      scrollEnabled={false}
                      renderItem={({ item }) => (
                        <View
                          style={{
                            backgroundColor: colors.surface,
                            borderRadius: 6,
                            padding: 10,
                            marginBottom: 8,
                            borderLeftWidth: 3,
                            borderLeftColor: colors.success,
                          }}
                        >
                          <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                            {item.cliente}
                          </Text>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>
                            {item.bairro} • {item.tipoServico} • {item.data}
                          </Text>
                        </View>
                      )}
                    />
                    {parseResult.valid.length > 5 && (
                      <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
                        ... e mais {parseResult.valid.length - 5} instalações
                      </Text>
                    )}
                  </View>
                )}

                {/* Invalid rows */}
                {parseResult.invalid.length > 0 && (
                  <View>
                    <Text style={{ color: colors.error, fontWeight: "600", marginBottom: 8 }}>
                      Erros Encontrados ({parseResult.invalid.length}):
                    </Text>
                    <FlatList
                      data={parseResult.invalid.slice(0, 3)}
                      keyExtractor={(_, i) => `invalid-${i}`}
                      scrollEnabled={false}
                      renderItem={({ item }) => (
                        <View
                          style={{
                            backgroundColor: colors.surface,
                            borderRadius: 6,
                            padding: 10,
                            marginBottom: 8,
                            borderLeftWidth: 3,
                            borderLeftColor: colors.error,
                          }}
                        >
                          <Text style={{ color: colors.error, fontWeight: "600" }}>
                            Linha {item.row}
                          </Text>
                          <Text style={{ color: colors.muted, fontSize: 12 }}>
                            {item.error}
                          </Text>
                        </View>
                      )}
                    />
                    {parseResult.invalid.length > 3 && (
                      <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center" }}>
                        ... e mais {parseResult.invalid.length - 3} erros
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            {parseResult ? (
              <>
                <Pressable
                  onPress={resetImport}
                  disabled={importing}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      paddingVertical: 10,
                      alignItems: "center",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                    Voltar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={confirmImport}
                  disabled={importing || parseResult.valid.length === 0}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      backgroundColor:
                        parseResult.valid.length === 0 ? colors.muted : colors.primary,
                      borderRadius: 8,
                      paddingVertical: 10,
                      alignItems: "center",
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {importing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Importar ({parseResult.valid.length})
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                  Fechar
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
