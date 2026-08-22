import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useColors } from "@/hooks/use-colors";
import type { ServiceType } from "@/types/installation";
import * as Haptics from "expo-haptics";
import { formatarData, obterDataAtual, validarData, validarCliente, validarEndereco } from "@/lib/input-masks";
import { DatePickerModal } from "@/components/date-picker-modal";
import { BAIRROS_LEM, buscarBairros, validarBairro } from "@/lib/bairros-lem";
import { ImportModal } from "@/components/import-modal";
import type { Installation } from "@/types/installation";
import { PREMIUM } from "@/components/premium-ui";

const TIPOS: ServiceType[] = ["Instalação", "Tipo 3", "Mudança", "Empresarial"];

const TIPO_ICONS: Record<ServiceType, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  "Instalação": "construction",
  "Tipo 3": "layers",
  "Mudança": "sync",
  "Empresarial": "business",
};

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

function hapticSuccess() {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export default function NovoCadastroScreen() {
  const { adicionarInstalacao } = useInstallations();
  const colors = useColors();
  const router = useRouter();

  const [cliente, setCliente] = useState("");
  const [bairro, setBairro] = useState("");
  const [bairrosFiltrados, setBairrosFiltrados] = useState<string[]>(BAIRROS_LEM);
  const [mostrarBairros, setMostrarBairros] = useState(false);
  const [tipoServico, setTipoServico] = useState<ServiceType>("Instalação");
  const [data, setData] = useState(() => obterDataAtual());
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [temAlteracoes, setTemAlteracoes] = useState(false);
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [mostrarImportModal, setMostrarImportModal] = useState(false);
  
  // Função para filtrar bairros
  const handleBairroSearch = (text: string) => {
    setBairro(text);
    if (text.trim()) {
      setBairrosFiltrados(buscarBairros(text));
    } else {
      setBairrosFiltrados(BAIRROS_LEM);
    }
  };
  
  // Função para selecionar bairro
  const handleSelectBairro = (selectedBairro: string) => {
    setBairro(selectedBairro);
    setMostrarBairros(false);
    haptic();
  };


  async function handleImport(installations: Installation[]) {
    try {
      for (const inst of installations) {
        await adicionarInstalacao({
          cliente: inst.cliente,
          endereco: inst.endereco,
          tipoServico: inst.tipoServico,
          data: inst.data,
          observacoes: inst.observacoes,
        });
      }
      hapticSuccess();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function salvar() {
    if (!validarCliente(cliente)) {
      Alert.alert("Cliente inválido", "Informe um nome de cliente válido (1-100 caracteres).");
      return;
    }
    if (!bairro.trim()) {
      Alert.alert("Bairro obrigatório", "Selecione um bairro.");
      return;
    }
    if (!validarBairro(bairro)) {
      Alert.alert("Bairro inválido", "Selecione um bairro da lista.");
      return;
    }
    if (!validarData(data)) {
      Alert.alert("Data inválida", "Informe uma data válida no formato dd/mm/aaaa.");
      return;
    }
    if (!data.trim() || data.length < 10) {
      Alert.alert("Campo obrigatório", "Informe a data no formato dd/mm/aaaa.");
      return;
    }

    setSalvando(true);
    try {
      await adicionarInstalacao({
        cliente: cliente.trim(),
        endereco: bairro.trim(),
        tipoServico,
        data,
        observacoes: observacoes.trim(),
      });
      hapticSuccess();
      // Limpar formulário
      setCliente("");
      setBairro("");
      setTipoServico("Instalação");
      setData(obterDataAtual());
      setObservacoes("");
      // Voltar ao dashboard
      router.replace("/");
    } catch (error) {
      console.error('Erro ao salvar instalação:', error);
      Alert.alert(
        "Erro ao salvar",
        "Não foi possível salvar a instalação. Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={({ pressed }) => [styles.backButton, { borderColor: PREMIUM.goldBorder, opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={PREMIUM.foreground} />
          </Pressable>
          <View style={[styles.headerIcon, { backgroundColor: PREMIUM.blue }]}>
            <MaterialIcons name="add" size={30} color="#FFFFFF" />
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: PREMIUM.foreground }]}>Nova Instalação</Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>Registre uma nova ordem de serviço</Text>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: PREMIUM.surface, borderColor: PREMIUM.divider }]}>

        {/* Campo Cliente */}
        <FormField label="Cliente *" icon="person-outline">
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: PREMIUM.surface,
                borderColor: PREMIUM.goldBorder,
                color: PREMIUM.foreground,
              },
            ]}
            placeholder="Nome do cliente"
            placeholderTextColor={colors.muted}
            value={cliente}
            onChangeText={setCliente}
            returnKeyType="next"
          />
        </FormField>

        {/* Campo Bairro */}
        <FormField label="Bairro *" icon="location-on">
          <View>
            <Pressable
              style={[
                styles.input,
                {
                  backgroundColor: PREMIUM.surface,
                  borderColor: PREMIUM.goldBorder,
                  justifyContent: 'center',
                },
              ]}
              onPress={() => {
                haptic();
                setMostrarBairros(!mostrarBairros);
              }}
            >
              <View style={styles.bairroSelectorContent}>
                <Text style={{ color: bairro ? colors.foreground : colors.muted, fontSize: 16 }}>
                  {bairro || 'Selecione um bairro'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color={PREMIUM.blue} />
              </View>
            </Pressable>
            
            {/* Lista de bairros */}
            {mostrarBairros && (
              <View
                style={{
                  backgroundColor: PREMIUM.surface,
                      borderColor: PREMIUM.goldBorder,
                  borderWidth: 1,
                  borderTopWidth: 0,
                  maxHeight: 200,
                }}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderBottomWidth: 1,
                      borderRadius: 0,
                    },
                  ]}
                  placeholder="Buscar bairro..."
                  placeholderTextColor={colors.muted}
                  value={bairro}
                  onChangeText={handleBairroSearch}
                />
                <ScrollView style={{ maxHeight: 150 }}>
                  {bairrosFiltrados.map((b) => (
                    <Pressable
                      key={b}
                      style={({ pressed }) => [
                        {
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          backgroundColor: bairro === b ? colors.primary : 'transparent',
                        },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => handleSelectBairro(b)}
                    >
                      <View style={styles.bairroItem}>
                        <MaterialIcons name="location-on" size={18} color={bairro === b ? "#FFFFFF" : PREMIUM.blue} />
                        <Text style={{ color: bairro === b ? '#fff' : colors.foreground, fontSize: 14 }}>{b}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </FormField>

        {/* Tipo de Serviço */}
        <FormField label="Tipo de Serviço *" icon="build">
          <View style={styles.tiposRow}>
            {TIPOS.map((tipo) => (
              <Pressable
                key={tipo}
                style={({ pressed }) => [
                  styles.tipoBotao,
                  {
                    backgroundColor:
                      tipoServico === tipo ? PREMIUM.blueDeep : PREMIUM.surface,
                    borderColor:
                      tipoServico === tipo ? PREMIUM.blue : PREMIUM.goldBorder,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  haptic();
                  setTipoServico(tipo);
                }}
              >
                <MaterialIcons
                  name={TIPO_ICONS[tipo]}
                  size={20}
                  color={tipoServico === tipo ? "#FFFFFF" : PREMIUM.foreground}
                />
                <Text
                  style={[
                    styles.tipoBotaoTexto,
                    {
                      color:
                        tipoServico === tipo ? "#fff" : colors.foreground,
                    },
                  ]}
                >
                  {tipo}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>

        {/* Campo Data */}
        <FormField label="Data *" icon="event">
          <Pressable
            style={({ pressed }) => [
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                justifyContent: 'center',
              },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => {
              haptic();
              setMostrarDatePicker(true);
            }}
          >
            <View style={styles.bairroSelectorContent}>
              <Text style={[styles.dateDisplayText, { color: data ? colors.foreground : colors.muted }]}>
                {data || "Clique para selecionar a data"}
              </Text>
              <MaterialIcons name="event" size={23} color={PREMIUM.blue} />
            </View>
          </Pressable>
        </FormField>

        {/* Date Picker Modal */}
        <DatePickerModal
          visible={mostrarDatePicker}
          onClose={() => setMostrarDatePicker(false)}
          onDateSelected={(selectedDate) => {
            setData(selectedDate);
            setTemAlteracoes(true);
          }}
          initialDate={data}
        />

        {/* Campo Observações */}
        <FormField label="Observações" icon="description">
          <TextInput
            style={[
              styles.input,
              styles.inputMultilinha,
              {
                backgroundColor: PREMIUM.surface,
                borderColor: PREMIUM.goldBorder,
                color: PREMIUM.foreground,
              },
            ]}
            placeholder="Observações (opcional)"
            placeholderTextColor={colors.muted}
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            returnKeyType="done"
            maxLength={200}
          />
          <Text style={[styles.characterCount, { color: colors.muted }]}>{observacoes.length}/200</Text>
        </FormField>

        </View>

        {/* Botão Importar */}
        <Pressable
          style={({ pressed }) => [
            styles.botaoImportar,
            { backgroundColor: PREMIUM.surface, borderColor: PREMIUM.blue },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => {
            haptic();
            setMostrarImportModal(true);
          }}
        >
          <MaterialIcons name="upload-file" size={20} color={colors.primary} />
          <Text style={[styles.botaoImportarTexto, { color: colors.primary }]}>Importar CSV</Text>
        </Pressable>

        {/* Botão Salvar */}
        <Pressable
          style={({ pressed }) => [
            styles.botaoSalvar,
            { backgroundColor: salvando ? '#475569' : PREMIUM.blue },
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
          onPress={salvar}
          disabled={salvando}
        >
          <MaterialIcons name="save" size={23} color="#FFFFFF" />
          <Text style={styles.botaoSalvarTexto}>
            {salvando ? "Salvando..." : "Salvar Instalação"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal de Importação */}
      <ImportModal
        visible={mostrarImportModal}
        onClose={() => setMostrarImportModal(false)}
        onImport={handleImport}
      />
    </ScreenContainer>
  );
}

function FormField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.campo}>
      <View style={styles.fieldLabelRow}>
        <View style={[styles.fieldIcon, { backgroundColor: PREMIUM.blueSoft }]}>
          <MaterialIcons name={icon} size={19} color={PREMIUM.blue} />
        </View>
        <Text style={[styles.campoLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 42,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 18,
    shadowColor: PREMIUM.blue,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  headerCopy: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 2,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  campo: {
    marginBottom: 20,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },
  fieldIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  campoLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 16,
    minHeight: 56,
    fontSize: 16,
    lineHeight: 23,
  },
  dateDisplayText: {
    fontSize: 16,
    lineHeight: 23,
  },
  inputMultilinha: {
    minHeight: 122,
    paddingTop: 14,
  },
  tiposRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tipoBotao: {
    minWidth: "47%",
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  tipoBotaoTexto: {
    fontSize: 14,
    fontWeight: "700",
  },
  botaoSalvar: {
    borderRadius: 15,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    shadowColor: PREMIUM.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 7,
  },
  botaoSalvarTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  botaoImportar: {
    borderRadius: 14,
    minHeight: 52,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
  },
  botaoImportarTexto: {
    fontSize: 15,
    fontWeight: "700",
  },
  bairroSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  bairroItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  characterCount: {
    textAlign: "right",
    fontSize: 12,
    marginTop: 7,
  },
});
