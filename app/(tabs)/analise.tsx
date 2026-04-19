import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useMonth } from "@/context/MonthContext";
import { useColors } from "@/hooks/use-colors";
import { analisarSemanal, analisarPorCliente, analisarMesAMes } from "@/lib/analytics";
import { calcularMetaStats, formatarMetaDia } from "@/lib/dias-uteis";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function AnaliseScreen() {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano } = useMonth();
  const colors = useColors();
  const [abaSelecionada, setAbaSelecionada] = useState<"semanal" | "cliente" | "mesames" | "meta">("meta");
  const [metaStats, setMetaStats] = useState({
    diasUteisPassados: 0,
    diasUteisRestantes: 0,
    diasUteisTotais: 0,
    metaDia: 0,
    mediadiaria: 0,
    projecao: 0,
    hojeFeZ: 0,
  });

  useFocusEffect(() => {
    const instalacoesDoMes = instalacoes.filter((inst) => {
      const [d, m, a] = inst.data.split("/");
      return parseInt(m) === mes && parseInt(a) === ano;
    });

    const hojeFeZ = instalacoes.filter((inst) => {
      const hoje = new Date();
      const hojeFormatado = `${String(hoje.getDate()).padStart(2, "0")}/${String(
        hoje.getMonth() + 1
      ).padStart(2, "0")}/${hoje.getFullYear()}`;
      return inst.data === hojeFormatado;
    }).length;

    const stats = calcularMetaStats(instalacoesDoMes.length, mes, ano, hojeFeZ);
    setMetaStats(stats);
  });

  const analisesSemanal = analisarSemanal(instalacoes);
  const analisesPorCliente = analisarPorCliente(instalacoes);
  const analisesMesAMes = analisarMesAMes(instalacoes);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.titulo, { color: colors.foreground }]}>Análise</Text>
        </View>

        {/* Abas */}
        <View style={[styles.abasContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(["meta", "semanal", "cliente", "mesames"] as const).map((aba) => (
            <Pressable
              key={aba}
              style={[
                styles.abaItem,
                abaSelecionada === aba
                  ? { borderBottomColor: colors.primary, borderBottomWidth: 3 }
                  : { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
              onPress={() => {
                haptic();
                setAbaSelecionada(aba);
              }}
            >
              <Text
                style={[
                  styles.abaTexto,
                  {
                    color: abaSelecionada === aba ? colors.primary : colors.muted,
                    fontWeight: abaSelecionada === aba ? "700" : "600",
                  },
                ]}
              >
                {aba === "meta" ? "Meta" : aba === "semanal" ? "Semanal" : aba === "cliente" ? "Por Cliente" : "Mês a Mês"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Conteúdo Meta */}
        {abaSelecionada === "meta" && (
          <View style={styles.conteudo}>
            <View style={[styles.card, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={[styles.cardTitulo, { color: "#ffffff" }]}>Meta do Mês</Text>
              <Text style={[styles.cardValor, { color: "#ffffff", fontSize: 32, marginTop: 8 }]}>
                {instalacoes.filter((inst) => {
                  const [d, m, a] = inst.data.split("/");
                  return parseInt(m) === mes && parseInt(a) === ano;
                }).length}/104
              </Text>
              <Text style={[styles.cardSub, { color: "rgba(255,255,255,0.8)", marginTop: 8 }]}>
                {Math.max(0, 104 - instalacoes.filter((inst) => {
                  const [d, m, a] = inst.data.split("/");
                  return parseInt(m) === mes && parseInt(a) === ano;
                }).length)} faltam
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitulo, { color: colors.foreground }]}>Estatísticas</Text>
              <View style={{ marginTop: 12 }}>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Dias úteis restantes</Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{metaStats.diasUteisRestantes}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Meta por dia</Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{metaStats.metaDia}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Hoje fez</Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{metaStats.hojeFeZ}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Média diária</Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{metaStats.mediadiaria.toFixed(1)}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>Projeção do mês</Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{metaStats.projecao}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitulo, { color: colors.foreground }]}>
                {formatarMetaDia(metaStats.metaDia)}
              </Text>
            </View>
          </View>
        )}

        {/* Conteúdo Semanal */}
        {abaSelecionada === "semanal" && (
          <View style={styles.conteudo}>
            {analisesSemanal.length === 0 ? (
              <Text style={[styles.vazio, { color: colors.muted }]}>Sem dados para exibir</Text>
            ) : (
              analisesSemanal.map((analise, idx) => (
                <View
                  key={idx}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitulo, { color: colors.foreground }]}>
                      Semana {analise.semana} de {analise.ano}
                    </Text>
                    <Text style={[styles.cardValor, { color: colors.primary }]}>
                      R$ {(analise.valorTotal).toLocaleString("pt-BR")}
                    </Text>
                  </View>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    {analise.totalInstalacoes} instalação{analise.totalInstalacoes !== 1 ? "ões" : ""}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Conteúdo Por Cliente */}
        {abaSelecionada === "cliente" && (
          <View style={styles.conteudo}>
            {analisesPorCliente.length === 0 ? (
              <Text style={[styles.vazio, { color: colors.muted }]}>Sem dados para exibir</Text>
            ) : (
              analisesPorCliente.map((analise, idx) => (
                <View
                  key={idx}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitulo, { color: colors.foreground }]} numberOfLines={1}>
                      {analise.cliente}
                    </Text>
                    <Text style={[styles.cardValor, { color: colors.primary }]}>
                      R$ {(analise.valorTotal).toLocaleString("pt-BR")}
                    </Text>
                  </View>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    {analise.totalInstalacoes} instalação{analise.totalInstalacoes !== 1 ? "ões" : ""}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.muted, marginTop: 6 }]}>
                    Última: {analise.ultimaInstalacao}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Conteúdo Mês a Mês */}
        {abaSelecionada === "mesames" && (
          <View style={styles.conteudo}>
            {analisesMesAMes.length === 0 ? (
              <Text style={[styles.vazio, { color: colors.muted }]}>Sem dados para exibir</Text>
            ) : (
              analisesMesAMes.map((analise, idx) => (
                <View
                  key={idx}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitulo, { color: colors.foreground }]}>
                      {new Date(analise.ano, analise.mes - 1).toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                    <Text style={[styles.cardValor, { color: colors.primary }]}>
                      R$ {(analise.valorTotal).toLocaleString("pt-BR")}
                    </Text>
                  </View>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    {analise.totalInstalacoes} instalação{analise.totalInstalacoes !== 1 ? "ões" : ""}
                  </Text>
                  {analise.crescimento !== 0 && (
                    <Text
                      style={[
                        styles.cardSub,
                        {
                          color: analise.crescimento > 0 ? colors.success : colors.error,
                          marginTop: 6,
                        },
                      ]}
                    >
                      {analise.crescimento > 0 ? "↑" : "↓"} {Math.abs(analise.crescimento).toFixed(1)}% vs mês anterior
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
  },
  abasContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  abaItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  abaTexto: {
    fontSize: 13,
  },
  conteudo: {
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  cardValor: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  vazio: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 32,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
