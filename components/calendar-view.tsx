import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, Modal } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface CalendarDay {
  dia: number;
  acumulado: number;
  diario: number;
  desempenho: "acima" | "abaixo" | "igual";
  instalacoes: Array<{ data: string; cliente: string; tipoServico: string; valor: number }>;
}

interface CalendarViewProps {
  dias: CalendarDay[];
  mes: number;
  ano: number;
  onDayPress?: (dia: CalendarDay) => void;
}

export function CalendarView({ dias, mes, ano, onDayPress }: CalendarViewProps) {
  const colors = useColors();
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  // Obter primeiro dia do mês e número de dias
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const numeroDias = new Date(ano, mes, 0).getDate();

  // Criar array com dias vazios no início
  const diasComVazios: (CalendarDay | null)[] = [];
  for (let i = 0; i < primeiroDia; i++) {
    diasComVazios.push(null);
  }
  for (let i = 1; i <= numeroDias; i++) {
    const dia = dias.find((d) => d.dia === i);
    diasComVazios.push(dia || { dia: i, acumulado: 0, diario: 0, desempenho: "igual", instalacoes: [] });
  }

  const getBackgroundColor = (dia: CalendarDay | null) => {
    if (!dia || dia.acumulado === 0) return colors.surface;
    if (dia.desempenho === "acima") return colors.success + "20";
    if (dia.desempenho === "abaixo") return colors.error + "20";
    return colors.primary + "20";
  };

  const getBorderColor = (dia: CalendarDay | null) => {
    if (!dia || dia.acumulado === 0) return colors.border;
    if (dia.desempenho === "acima") return colors.success;
    if (dia.desempenho === "abaixo") return colors.error;
    return colors.primary;
  };

  return (
    <View>
      {/* Grid de dias da semana */}
      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((dia) => (
          <View key={dia} style={{ flex: 1, alignItems: "center", paddingVertical: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>
              {dia}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid de dias */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {diasComVazios.map((dia, idx) => (
          <Pressable
            key={idx}
            onPress={() => {
              if (dia && dia.acumulado > 0) {
                setSelectedDay(dia);
                onDayPress?.(dia);
              }
            }}
            style={{
              width: "14.28%",
              aspectRatio: 1,
              padding: 4,
            }}
          >
            {dia ? (
              <View
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: getBackgroundColor(dia),
                    borderColor: getBorderColor(dia),
                    borderWidth: dia.acumulado > 0 ? 2 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>
                  {dia.dia}
                </Text>
                {dia.acumulado > 0 && (
                  <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "500" }}>
                    {dia.acumulado}
                  </Text>
                )}
              </View>
            ) : (
              <View style={[styles.dayCell, { backgroundColor: "transparent", borderWidth: 0 }]} />
            )}
          </Pressable>
        ))}
      </View>

      {/* Modal de detalhes do dia */}
      <Modal visible={selectedDay !== null} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Pressable onPress={() => setSelectedDay(null)}>
              <Text style={{ fontSize: 16, color: colors.primary, fontWeight: "600" }}>
                ← Voltar
              </Text>
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginTop: 8 }}>
              Dia {selectedDay?.dia}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
              {selectedDay?.acumulado} instalações acumuladas
            </Text>
          </View>

          <FlatList
            data={selectedDay?.instalacoes || []}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <View
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  {item.cliente}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                  {item.tipoServico} - R$ {item.valor.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                  {item.data}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: colors.muted }}>Sem detalhes disponíveis</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dayCell: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
});
