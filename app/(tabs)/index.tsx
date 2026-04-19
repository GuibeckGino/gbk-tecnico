import React, { useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useInstallations } from "@/context/InstallationsContext";
import { useMonth, filtrarPorMes } from "@/context/MonthContext";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

function haptic() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano, mesAnoFormatado, proximoMes, mesPrevio } = useMonth();
  const colors = useColors();

  // Filtrar instalações do mês selecionado
  const instalacoesDoMes = filtrarPorMes(instalacoes, mes, ano);

  // Calcular stats do mês
  function calcularStatsMes() {
    const total = instalacoesDoMes.length;
    
    // Calcular valor total considerando cada tipo
    let valorTotal = 0;
    let valorIndividual = 65; // padrão
    
    instalacoesDoMes.forEach((inst) => {
      // Empresarial sempre é R$100
      if (inst.tipoServico === "Empresarial") {
        valorTotal += 100;
      } else {
        // Outros tipos seguem o modo de pagamento
        if (paymentMode === "fixo65") {
          valorTotal += 65;
        } else if (paymentMode === "fixo70") {
          valorTotal += 70;
        } else {
          // Meta progressiva
          valorTotal += total >= 104 ? 70 : 65;
        }
      }
    });
    
    // Valor individual é o valor do primeiro tipo (para referência)
    if (total > 0) {
      const primeiroTipo = instalacoesDoMes[0]?.tipoServico;
      if (primeiroTipo === "Empresarial") {
        valorIndividual = 100;
      } else if (paymentMode === "fixo65") {
        valorIndividual = 65;
      } else if (paymentMode === "fixo70") {
        valorIndividual = 70;
      } else {
        valorIndividual = total >= 104 ? 70 : 65;
      }
    }

    const porTipo = {
      instalacao: instalacoesDoMes.filter((i) => i.tipoServico === "Instalação")
        .length,
      tipo3: instalacoesDoMes.filter((i) => i.tipoServico === "Tipo 3").length,
      mudanca: instalacoesDoMes.filter((i) => i.tipoServico === "Mudança")
        .length,
      empresarial: instalacoesDoMes.filter((i) => i.tipoServico === "Empresarial")
        .length,
    };

    return { total, valorIndividual, valorTotal, porTipo };
  }

  const stats = calcularStatsMes();

  // Atualizar quando focar na tela
  useFocusEffect(
    React.useCallback(() => {
      // Força re-render ao focar
    }, [])
  );

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com Navegação de Meses */}
        <View
          style={[
            styles.headerMes,
            { borderBottomColor: colors.border },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.botaoMes,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            onPress={() => {
              haptic();
              mesPrevio();
            }}
          >
            <Text style={[styles.botaoMesTexto, { color: colors.primary }]}>
              ◀
            </Text>
          </Pressable>

          <Text style={[styles.mesAnoTexto, { color: colors.foreground }]}>
            {mesAnoFormatado}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.botaoMes,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            onPress={() => {
              haptic();
              proximoMes();
            }}
          >
            <Text style={[styles.botaoMesTexto, { color: colors.primary }]}>
              ▶
            </Text>
          </Pressable>
        </View>

        {/* Card Principal */}
        <View
          style={[
            styles.cardPrincipal,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.foreground,
            },
          ]}
        >
          <Text style={styles.cardPrincipalLabel}>Total de Instalações</Text>
          <Text style={styles.cardPrincipalNumero}>{stats.total}</Text>

          <View style={styles.divisorCard} />

          <Text style={styles.cardPrincipalLabel}>Valor Total a Receber</Text>
          <Text style={styles.cardPrincipalValor}>
            R$ {stats.valorTotal.toLocaleString("pt-BR")}
          </Text>
          <Text style={styles.cardPrincipalSubtexto}>
            R$ {stats.valorIndividual}/instalação
          </Text>
        </View>

        {/* Seção Por Tipo */}
        <View style={styles.secao}>
          <Text style={[styles.secaoTitulo, { color: colors.foreground }]}>
            Por Tipo de Serviço
          </Text>

          <View style={styles.tiposContainer}>
            <MiniCard
              titulo="Instalação"
              valor={stats.porTipo.instalacao}
              cor="#1565C0"
            />
            <MiniCard
              titulo="Tipo 3"
              valor={stats.porTipo.tipo3}
              cor="#0D47A1"
            />
            <MiniCard
              titulo="Mudança"
              valor={stats.porTipo.mudanca}
              cor="#1976D2"
            />
            <MiniCard
              titulo="Empresarial"
              valor={stats.porTipo.empresarial}
              cor="#F57C00"
            />
          </View>
        </View>

        {/* Botões de Ação */}
        <View style={styles.acoes}>
          <Pressable
            style={({ pressed }) => [
              styles.botaoPrimario,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                transform: pressed ? [{ scale: 0.97 }] : [],
              },
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
                borderColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                transform: pressed ? [{ scale: 0.97 }] : [],
              },
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

        {/* Info de Filtro */}
        {instalacoesDoMes.length === 0 && instalacoes.length > 0 && (
          <View style={styles.infoFiltro}>
            <Text style={[styles.infoTexto, { color: colors.muted }]}>
              Nenhuma instalação em {mesAnoFormatado}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function MiniCard({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <View
      style={[
        styles.miniCard,
        {
          backgroundColor: cor,
          shadowColor: cor,
        },
      ]}
    >
      <Text style={styles.miniCardNumero}>{valor}</Text>
      <Text style={styles.miniCardTitulo}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  headerMes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  botaoMes: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  botaoMesTexto: {
    fontSize: 20,
    fontWeight: "700",
  },
  mesAnoTexto: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  cardPrincipal: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardPrincipalLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  cardPrincipalNumero: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "700",
    marginVertical: 4,
  },
  divisorCard: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 14,
  },
  cardPrincipalValor: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    marginVertical: 4,
  },
  cardPrincipalSubtexto: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 4,
  },
  secao: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  secaoTitulo: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  tiposContainer: {
    flexDirection: "row",
    gap: 12,
  },
  miniCard: {
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
  miniCardNumero: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  miniCardTitulo: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  acoes: {
    paddingHorizontal: 16,
    gap: 12,
  },
  botaoPrimario: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoPrimarioTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  botaoSecundario: {
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  botaoSecundarioTexto: {
    fontSize: 16,
    fontWeight: "700",
  },
  infoFiltro: {
    marginTop: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  infoTexto: {
    fontSize: 14,
    fontWeight: "500",
  },
});
