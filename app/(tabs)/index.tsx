import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function DashboardScreen() {
  const { stats, carregando } = useInstallations();
  const colors = useColors();
  const router = useRouter();

  const mesAtual = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  if (carregando) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appTitle, { color: colors.primary }]}>
            GBK Técnico
          </Text>
          <Text style={[styles.mesLabel, { color: colors.muted }]}>
            {mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1)}
          </Text>
        </View>

        {/* Card Principal */}
        <View
          style={[
            styles.cardPrincipal,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={styles.cardPrincipalLabel}>Total de Instalações</Text>
          <Text style={styles.cardPrincipalNumero}>{stats.total}</Text>
          <View style={styles.separador} />
          <Text style={styles.cardPrincipalLabel}>Valor Total a Receber</Text>
          <Text style={styles.cardPrincipalValor}>
            R$ {stats.valorTotal.toLocaleString("pt-BR")}
          </Text>
          <Text style={styles.cardPrincipalTarifa}>
            R$ {stats.valorIndividual}/instalação
          </Text>
        </View>

        {/* Mini-cards por tipo */}
        <Text style={[styles.secaoTitulo, { color: colors.foreground }]}>
          Por Tipo de Serviço
        </Text>
        <View style={styles.miniCardsRow}>
          <MiniCard
            label="Instalação"
            valor={stats.porTipo.instalacao}
            cor="#1565C0"
            corTexto="#fff"
          />
          <MiniCard
            label="Tipo 3"
            valor={stats.porTipo.tipo3}
            cor="#0D47A1"
            corTexto="#fff"
          />
          <MiniCard
            label="Mudança"
            valor={stats.porTipo.mudanca}
            cor="#1976D2"
            corTexto="#fff"
          />
        </View>

        {/* Indicador de tarifa */}
        {stats.total > 0 && stats.total < 104 && (
          <View
            style={[
              styles.alertaTarifa,
              { backgroundColor: colors.surface, borderColor: colors.warning },
            ]}
          >
            <Text style={[styles.alertaTarifaTexto, { color: colors.warning }]}>
              Faltam {104 - stats.total} instalações para atingir R$70/cada
            </Text>
          </View>
        )}
        {stats.total >= 104 && (
          <View
            style={[
              styles.alertaTarifa,
              { backgroundColor: colors.surface, borderColor: colors.success },
            ]}
          >
            <Text style={[styles.alertaTarifaTexto, { color: colors.success }]}>
              Meta atingida! Todas as instalações valem R$70
            </Text>
          </View>
        )}

        {/* Botões de ação */}
        <View style={styles.botoesContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.botaoPrimario,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => {
              haptic();
              router.push("/novo-cadastro" as never);
            }}
          >
            <Text style={styles.botaoPrimarioTexto}>+ Novo Cadastro</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.botaoSecundario,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primary,
              },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => {
              haptic();
              router.push("/historico" as never);
            }}
          >
            <Text style={[styles.botaoSecundarioTexto, { color: colors.primary }]}>
              Ver Histórico
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function MiniCard({
  label,
  valor,
  cor,
  corTexto,
}: {
  label: string;
  valor: number;
  cor: string;
  corTexto: string;
}) {
  return (
    <View style={[styles.miniCard, { backgroundColor: cor }]}>
      <Text style={[styles.miniCardNumero, { color: corTexto }]}>{valor}</Text>
      <Text style={[styles.miniCardLabel, { color: corTexto }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  mesLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  cardPrincipal: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardPrincipalLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  cardPrincipalNumero: {
    color: "#fff",
    fontSize: 56,
    fontWeight: "800",
    lineHeight: 68,
  },
  separador: {
    width: "80%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginVertical: 12,
  },
  cardPrincipalValor: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
  },
  cardPrincipalTarifa: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    marginTop: 4,
  },
  secaoTitulo: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  miniCardsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  miniCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  miniCardNumero: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  miniCardLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
  alertaTarifa: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  alertaTarifaTexto: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  botoesContainer: {
    gap: 12,
    marginTop: 4,
  },
  botaoPrimario: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  botaoPrimarioTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  botaoSecundario: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
  },
  botaoSecundarioTexto: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
