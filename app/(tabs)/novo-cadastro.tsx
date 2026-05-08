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
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useColors } from "@/hooks/use-colors";
import type { ServiceType } from "@/types/installation";
import * as Haptics from "expo-haptics";
import { formatarData, validarData, validarCliente, validarEndereco } from "@/lib/input-masks";
import { DatePickerModal } from "@/components/date-picker-modal";

const TIPOS: ServiceType[] = ["Instalação", "Tipo 3", "Mudança", "Empresarial"];

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
  const [endereco, setEndereco] = useState("");
  const [tipoServico, setTipoServico] = useState<ServiceType>("Instalação");
  const [data, setData] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [temAlteracoes, setTemAlteracoes] = useState(false);
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);

  async function salvar() {
    if (!validarCliente(cliente)) {
      Alert.alert("Cliente inválido", "Informe um nome de cliente válido (1-100 caracteres).");
      return;
    }
    if (!validarEndereco(endereco)) {
      Alert.alert("Endereço inválido", "Informe um endereço válido (1-200 caracteres).");
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
        endereco: endereco.trim(),
        tipoServico,
        data,
        observacoes: observacoes.trim(),
      });
      hapticSuccess();
      // Limpar formulário
      setCliente("");
      setEndereco("");
      setTipoServico("Instalação");
      setData("");
      setObservacoes("");
      // Voltar ao dashboard
      router.replace("/");
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
        <Text style={[styles.titulo, { color: colors.foreground }]}>
          Nova Instalação
        </Text>

        {/* Campo Cliente */}
        <FormField label="Cliente *">
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Nome do cliente"
            placeholderTextColor={colors.muted}
            value={cliente}
            onChangeText={setCliente}
            returnKeyType="next"
          />
        </FormField>

        {/* Campo Endereço */}
        <FormField label="Endereço *">
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Endereço completo"
            placeholderTextColor={colors.muted}
            value={endereco}
            onChangeText={setEndereco}
            returnKeyType="next"
          />
        </FormField>

        {/* Tipo de Serviço */}
        <FormField label="Tipo de Serviço *">
          <View style={styles.tiposRow}>
            {TIPOS.map((tipo) => (
              <Pressable
                key={tipo}
                style={({ pressed }) => [
                  styles.tipoBotao,
                  {
                    backgroundColor:
                      tipoServico === tipo ? colors.primary : colors.surface,
                    borderColor:
                      tipoServico === tipo ? colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  haptic();
                  setTipoServico(tipo);
                }}
              >
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
        <FormField label="Data *">
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
            <Text
              style={[
                styles.dateDisplayText,
                {
                  color: data ? colors.foreground : colors.muted,
                  fontSize: 16,
                  paddingVertical: 12,
                },
              ]}
            >
              {data || "Clique para selecionar a data"}
            </Text>
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
        <FormField label="Observações">
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
            placeholder="Observações (opcional)"
            placeholderTextColor={colors.muted}
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            returnKeyType="done"
          />
        </FormField>

        {/* Botão Salvar */}
        <Pressable
          style={({ pressed }) => [
            styles.botaoSalvar,
            { backgroundColor: salvando ? colors.muted : colors.primary },
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
          onPress={salvar}
          disabled={salvando}
        >
          <Text style={styles.botaoSalvarTexto}>
            {salvando ? "Salvando..." : "Salvar Instalação"}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.campo}>
      <Text style={[styles.campoLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      {children}
    </View>
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
  campo: {
    marginBottom: 16,
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
  dateDisplayText: {
    fontSize: 16,
  },
  inputMultilinha: {
    minHeight: 100,
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
    fontSize: 13,
    fontWeight: "600",
  },
  botaoSalvar: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  botaoSalvarTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
