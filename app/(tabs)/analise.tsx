import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useColors } from "@/hooks/use-colors";
import { analisarSemanal, analisarPorCliente, analisarMesAMes } from "@/lib/analytics";
import * as Haptics from "expo-haptics";
import { useState } from "react";

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function AnaliseScreen() {
  const { instalacoes } = useInstallations();
  const colors = useColors();
  const [abaSelecionada, setAbaSelecionada] = useState<"semanal" | "cliente" | "mesames">("semanal");

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
          {(["semanal", "cliente", "mesames"] as const).map((aba) => (
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
                {aba === "semanal" ? "Semanal" : aba === "cliente" ? "Por Cliente" : "Mês a Mês"}
              </Text>
            </Pressable>
          ))}
        </View>

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
});
