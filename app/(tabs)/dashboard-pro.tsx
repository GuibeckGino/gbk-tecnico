import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useMonth, filtrarPorMes } from "@/context/MonthContext";
import { useColors } from "@/hooks/use-colors";
import { calcularDiasUteis, getPrimeiroDiaUtilMes, getUltimoDiaUtilMes } from "@/lib/dias-uteis";
import * as Haptics from "expo-haptics";

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

export default function DashboardProScreen() {
  const router = useRouter();
  const { instalacoes, paymentMode, monthlyGoal, adicionarInstalacao } = useInstallations();
  const { mes, ano, mesAnoFormatado } = useMonth();
  const colors = useColors();
  const [criandoRapido, setCriandoRapido] = useState(false);

  // Filtrar instalações do mês selecionado
  const instalacoesDoMes = filtrarPorMes(instalacoes, mes, ano);

  // Calcular todas as métricas
  function calcularMetricas() {
    const total = instalacoesDoMes.length;
    const hoje = new Date();
    const hoje_dia = hoje.getDate();
    const hoje_mes = hoje.getMonth() + 1;
    const hoje_ano = hoje.getFullYear();

    // Contar instalações de hoje
    const hojeFeZ = instalacoesDoMes.filter((inst) => {
      const [d, m, a] = inst.data.split("/");
      return parseInt(d) === hoje_dia && parseInt(m) === hoje_mes && parseInt(a) === hoje_ano;
    }).length;

    // Calcular valor total
    let valorTotal = 0;
    instalacoesDoMes.forEach((inst) => {
      if (inst.tipoServico === "Empresarial") {
        valorTotal += 100;
      } else {
        if (paymentMode === "fixo65") {
          valorTotal += 65;
        } else if (paymentMode === "fixo70") {
          valorTotal += 70;
        } else {
          valorTotal += total >= monthlyGoal ? 70 : 65;
        }
      }
    });

    // Contagem por tipo
    const porTipo = {
      instalacao: instalacoesDoMes.filter((i) => i.tipoServico === "Instalação").length,
      tipo3: instalacoesDoMes.filter((i) => i.tipoServico === "Tipo 3").length,
      mudanca: instalacoesDoMes.filter((i) => i.tipoServico === "Mudança").length,
      empresarial: instalacoesDoMes.filter((i) => i.tipoServico === "Empresarial").length,
    };

    // Calcular dias úteis
    const dataInicio = getPrimeiroDiaUtilMes(mes, ano);
    const dataFim = mes === hoje_mes && ano === hoje_ano ? new Date(hoje_ano, hoje_mes - 1, hoje_dia) : getUltimoDiaUtilMes(mes, ano);
    const dataFimTotal = getUltimoDiaUtilMes(mes, ano);

    const diasUteisPassados = calcularDiasUteis(dataInicio, dataFim);
    const diasUteisTotais = calcularDiasUteis(dataInicio, dataFimTotal);
    const diasUteisRestantes = Math.max(0, diasUteisTotais - diasUteisPassados);

    // Calcular metas e médias
    const faltam = Math.max(0, monthlyGoal - total);
    const metaDia = diasUteisRestantes > 0 ? Math.ceil(faltam / diasUteisRestantes) : 0;
    const mediaAtual = diasUteisPassados > 0 ? total / diasUteisPassados : 0;
    const mediaNecessaria = diasUteisTotais > 0 ? monthlyGoal / diasUteisTotais : 0;
    const projecao = Math.round(mediaAtual * diasUteisTotais);

    // Valor de hoje
    let valorHoje = 0;
    instalacoesDoMes.forEach((inst) => {
      const [d, m, a] = inst.data.split("/");
      if (parseInt(d) === hoje_dia && parseInt(m) === hoje_mes && parseInt(a) === hoje_ano) {
        if (inst.tipoServico === "Empresarial") {
          valorHoje += 100;
        } else {
          if (paymentMode === "fixo65") {
            valorHoje += 65;
          } else if (paymentMode === "fixo70") {
            valorHoje += 70;
          } else {
            valorHoje += total >= monthlyGoal ? 70 : 65;
          }
        }
      }
    });

    const projecaoValor = Math.round((valorTotal / Math.max(1, diasUteisPassados)) * diasUteisTotais);

    return {
      total,
      valorTotal,
      faltam,
      metaDia,
      mediaAtual,
      mediaNecessaria,
      projecao,
      projecaoValor,
      hojeFeZ,
      valorHoje,
      porTipo,
      diasUteisPassados,
      diasUteisRestantes,
      diasUteisTotais,
    };
  }

  const metricas = calcularMetricas();

  // Criar instalação rápida
  async function criarRapido() {
    setCriandoRapido(true);
    try {
      Alert.prompt(
        "Instalação Rápida",
        "Digite o nome do cliente:",
        [
          { text: "Cancelar", style: "cancel", onPress: () => setCriandoRapido(false) },
          {
            text: "Criar",
            onPress: async (cliente: string | undefined) => {
              if (!cliente || !cliente.trim()) {
                Alert.alert("Erro", "Digite um nome de cliente");
                setCriandoRapido(false);
                return;
              }

              const hoje = new Date();
              const data = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;

              try {
                await adicionarInstalacao({
                  cliente: cliente.trim(),
                  endereco: "Endereço não informado",
                  tipoServico: "Instalação",
                  data,
                  observacoes: "Criada via instalação rápida",
                });
                hapticSuccess();
                Alert.alert("Sucesso", "Instalação criada!");
              } catch (error) {
                Alert.alert("Erro", "Não foi possível criar a instalação");
              } finally {
                setCriandoRapido(false);
              }
            },
          },
        ]
      );
    } finally {
      setCriandoRapido(false);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      // Força re-render ao focar
    }, [])
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo Header */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 60, height: 60, borderRadius: 12 }}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.titulo, { color: colors.foreground }]}>Dashboard Profissional</Text>
          <Text style={[styles.subtitulo, { color: colors.muted }]}>{mesAnoFormatado}</Text>
        </View>

        {/* Card Principal */}
        <View style={[styles.cardPrincipal, { backgroundColor: colors.primary }]}>
          <View style={styles.cardRow}>
            <View>
              <Text style={[styles.cardLabel, { color: "rgba(255,255,255,0.8)" }]}>Total</Text>
              <Text style={[styles.cardValor, { color: "#ffffff" }]}>{metricas.total}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.cardLabel, { color: "rgba(255,255,255,0.8)" }]}>Valor</Text>
              <Text style={[styles.cardValor, { color: "#ffffff" }]}>R$ {metricas.valorTotal.toFixed(0)}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
          <View style={styles.cardRow}>
            <View>
              <Text style={[styles.cardLabel, { color: "rgba(255,255,255,0.8)" }]}>Meta</Text>
              <Text style={[styles.cardValor, { color: "#ffffff", fontSize: 24 }]}>{metricas.faltam}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.cardLabel, { color: "rgba(255,255,255,0.8)" }]}>Faltam</Text>
              <Text style={[styles.cardValor, { color: "#ffffff", fontSize: 24 }]}>{metricas.faltam}</Text>
            </View>
          </View>
        </View>

        {/* Botão Rápido */}
        <Pressable
          style={({ pressed }) => [
            styles.botaoRapido,
            { backgroundColor: colors.success, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={criarRapido}
          disabled={criandoRapido}
        >
          <Text style={styles.botaoRapidoTexto}>+ Rápido</Text>
        </Pressable>

        {/* Alerta de Meta */}
        {metricas.faltam > 0 && metricas.faltam <= 10 && (
          <View style={[styles.alerta, { backgroundColor: colors.warning }]}>
            <Text style={[styles.alertaTexto, { color: "#000" }]}>
              ⚠️ Faltam {metricas.faltam} instalações para meta
            </Text>
          </View>
        )}

        {/* Métricas Principais */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitulo, { color: colors.foreground }]}>Métricas do Dia</Text>
          <View style={styles.metricasGrid}>
            <View style={styles.metricaItem}>
              <Text style={[styles.metricaLabel, { color: colors.muted }]}>Hoje</Text>
              <Text style={[styles.metricaValor, { color: colors.foreground }]}>{metricas.hojeFeZ}</Text>
              <Text style={[styles.metricaSubtexto, { color: colors.muted }]}>R$ {metricas.valorHoje.toFixed(0)}</Text>
            </View>
            <View style={styles.metricaItem}>
              <Text style={[styles.metricaLabel, { color: colors.muted }]}>Meta/Dia</Text>
              <Text style={[styles.metricaValor, { color: colors.foreground }]}>{metricas.metaDia}</Text>
              <Text style={[styles.metricaSubtexto, { color: colors.muted }]}>instalações</Text>
            </View>
            <View style={styles.metricaItem}>
              <Text style={[styles.metricaLabel, { color: colors.muted }]}>Média Atual</Text>
              <Text style={[styles.metricaValor, { color: colors.foreground }]}>{metricas.mediaAtual.toFixed(1)}</Text>
              <Text style={[styles.metricaSubtexto, { color: colors.muted }]}>por dia</Text>
            </View>
            <View style={styles.metricaItem}>
              <Text style={[styles.metricaLabel, { color: colors.muted }]}>Média Necessária</Text>
              <Text style={[styles.metricaValor, { color: colors.foreground }]}>{metricas.mediaNecessaria.toFixed(1)}</Text>
              <Text style={[styles.metricaSubtexto, { color: colors.muted }]}>por dia</Text>
            </View>
          </View>
        </View>

        {/* Projeção */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitulo, { color: colors.foreground }]}>Projeção do Mês</Text>
          <View style={styles.projecaoRow}>
            <View>
              <Text style={[styles.projecaoLabel, { color: colors.muted }]}>Instalações</Text>
              <Text style={[styles.projecaoValor, { color: colors.foreground }]}>{metricas.projecao}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.projecaoLabel, { color: colors.muted }]}>Valor</Text>
              <Text style={[styles.projecaoValor, { color: colors.foreground }]}>R$ {metricas.projecaoValor.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* Dias */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitulo, { color: colors.foreground }]}>Dias Úteis</Text>
          <View style={styles.diasRow}>
            <View>
              <Text style={[styles.diasLabel, { color: colors.muted }]}>Trabalhados</Text>
              <Text style={[styles.diasValor, { color: colors.foreground }]}>{metricas.diasUteisPassados}</Text>
            </View>
            <View>
              <Text style={[styles.diasLabel, { color: colors.muted }]}>Restantes</Text>
              <Text style={[styles.diasValor, { color: colors.foreground }]}>{metricas.diasUteisRestantes}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.diasLabel, { color: colors.muted }]}>Total</Text>
              <Text style={[styles.diasValor, { color: colors.foreground }]}>{metricas.diasUteisTotais}</Text>
            </View>
          </View>
        </View>

        {/* Contador por Tipo */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitulo, { color: colors.foreground }]}>Por Tipo</Text>
          <View style={styles.tiposGrid}>
            <View style={styles.tipoItem}>
              <Text style={[styles.tipoLabel, { color: colors.muted }]}>Instalação</Text>
              <Text style={[styles.tipoValor, { color: colors.foreground }]}>{metricas.porTipo.instalacao}</Text>
            </View>
            <View style={styles.tipoItem}>
              <Text style={[styles.tipoLabel, { color: colors.muted }]}>Tipo 3</Text>
              <Text style={[styles.tipoValor, { color: colors.foreground }]}>{metricas.porTipo.tipo3}</Text>
            </View>
            <View style={styles.tipoItem}>
              <Text style={[styles.tipoLabel, { color: colors.muted }]}>Mudança</Text>
              <Text style={[styles.tipoValor, { color: colors.foreground }]}>{metricas.porTipo.mudanca}</Text>
            </View>
            <View style={styles.tipoItem}>
              <Text style={[styles.tipoLabel, { color: colors.muted }]}>Empresarial</Text>
              <Text style={[styles.tipoValor, { color: colors.foreground }]}>{metricas.porTipo.empresarial}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    marginBottom: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
  },
  cardPrincipal: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  cardValor: {
    fontSize: 32,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  botaoRapido: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  botaoRapidoTexto: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  alerta: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  alertaTexto: {
    fontWeight: "600",
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  metricasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricaItem: {
    width: "48%",
    paddingVertical: 8,
  },
  metricaLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricaValor: {
    fontSize: 20,
    fontWeight: "700",
  },
  metricaSubtexto: {
    fontSize: 11,
    marginTop: 2,
  },
  projecaoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  projecaoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  projecaoValor: {
    fontSize: 24,
    fontWeight: "700",
  },
  diasRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  diasLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  diasValor: {
    fontSize: 20,
    fontWeight: "700",
  },
  tiposGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  tipoItem: {
    width: "48%",
    paddingVertical: 8,
  },
  tipoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  tipoValor: {
    fontSize: 20,
    fontWeight: "700",
  },
});
