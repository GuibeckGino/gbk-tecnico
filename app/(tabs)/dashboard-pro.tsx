import React, { useState, useMemo } from 'react';
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
import { calcularStats, calcularValorPorTipo } from "@/types/installation";
import { useMonthlyConfig } from "@/hooks/use-monthly-config";
import { useWorkSchedule } from "@/context/WorkScheduleContext";
import { useMetaMilestones } from "@/hooks/use-meta-milestones";
import { Toast } from "@/components/toast";

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
  const [showToast, setShowToast] = useState(false);
  const { workDays } = useWorkSchedule();
  
  // Carregar configurações do mês (paymentMode e monthlyGoal)
  useMonthlyConfig();
  
  // Chave única para o mês (para rastrear milestones)
  const monthKey = `${ano}-${String(mes + 1).padStart(2, '0')}`;


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

    // Calcular valor total usando calcularStats
    const stats = calcularStats(instalacoesDoMes, paymentMode);
    const valorTotal = stats.valorTotal;

    // Contagem por tipo
    const porTipo = {
      instalacao: instalacoesDoMes.filter((i) => i.tipoServico === "Instalação").length,
      tipo3: instalacoesDoMes.filter((i) => i.tipoServico === "Tipo 3").length,
      mudanca: instalacoesDoMes.filter((i) => i.tipoServico === "Mudança").length,
      empresarial: instalacoesDoMes.filter((i) => i.tipoServico === "Empresarial").length,
    };

    // Calcular dias úteis com dias de trabalho customizados (mes é 0-based, converter para 1-based)
    const dataInicio = getPrimeiroDiaUtilMes(mes + 1, ano, workDays);
    const dataFim = mes === hoje_mes - 1 && ano === hoje_ano ? new Date(hoje_ano, mes, hoje_dia) : getUltimoDiaUtilMes(mes + 1, ano, workDays);
    const dataFimTotal = getUltimoDiaUtilMes(mes + 1, ano, workDays);

    const diasUteisPassados = calcularDiasUteis(dataInicio, dataFim, workDays);
    const diasUteisTotais = calcularDiasUteis(dataInicio, dataFimTotal, workDays);
    const diasUteisRestantes = Math.max(0, diasUteisTotais - diasUteisPassados);

    // IMPORTANTE: monthlyGoal é em QUANTIDADE de instalações
    // Converter para VALOR baseado no modo de pagamento
    const metaValor = monthlyGoal * calcularValorPorTipo('Instalação', total, paymentMode);
    const faltamValor = Math.max(0, metaValor - valorTotal);
    const faltamQuantidade = Math.max(0, monthlyGoal - total);
    
    // Meta por dia em VALOR (não quantidade)
    const metaDiaValor = diasUteisRestantes > 0 ? Math.ceil(faltamValor / diasUteisRestantes) : 0;
    
    const mediaAtual = diasUteisPassados > 0 ? total / diasUteisPassados : 0;
    const mediaNecessaria = diasUteisTotais > 0 ? monthlyGoal / diasUteisTotais : 0;
    const projecao = Math.round(mediaAtual * diasUteisTotais);

    // Valor de hoje
    const instalacoesHoje = instalacoesDoMes.filter((inst) => {
      const [d, m, a] = inst.data.split("/");
      return parseInt(d) === hoje_dia && parseInt(m) === hoje_mes && parseInt(a) === hoje_ano;
    });
    const statsHoje = calcularStats(instalacoesHoje, paymentMode);
    const valorHoje = statsHoje.valorTotal;

    const projecaoValor = Math.round((valorTotal / Math.max(1, diasUteisPassados)) * diasUteisTotais);
    
    // Calcular percentual para detectar milestones
    const percentualMeta = monthlyGoal > 0 ? (total / monthlyGoal) * 100 : 0;

    return {
      total,
      valorTotal,
      faltamQuantidade,
      faltamValor,
      metaDiaValor,
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
      percentualMeta,
    };
  }

  const metricas = calcularMetricas();
  
  // Hook para detectar milestones de meta
  const { newMilestoneReached, dismissMilestone } = useMetaMilestones(
    metricas.total,
    monthlyGoal,
    monthKey
  );
  
  // Mostrar toast quando milestone for atingido
  React.useEffect(() => {
    if (newMilestoneReached) {
      setShowToast(true);
    }
  }, [newMilestoneReached]);

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
      {showToast && newMilestoneReached && (
        <Toast
          message={newMilestoneReached.message}
          type="success"
          duration={4000}
          onDismiss={() => {
            setShowToast(false);
            dismissMilestone();
          }}
        />
      )}
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
              <Text style={[styles.cardValor, { color: "#ffffff", fontSize: 24 }]}>R$ {(monthlyGoal * calcularValorPorTipo('Instalação', metricas.total, paymentMode)).toLocaleString('pt-BR')}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.cardLabel, { color: "rgba(255,255,255,0.8)" }]}>Faltam</Text>
              <Text style={[styles.cardValor, { color: "#ffffff", fontSize: 24 }]}>R$ {metricas.faltamValor.toLocaleString('pt-BR')}</Text>
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
        {metricas.faltamQuantidade > 0 && metricas.faltamQuantidade <= 10 && (
          <View style={[styles.alerta, { backgroundColor: colors.warning }]}>
            <Text style={[styles.alertaTexto, { color: "#000" }]}>
              ⚠️ Faltam R$ {metricas.faltamValor.toLocaleString('pt-BR')} para meta
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
              <Text style={[styles.metricaValor, { color: colors.foreground }]}>R$ {metricas.metaDiaValor}</Text>
              <Text style={[styles.metricaSubtexto, { color: colors.muted }]}></Text>
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
