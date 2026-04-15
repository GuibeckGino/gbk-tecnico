import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useColors } from "@/hooks/use-colors";

const nomesMeses = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export default function TendenciaScreen() {
  const { instalacoes } = useInstallations();
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;

  // Calcular dados dos últimos 6 meses
  const dados = useMemo(() => {
    const hoje = new Date();
    const meses: Array<{
      mes: number;
      ano: number;
      total: number;
      valor: number;
    }> = [];

    // Gerar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = data.getMonth();
      const ano = data.getFullYear();

      // Contar instalações do mês
      const instalacoesDoMes = instalacoes.filter((inst) => {
        const partes = inst.data.split("/");
        if (partes.length !== 3) return false;
        const instMes = parseInt(partes[1], 10) - 1;
        const instAno = parseInt(partes[2], 10);
        return instMes === mes && instAno === ano;
      });

      const total = instalacoesDoMes.length;
      const valorIndividual = total < 104 ? 65 : 70;
      const valor = total * valorIndividual;

      meses.push({ mes, ano, total, valor });
    }

    return meses;
  }, [instalacoes]);

  // Preparar dados para o gráfico
  const labels = dados.map((d) => `${nomesMeses[d.mes]}`);
  const valores = dados.map((d) => d.valor / 1000); // Dividir por 1000 para melhor visualização

  const chartData = {
    labels,
    datasets: [
      {
        data: valores,
        color: () => colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  // Calcular totais
  const totalGeral = dados.reduce((acc, d) => acc + d.total, 0);
  const valorGeral = dados.reduce((acc, d) => acc + d.valor, 0);
  const mediaInstalacoes = Math.round(totalGeral / 6);
  const mediaValor = Math.round(valorGeral / 6);

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <Text style={[styles.titulo, { color: colors.foreground }]}>
          Tendência de Faturamento
        </Text>
        <Text style={[styles.subtitulo, { color: colors.muted }]}>
          Últimos 6 meses
        </Text>

        {/* Gráfico */}
        {Platform.OS !== "web" ? (
          <View style={styles.graficoContainer}>
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: colors.background,
                backgroundGradientFrom: colors.background,
                backgroundGradientTo: colors.background,
                decimalPlaces: 1,
                color: () => colors.border,
                labelColor: () => colors.muted,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: colors.primary,
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        ) : (
          <View style={[styles.graficoContainer, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.muted, textAlign: "center" }}>
              Gráfico disponível apenas no dispositivo móvel
            </Text>
          </View>
        )}

        {/* Resumo */}
        <View style={styles.resumoContainer}>
          <ResumoCard
            titulo="Média de Instalações"
            valor={mediaInstalacoes.toString()}
            cor={colors.primary}
          />
          <ResumoCard
            titulo="Média de Faturamento"
            valor={`R$ ${mediaValor.toLocaleString("pt-BR")}`}
            cor={colors.success}
          />
        </View>

        {/* Detalhes por mês */}
        <Text style={[styles.detalhesTitulo, { color: colors.foreground }]}>
          Detalhes por Mês
        </Text>

        {dados.map((d, idx) => (
          <View
            key={idx}
            style={[
              styles.detalheCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.detalheHeader}>
              <Text style={[styles.detalheMes, { color: colors.foreground }]}>
                {nomesMeses[d.mes]} {d.ano}
              </Text>
              <Text style={[styles.detalheValor, { color: colors.success }]}>
                R$ {d.valor.toLocaleString("pt-BR")}
              </Text>
            </View>
            <Text style={[styles.detalheSubtexto, { color: colors.muted }]}>
              {d.total} instalações
            </Text>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

function ResumoCard({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string;
  cor: string;
}) {
  return (
    <View
      style={[
        styles.resumoCard,
        {
          backgroundColor: cor,
          shadowColor: cor,
        },
      ]}
    >
      <Text style={styles.resumoCardTitulo}>{titulo}</Text>
      <Text style={styles.resumoCardValor}>{valor}</Text>
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
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 13,
    marginBottom: 20,
  },
  graficoContainer: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
  },
  resumoContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  resumoCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumoCardTitulo: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  resumoCardValor: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  detalhesTitulo: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  detalheCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  detalheHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  detalheMes: {
    fontSize: 14,
    fontWeight: "600",
  },
  detalheValor: {
    fontSize: 14,
    fontWeight: "700",
  },
  detalheSubtexto: {
    fontSize: 12,
  },
});
