import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useInstallations } from '@/context/InstallationsContext';
import { useColors } from '@/hooks/use-colors';
import { useMonth } from '@/context/MonthContext';
import { calcularValorPorTipo } from '@/types/installation';

interface DiaCalendario {
  dia: number;
  mes: number;
  ano: number;
  instalacoes: number;
  valor: number;
  tipos: { [key: string]: number };
}

export default function CalendarioScreen() {
  const { instalacoes, paymentMode, monthlyGoal } = useInstallations();
  const { mes, ano } = useMonth();
  const colors = useColors();
  const [diaAtual, setDiaAtual] = useState<number | null>(null);

  // Calcular dados do calendário
  const diasCalendario = useMemo(() => {
    const diasDoMes: DiaCalendario[] = [];
    const ultimoDia = new Date(ano, mes, 0).getDate();

    for (let dia = 1; dia <= ultimoDia; dia++) {
      const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;
      const instalacoesDodia = instalacoes.filter((inst) => inst.data === dataFormatada);

      const tipos: { [key: string]: number } = {
        'Instalação': 0,
        'Tipo 3': 0,
        'Mudança': 0,
        'Empresarial': 0,
      };

      let valor = 0;
      instalacoesDodia.forEach((inst) => {
        tipos[inst.tipoServico] = (tipos[inst.tipoServico] || 0) + 1;
        const totalDoMes = instalacoes.filter((i) => {
          const [d, m, a] = i.data.split('/');
          return parseInt(m) === mes + 1 && parseInt(a) === ano;
        }).length;
        valor += calcularValorPorTipo(inst.tipoServico, totalDoMes, paymentMode);
      });

      diasDoMes.push({
        dia,
        mes,
        ano,
        instalacoes: instalacoesDodia.length,
        valor,
        tipos,
      });
    }

    return diasDoMes;
  }, [instalacoes, mes, ano, paymentMode, monthlyGoal]);

  // Agrupar dias por semanas
  const semanas = useMemo(() => {
    const semanas: DiaCalendario[][] = [];
    const primeirodia = new Date(ano, mes, 1).getDay();
    let semanaAtual: DiaCalendario[] = [];

    // Preencher dias vazios do mês anterior
    for (let i = 0; i < primeirodia; i++) {
      semanaAtual.push({ dia: 0, mes: 0, ano: 0, instalacoes: 0, valor: 0, tipos: {} });
    }

    // Preencher dias do mês
    diasCalendario.forEach((dia) => {
      semanaAtual.push(dia);
      if (semanaAtual.length === 7) {
        semanas.push(semanaAtual);
        semanaAtual = [];
      }
    });

    // Preencher dias vazios do próximo mês
    if (semanaAtual.length > 0) {
      while (semanaAtual.length < 7) {
        semanaAtual.push({ dia: 0, mes: 0, ano: 0, instalacoes: 0, valor: 0, tipos: {} });
      }
      semanas.push(semanaAtual);
    }

    return semanas;
  }, [diasCalendario, mes, ano]);

  // Dia selecionado
  const diaSelecionado = useMemo(() => {
    if (!diaAtual) return null;
    return diasCalendario.find((d) => d.dia === diaAtual) || null;
  }, [diaAtual, diasCalendario]);

  // Corrigir índice do mês para exibição
  const mesIndex = mes;

  // Cores por tipo
  const coresTipo = {
    'Instalação': '#0a7ea4',
    'Tipo 3': '#0d47a1',
    'Mudança': '#1565c0',
    'Empresarial': '#ff9800',
  };

  const nomesMes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const nomesdia = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 16 }}>
        {/* Logo Header */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 60, height: 60, borderRadius: 12 }}
          />
        </View>

        {/* Cabeçalho */}
        <View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
            {nomesMes[mesIndex]} de {ano}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            Visualize suas instalações no calendário
          </Text>
        </View>

        {/* Calendário */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
          {/* Cabeçalho com dias da semana */}
          <View style={{ flexDirection: 'row', marginBottom: 8, gap: 4 }}>
            {nomesdia.map((nome, idx) => (
              <View key={idx} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted }}>
                  {nome}
                </Text>
              </View>
            ))}
          </View>

          {/* Dias do calendário */}
          {semanas.map((semana, semanaIdx) => (
            <View key={semanaIdx} style={{ flexDirection: 'row', marginBottom: 8, gap: 4 }}>
              {semana.map((dia, diaIdx) => (
                <TouchableOpacity
                  key={diaIdx}
                  onPress={() => dia.dia > 0 && setDiaAtual(dia.dia)}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 8,
                    backgroundColor:
                      dia.dia === 0
                        ? colors.background
                        : dia.dia === diaAtual
                        ? colors.primary
                        : dia.instalacoes > 0
                        ? colors.border
                        : colors.background,
                    borderWidth: dia.dia === diaAtual ? 2 : 1,
                    borderColor: dia.dia === diaAtual ? colors.primary : colors.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 4,
                  }}
                >
                  {dia.dia > 0 && (
                    <View style={{ alignItems: 'center', gap: 2 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: dia.dia === diaAtual ? colors.background : colors.foreground,
                        }}
                      >
                        {dia.dia}
                      </Text>
                      {dia.instalacoes > 0 && (
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: dia.dia === diaAtual ? colors.background : colors.primary,
                          }}
                        >
                          {dia.instalacoes}
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Detalhes do dia selecionado */}
        {diaSelecionado && diaSelecionado.dia > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
              {String(diaSelecionado.dia).padStart(2, '0')} de {nomesMes[mesIndex]}
            </Text>

            {diaSelecionado.instalacoes > 0 ? (
              <>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.muted }}>Total de Instalações:</Text>
                    <Text style={{ fontWeight: '600', color: colors.foreground }}>
                      {diaSelecionado.instalacoes}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.muted }}>Faturamento:</Text>
                    <Text style={{ fontWeight: '600', color: colors.primary }}>
                      R$ {diaSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>

                {/* Contagem por tipo */}
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                    Por Tipo:
                  </Text>
                  {Object.entries(diaSelecionado.tipos).map(([tipo, count]) => (
                    count > 0 && (
                      <View key={tipo} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: coresTipo[tipo as keyof typeof coresTipo],
                          }}
                        />
                        <Text style={{ flex: 1, color: colors.foreground }}>
                          {tipo}
                        </Text>
                        <Text style={{ fontWeight: '600', color: colors.foreground }}>
                          {count}
                        </Text>
                      </View>
                    )
                  ))}
                </View>
              </>
            ) : (
              <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 20 }}>
                Sem instalações neste dia
              </Text>
            )}
          </View>
        )}

        {/* Legenda */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
            Legenda
          </Text>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: colors.primary,
                }}
              />
              <Text style={{ fontSize: 12, color: colors.muted }}>Dia selecionado</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: colors.border,
                }}
              />
              <Text style={{ fontSize: 12, color: colors.muted }}>Com instalações</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <Text style={{ fontSize: 12, color: colors.muted }}>Sem instalações</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
