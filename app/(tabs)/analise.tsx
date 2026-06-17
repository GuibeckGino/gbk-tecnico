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
  analisarDiaADia,
  calcularPrevisaoFechamento,
  calcularAlertasDesempenho,
  compararHistorico,
} from "@/lib/analytics";
import {
  analisarProdutividadePorDia,
  gerarResumoTextual,
} from "@/lib/productivity-analytics";
import { calcularDiasUteis, getPrimeiroDiaUtilMes, getUltimoDiaUtilMes } from "@/lib/dias-uteis";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { useMonthlyConfig } from "@/hooks/use-monthly-config";
import { useWorkSchedule } from "@/context/WorkScheduleContext";
import { calcularStats, calcularValorPorTipo } from "@/types/installation";
import { LineChart } from "react-native-chart-kit";
import { CalendarView } from "@/components/calendar-view";

type AbaAnalise =
  | "meta"
  | "semanal"
  | "cliente"
  | "mesames"
  | "rentabilidade"
  | "tendencias"
  | "produtividade"
  | "diaadia";

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function AnaliseScreen() {
  const { instalacoes, paymentMode, monthlyGoal } = useInstallations();
  const { mes, ano } = useMonth();
  const colors = useColors();
  const [abaSelecionada, setAbaSelecionada] = useState<AbaAnalise>("meta");
  const [filtroMeses, setFiltroMeses] = useState<3 | 6 | 12>(6); // Filtro para Dia a Dia
  const { workDays } = useWorkSchedule();
  
  // Carregar configurações do mês (paymentMode e monthlyGoal)
  useMonthlyConfig();
  
  const [metaStats, setMetaStats] = useState({
    diasUteisPassados: 0,
    diasUteisRestantes: 0,
    diasUteisTotais: 0,
    metaDiaValor: 0,
    faltamValor: 0,
    faltamQuantidade: 0,
    mediadiaria: 0,
    projecao: 0,
    hojeFeZ: 0,
    valorTotal: 0,
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

      // Calcular stats com valor total
      const stats = calcularStats(instalacoesDoMes, paymentMode);
      const valorTotal = stats.valorTotal;
      const total = instalacoesDoMes.length;

      // Calcular dias úteis com dias de trabalho customizados (mes é 0-based, converter para 1-based)
      const dataInicio = getPrimeiroDiaUtilMes(mes + 1, ano, workDays);
      const dataFim = mes === hoje.getMonth() && ano === hoje.getFullYear()
        ? new Date(hoje.getFullYear(), mes, hoje.getDate())
        : getUltimoDiaUtilMes(mes + 1, ano, workDays);
      const dataFimTotal = getUltimoDiaUtilMes(mes + 1, ano, workDays);

      const diasUteisPassados = calcularDiasUteis(dataInicio, dataFim, workDays);
      const diasUteisTotais = calcularDiasUteis(dataInicio, dataFimTotal, workDays);
      const diasUteisRestantes = Math.max(0, diasUteisTotais - diasUteisPassados);

      // IMPORTANTE: monthlyGoal é em QUANTIDADE de instalações
      // Converter para VALOR baseado no modo de pagamento
      const metaValor = monthlyGoal * calcularValorPorTipo('Instalação', monthlyGoal, paymentMode);
      const faltamValor = Math.max(0, metaValor - valorTotal);
      const faltamQuantidade = Math.max(0, monthlyGoal - total);
      
      // Meta por dia em VALOR (não quantidade)
      const metaDiaValor = diasUteisRestantes > 0 ? Math.ceil(faltamValor / diasUteisRestantes) : 0;
      
      const mediadiaria = diasUteisPassados > 0 ? total / diasUteisPassados : 0;
      const projecao = Math.round(mediadiaria * diasUteisTotais);

      setMetaStats({
        diasUteisPassados,
        diasUteisRestantes,
        diasUteisTotais,
        metaDiaValor,
        faltamValor,
        faltamQuantidade,
        mediadiaria,
        projecao,
        hojeFeZ,
        valorTotal,
      });
    }, [instalacoes, mes, ano, paymentMode, monthlyGoal, workDays])
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
  const analisesDiaADia = useMemo(
    () => analisarDiaADia(instalacoes, filtroMeses),
    [instalacoes, filtroMeses]
  );

  const instalacoesDoMes = useMemo(
    () =>
      instalacoes.filter((inst) => {
        const [, m, a] = inst.data.split("/");
        return parseInt(m) === mes + 1 && parseInt(a) === ano;
      }),
    [instalacoes, mes, ano]
  );
  const previsaoFechamento = useMemo(
    () => calcularPrevisaoFechamento(instalacoesDoMes, monthlyGoal),
    [instalacoesDoMes, monthlyGoal]
  );
  const alertasDesempenho = useMemo(
    () => calcularAlertasDesempenho(previsaoFechamento, monthlyGoal),
    [previsaoFechamento, monthlyGoal]
  );
  const comparacaoHistorica = useMemo(
    () => compararHistorico(instalacoes, mes + 1, ano),
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
          {renderAbaButton("produtividade", "Produtividade")}
          {renderAbaButton("diaadia", "Dia a Dia")}
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
                R$ {metaStats.valorTotal.toLocaleString('pt-BR')} / R$ {(monthlyGoal * calcularValorPorTipo('Instalação', instalacoesDoMes.length, paymentMode)).toLocaleString('pt-BR')}
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  { color: "rgba(255,255,255,0.8)", marginTop: 8 },
                ]}
              >
                R$ {metaStats.faltamValor.toLocaleString('pt-BR')} faltam
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  { color: "rgba(255,255,255,0.8)", marginTop: 4 },
                ]}
              >
                {metaStats.faltamQuantidade} instalação{metaStats.faltamQuantidade !== 1 ? 'ões' : ''}
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
                    R$ {metaStats.metaDiaValor}
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
                {metaStats.metaDiaValor === 0 ? '🎉 Meta atingida!' : `Faltam R$ ${metaStats.faltamValor.toLocaleString('pt-BR')} para a meta`}
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

        {/* Conteúdo Produtividade */}
        {abaSelecionada === "produtividade" && (
          <View style={styles.conteudo}>
            {instalacoesDoMes.length === 0 ? (
              <Text style={[styles.vazio, { color: colors.muted }]}>
                Sem dados para exibir
              </Text>
            ) : (
              <View>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cardTitulo,
                      { color: colors.foreground, marginBottom: 12 },
                    ]}
                  >
                    Produtividade por Dia
                  </Text>
                  <Text
                    style={[
                      styles.cardSub,
                      { color: colors.muted, lineHeight: 20 },
                    ]}
                  >
                    {gerarResumoTextual(
                      analisarProdutividadePorDia(instalacoesDoMes, mes, ano)
                    )}
                  </Text>
                </View>
                {analisarProdutividadePorDia(instalacoesDoMes, mes, ano).days.map(
                  (dia, idx) => (
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
                          style={[
                            styles.cardTitulo,
                            { color: colors.foreground },
                          ]}
                        >
                          {dia.day}
                        </Text>
                        <Text
                          style={[
                            styles.cardValor,
                            { color: colors.primary, fontSize: 18 },
                          ]}
                        >
                          {dia.installations}
                        </Text>
                      </View>
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.muted }]}>
                          Valor Total
                        </Text>
                        <Text
                          style={[
                            styles.statValue,
                            { color: colors.foreground },
                          ]}
                        >
                          R$ {dia.totalValue.toLocaleString("pt-BR")}
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
                          R$ {dia.averageValue.toFixed(0)}
                        </Text>
                      </View>
                      <View style={styles.statRow}>
                        <Text style={[styles.statLabel, { color: colors.muted }]}>
                          Percentual
                        </Text>
                        <Text
                          style={[
                            styles.statValue,
                            { color: colors.foreground },
                          ]}
                        >
                          {dia.percentage.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  )
                )}
              </View>
            )}
          </View>
        )}

        {/* Conteúdo Dia a Dia */}
        {abaSelecionada === "diaadia" && (
          <View style={styles.conteudo}>
            {analisesDiaADia.length === 0 ? (
              <Text style={[styles.vazio, { color: colors.muted }]}>
                Sem dados para exibir
              </Text>
            ) : (
              <View>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                  {[3, 6, 12].map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => {
                        haptic();
                        setFiltroMeses(num as 3 | 6 | 12);
                      }}
                      style={[
                        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
                        filtroMeses === num
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cardSub,
                          { color: filtroMeses === num ? "#fff" : colors.muted, fontSize: 12 },
                        ]}
                      >
                        Últimos {num}m
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Previsão de Fechamento */}
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 16 }]}>
                  <Text style={[styles.cardTitulo, { color: colors.foreground, marginBottom: 12 }]}>
                    Previsão de Fechamento
                  </Text>
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={[styles.cardSub, { color: colors.muted }]}>Previsão:</Text>
                      <Text style={[styles.cardValor, { color: colors.primary, fontSize: 18 }]}>
                        {previsaoFechamento.previsao} / {monthlyGoal}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={[styles.cardSub, { color: colors.muted }]}>Velocidade:</Text>
                      <Text style={[styles.cardValor, { color: colors.success, fontSize: 14 }]}>
                        {previsaoFechamento.velocidadeDiaria} por dia
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={[styles.cardSub, { color: colors.muted }]}>Dias restantes:</Text>
                      <Text style={[styles.cardValor, { color: colors.warning, fontSize: 14 }]}>
                        {previsaoFechamento.diasRestantes}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <Text style={[styles.cardSub, { color: colors.muted }]}>% da Meta:</Text>
                      <Text style={[styles.cardValor, { color: previsaoFechamento.percentualMeta >= 100 ? colors.success : colors.error, fontSize: 16, fontWeight: "700" }]}>
                        {previsaoFechamento.percentualMeta}%
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Alertas de Desempenho */}
                <View style={[styles.card, { 
                  backgroundColor: alertasDesempenho.tipo === "abaixo" ? colors.error + "15" : alertasDesempenho.tipo === "acima" ? colors.warning + "15" : colors.success + "15",
                  borderColor: alertasDesempenho.tipo === "abaixo" ? colors.error : alertasDesempenho.tipo === "acima" ? colors.warning : colors.success,
                  marginBottom: 16,
                  borderWidth: 2
                }]}>
                  <Text style={[styles.cardTitulo, { 
                    color: alertasDesempenho.tipo === "abaixo" ? colors.error : alertasDesempenho.tipo === "acima" ? colors.warning : colors.success,
                    marginBottom: 12 
                  }]}>
                    {alertasDesempenho.mensagem}
                  </Text>
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={[styles.cardSub, { color: colors.muted }]}>Esperado:</Text>
                      <Text style={[styles.cardValor, { color: colors.muted, fontSize: 14 }]}>
                        {alertasDesempenho.velocidadeEsperada.toFixed(2)} por dia
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={[styles.cardSub, { color: colors.muted }]}>Atual:</Text>
                      <Text style={[styles.cardValor, { color: colors.foreground, fontSize: 14, fontWeight: "600" }]}>
                        {alertasDesempenho.velocidadeAtual.toFixed(2)} por dia
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                      <Text style={[styles.cardSub, { color: colors.muted }]}>Desvio:</Text>
                      <Text style={[styles.cardValor, { 
                        color: alertasDesempenho.tipo === "abaixo" ? colors.error : alertasDesempenho.tipo === "acima" ? colors.warning : colors.success,
                        fontSize: 14, 
                        fontWeight: "600" 
                      }]}>
                        {alertasDesempenho.percentualDesvio.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.cardTitulo, { color: colors.foreground, marginBottom: 12 }]}>
                  Progressão Diária por Mês
                </Text>
                
                {/* Gráfico de Linha */}
                {analisesDiaADia.length > 0 && (
                  <View style={{ marginBottom: 20, borderRadius: 8, overflow: "hidden" }}>
                    <LineChart
                      data={{
                        labels: analisesDiaADia.slice(0, 15).map((d) => `D${d.dia}`),
                        datasets: [
                          ...(analisesDiaADia[0]?.meses.map((_, idx) => {
                            const colors_array = [colors.primary, colors.success, colors.warning, colors.error, "#FF6B6B", "#4ECDC4"];
                            return {
                              data: analisesDiaADia.slice(0, 15).map((d) => d.meses[idx]?.acumulado || 0),
                              color: () => colors_array[idx % colors_array.length],
                              strokeWidth: 2,
                            };
                          }) || []),
                          {
                            data: Array(15).fill(104),
                            color: () => colors.error,
                            strokeWidth: 2,
                            strokeDashArray: [5, 5],
                          },
                        ],
                      }}
                      width={Platform.OS === "web" ? 600 : 350}
                      height={220}
                      chartConfig={{
                        backgroundColor: colors.surface,
                        backgroundGradientFrom: colors.surface,
                        backgroundGradientTo: colors.surface,
                        decimalPlaces: 0,
                        color: () => colors.muted,
                        labelColor: () => colors.muted,
                        style: { borderRadius: 8 },
                        propsForDots: { r: "4", strokeWidth: "2", stroke: colors.primary },
                      }}
                      bezier
                      style={{ borderRadius: 8 }}
                    />
                  </View>
                )}
                
                <FlatList
                  data={analisesDiaADia}
                  keyExtractor={(item) => `dia-${item.dia}`}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View
                      style={[
                        styles.card,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          marginBottom: 12,
                        },
                      ]}
                    >
                      <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitulo, { color: colors.foreground }]}>
                          Dia {String(item.dia).padStart(2, "0")}
                        </Text>
                      </View>
                      <View style={{ gap: 8 }}>
                        {item.meses.map((mes, idx) => {
                          const mesNome = new Date(mes.ano, mes.mes - 1).toLocaleDateString(
                            "pt-BR",
                            { month: "short", year: "2-digit" }
                          );
                          const badgeColor = mes.desempenho === 'acima' ? colors.success : mes.desempenho === 'abaixo' ? colors.error : colors.muted;
                          const badgeLabel = mes.desempenho === 'acima' ? '↑' : mes.desempenho === 'abaixo' ? '↓' : '→';
                          return (
                            <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Text style={[styles.cardSub, { color: colors.muted }]}>
                                  {mesNome}
                                </Text>
                                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: badgeColor }}>
                                  <Text style={{ fontSize: 10, color: "#fff", fontWeight: "600" }}>
                                    {badgeLabel}
                                  </Text>
                                </View>
                              </View>
                              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                                <Text style={[styles.cardValor, { color: colors.primary, fontSize: 16 }]}>
                                  {mes.acumulado}
                                </Text>
                                <Text style={[styles.cardSub, { color: colors.muted, fontSize: 12 }]}>
                                  (+{mes.diario})
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                />
              </View>
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
