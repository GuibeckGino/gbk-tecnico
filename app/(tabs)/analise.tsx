import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  FlatList,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useMonth } from "@/context/MonthContext";
import { useColors } from "@/hooks/use-colors";
import {
  analisarSemanal,
  analisarPorCliente,
  analisarMesAMes,
  analisarRentabilidade,
  analisarTendencias,
} from "@/lib/analytics";
import { calcularMetaStats, formatarMetaDia } from "@/lib/dias-uteis";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";

type AbaAnalise =
  | "meta"
  | "semanal"
  | "cliente"
  | "mesames"
  | "rentabilidade"
  | "tendencias";

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function AnaliseScreen() {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano } = useMonth();
  const colors = useColors();
  const [abaSelecionada, setAbaSelecionada] = useState<AbaAnalise>("meta");
  const [metaStats, setMetaStats] = useState({
    diasUteisPassados: 0,
    diasUteisRestantes: 0,
    diasUteisTotais: 0,
    metaDia: 0,
    mediadiaria: 0,
    projecao: 0,
    hojeFeZ: 0,
  });

  useFocusEffect(
    React.useCallback(() => {
      const instalacoesDoMes = instalacoes.filter((inst) => {
        const [, m, a] = inst.data.split("/");
        return parseInt(m) === mes + 1 && parseInt(a) === ano;
      });

      const hoje = new Date();
      const hojeFormatado = `${String(hoje.getDate()).padStart(2, "0")}/${String(
        hoje.getMonth() + 1
      ).padStart(2, "0")}/${hoje.getFullYear()}`;

      const hojeFeZ = instalacoes.filter((inst) => inst.data === hojeFormatado)
        .length;

      const stats = calcularMetaStats(
        instalacoesDoMes.length,
        mes,
        ano,
        hojeFeZ
      );
      setMetaStats(stats);
    }, [instalacoes, mes, ano])
  );

  // Memoizar análises para evitar recálculos desnecessários
  const analisesSemanal = useMemo(
    () => analisarSemanal(instalacoes),
    [instalacoes]
  );
  const analisesPorCliente = useMemo(
    () => analisarPorCliente(instalacoes),
    [instalacoes]
  );
  const analisesMesAMes = useMemo(
    () => analisarMesAMes(instalacoes),
    [instalacoes]
  );
  const analisesRentabilidade = useMemo(
    () => analisarRentabilidade(instalacoes),
    [instalacoes]
  );
  const analisestendencias = useMemo(
    () => analisarTendencias(instalacoes),
    [instalacoes]
  );

  const instalacoesDoMes = useMemo(
    () =>
      instalacoes.filter((inst) => {
        const [, m, a] = inst.data.split("/");
        return parseInt(m) === mes + 1 && parseInt(a) === ano;
      }),
    [instalacoes, mes, ano]
  );

  const renderAbaButton = useCallback(
    (aba: AbaAnalise, label: string) => (
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
          {label}
        </Text>
      </Pressable>
    ),
    [abaSelecionada, colors]
  );

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.titulo, { color: colors.foreground }]}>
            Análise
          </Text>
        </View>

        {/* Abas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[
            styles.abasContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {renderAbaButton("meta", "Meta")}
          {renderAbaButton("semanal", "Semanal")}
          {renderAbaButton("cliente", "Por Cliente")}
          {renderAbaButton("rentabilidade", "Rentabilidade")}
          {renderAbaButton("tendencias", "Tendências")}
          {renderAbaButton("mesames", "Mês a Mês")}
        </ScrollView>

        {/* Conteúdo Meta */}
        {abaSelecionada === "meta" && (
          <View style={styles.conteudo}>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.cardTitulo, { color: "#ffffff" }]}>
                Meta do Mês
              </Text>
              <Text
                style={[
                  styles.cardValor,
                  { color: "#ffffff", fontSize: 32, marginTop: 8 },
                ]}
              >
                {instalacoesDoMes.length}/104
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  { color: "rgba(255,255,255,0.8)", marginTop: 8 },
                ]}
              >
                {Math.max(0, 104 - instalacoesDoMes.length)} faltam
              </Text>
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.cardTitulo, { color: colors.foreground }]}>
                Estatísticas
              </Text>
              <View style={{ marginTop: 12 }}>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>
                    Dias úteis restantes
                  </Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {metaStats.diasUteisRestantes}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>
                    Meta por dia
                  </Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {metaStats.metaDia}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>
                    Hoje fez
                  </Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {metaStats.hojeFeZ}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>
                    Média diária
                  </Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {metaStats.mediadiaria.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>
                    Projeção do mês
                  </Text>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {metaStats.projecao}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
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
              <Text style={[styles.vazio, { color: colors.muted }]}>
                Sem dados para exibir
              </Text>
            ) : (
              analisesSemanal.map((analise, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text
                      style={[styles.cardTitulo, { color: colors.foreground }]}
                    >
                      Semana {analise.semana} de {analise.ano}
                    </Text>
                    <Text style={[styles.cardValor, { color: colors.primary }]}>
                      R$ {analise.valorTotal.toLocaleString("pt-BR")}
                    </Text>
                  </View>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    {analise.totalInstalacoes} instalação
                    {analise.totalInstalacoes !== 1 ? "ões" : ""}
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
              <Text style={[styles.vazio, { color: colors.muted }]}>
                Sem dados para exibir
              </Text>
            ) : (
              analisesPorCliente.map((analise, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text
                      style={[styles.cardTitulo, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {analise.cliente}
                    </Text>
                    <Text style={[styles.cardValor, { color: colors.primary }]}>
                      R$ {analise.valorTotal.toLocaleString("pt-BR")}
                    </Text>
                  </View>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    {analise.totalInstalacoes} instalação
                    {analise.totalInstalacoes !== 1 ? "ões" : ""}
                  </Text>
                  <Text
                    style={[styles.cardSub, { color: colors.muted, marginTop: 6 }]}
                  >
                    Última: {analise.ultimaInstalacao}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Conteúdo Rentabilidade */}
        {abaSelecionada === "rentabilidade" && (
          <View style={styles.conteudo}>
            {analisesRentabilidade.length === 0 ? (
              <Text style={[styles.vazio, { color: colors.muted }]}>
                Sem dados para exibir
              </Text>
            ) : (
              analisesRentabilidade.map((analise, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text
                      style={[styles.cardTitulo, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {analise.cliente}
                    </Text>
                    <Text style={[styles.cardValor, { color: colors.primary }]}>
                      R$ {analise.valorTotal.toLocaleString("pt-BR")}
                    </Text>
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: colors.muted }]}>
                        Total de Instalações
                      </Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: colors.foreground },
                        ]}
                      >
                        {analise.totalInstalacoes}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: colors.muted }]}>
                        Valor Médio
                      </Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: colors.foreground },
                        ]}
                      >
                        R$ {analise.valorMedio.toFixed(0)}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: colors.muted }]}>
                        Frequência/Mês
                      </Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: colors.foreground },
                        ]}
                      >
                        {analise.frequencia.toFixed(1)}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: colors.muted }]}>
                        Última Instalação
                      </Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: colors.foreground },
                        ]}
                      >
                        {analise.ultimaInstalacao}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Conteúdo Tendências */}
        {abaSelecionada === "tendencias" && (
          <View style={styles.conteudo}>
            {analisestendencias.length === 0 ? (
              <Text style={[styles.vazio, { color: colors.muted }]}>
                Sem dados para exibir
              </Text>
            ) : (
              analisestendencias.map((analise, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text
                        style={[
                          styles.cardTitulo,
                          { color: colors.foreground },
                        ]}
                      >
                        {analise.periodo}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color:
                              analise.tendencia === "crescente"
                                ? colors.success
                                : analise.tendencia === "decrescente"
                                ? colors.error
                                : colors.muted,
                            marginRight: 6,
                          }}
                        >
                          {analise.tendencia === "crescente"
                            ? "↑ Crescente"
                            : analise.tendencia === "decrescente"
                            ? "↓ Decrescente"
                            : "→ Estável"}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.cardValor, { color: colors.primary }]}>
                      R$ {analise.valorTotal.toLocaleString("pt-BR")}
                    </Text>
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: colors.muted }]}>
                        Instalações
                      </Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: colors.foreground },
                        ]}
                      >
                        {analise.totalInstalacoes}
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: colors.muted }]}>
                        Média Móvel
                      </Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: colors.foreground },
                        ]}
                      >
                        R$ {analise.mediaMovel.toFixed(0)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Conteúdo Mês a Mês */}
        {abaSelecionada === "mesames" && (
          <View style={styles.conteudo}>
            {analisesMesAMes.length === 0 ? (
              <Text style={[styles.vazio, { color: colors.muted }]}>
                Sem dados para exibir
              </Text>
            ) : (
              analisesMesAMes.map((analise, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text
                      style={[styles.cardTitulo, { color: colors.foreground }]}
                    >
                      {new Date(analise.ano, analise.mes - 1).toLocaleDateString(
                        "pt-BR",
                        {
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </Text>
                    <Text style={[styles.cardValor, { color: colors.primary }]}>
                      R$ {analise.valorTotal.toLocaleString("pt-BR")}
                    </Text>
                  </View>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    {analise.totalInstalacoes} instalação
                    {analise.totalInstalacoes !== 1 ? "ões" : ""}
                  </Text>
                  {analise.crescimento !== 0 && (
                    <Text
                      style={[
                        styles.cardSub,
                        {
                          color:
                            analise.crescimento > 0
                              ? colors.success
                              : colors.error,
                          marginTop: 6,
                        },
                      ]}
                    >
                      {analise.crescimento > 0 ? "↑" : "↓"}{" "}
                      {Math.abs(analise.crescimento).toFixed(1)}% vs mês
                      anterior
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
  },
  abasContainer: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  abaItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  abaTexto: {
    fontSize: 13,
    fontWeight: "600",
  },
  conteudo: {
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardValor: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardSub: {
    fontSize: 13,
    marginTop: 4,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  vazio: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 20,
  },
});
