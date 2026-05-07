import React, { useMemo, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Animated } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useInstallations } from '@/context/InstallationsContext';
import { useMonth } from '@/context/MonthContext';
import { useColors } from '@/hooks/use-colors';
import { calcularDiasUteis } from '@/lib/dias-uteis';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

export default function DashboardScreen() {
  const { instalacoes, paymentMode, monthlyGoal } = useInstallations();
  const { mes, ano, proximoMes, mesPrevio } = useMonth();
  const colors = useColors();
  const [fadeAnim] = React.useState(new Animated.Value(1));

  // Atualizar quando mês mudar
  useFocusEffect(
    React.useCallback(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.5, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }, [mes, ano, fadeAnim])
  );

  // Calcular stats do mês
  const stats = useMemo(() => {
    const instalacoesDoMes = instalacoes.filter((inst) => {
      const [d, m, a] = inst.data.split('/');
      return parseInt(m) === mes + 1 && parseInt(a) === ano;
    });

    const contadores = {
      instalacao: 0,
      tipo3: 0,
      mudanca: 0,
      empresarial: 0,
    };

    let valorTotal = 0;

    instalacoesDoMes.forEach((inst) => {
      if (inst.tipoServico === 'Instalação') contadores.instalacao++;
      else if (inst.tipoServico === 'Tipo 3') contadores.tipo3++;
      else if (inst.tipoServico === 'Mudança') contadores.mudanca++;
      else if (inst.tipoServico === 'Empresarial') contadores.empresarial++;

      if (inst.tipoServico === 'Empresarial') {
        valorTotal += 100;
      } else if (paymentMode === 'fixo65') {
        valorTotal += 65;
      } else if (paymentMode === 'fixo70') {
        valorTotal += 70;
      } else {
        // meta progressiva
        const total = instalacoesDoMes.length;
        valorTotal += total >= monthlyGoal ? 70 : 65;
      }
    });

    const totalInstalacoes = instalacoesDoMes.length;
    const faltam = Math.max(0, monthlyGoal - totalInstalacoes);
    
    const hoje = new Date();
    const hoje_dia = hoje.getDate();
    const hoje_mes = hoje.getMonth() + 1;
    const hoje_ano = hoje.getFullYear();

    // Calcular primeiro e último dia útil do mês
    let primeiroDia = new Date(ano, mes, 1);
    if (primeiroDia.getDay() === 0) primeiroDia.setDate(primeiroDia.getDate() + 1);

    let ultimoDia = new Date(ano, mes + 1, 0);
    if (ultimoDia.getDay() === 0) ultimoDia.setDate(ultimoDia.getDate() - 1);

    // Se estamos em um mês diferente, usar o último dia do mês solicitado
    const dataFim =
      mes === hoje_mes - 1 && ano === hoje_ano
        ? new Date(hoje_ano, mes, hoje_dia)
        : ultimoDia;

    const diasUteisTotais = calcularDiasUteis(primeiroDia, ultimoDia);
    const diasUteisTrabalhados = calcularDiasUteis(primeiroDia, dataFim);
    const diasUteisRestantes = Math.max(0, diasUteisTotais - diasUteisTrabalhados);
    const metaPorDia = diasUteisRestantes > 0 ? Math.ceil(faltam / diasUteisRestantes) : 0;
    const hojeInstalacoes = instalacoes.filter((inst) => {
      const [d, m, a] = inst.data.split('/');
      return parseInt(d) === hoje_dia && parseInt(m) === hoje_mes && parseInt(a) === hoje_ano;
    }).length;
    const mediaAtual = diasUteisTrabalhados > 0 ? (totalInstalacoes / diasUteisTrabalhados).toFixed(1) : '0';
    const mediaNecess = (monthlyGoal / diasUteisTotais).toFixed(1);
    const projecao = Math.round((parseFloat(mediaAtual) * diasUteisTotais));

    return {
      totalInstalacoes,
      valorTotal,
      faltam,
      contadores,
      metaPorDia,
      mediaAtual,
      mediaNecess,
      projecao,
      diasUteisTrabalhados,
      diasUteisRestantes,
      diasUteisTotais,
    };
  }, [instalacoes, mes, ano, paymentMode, monthlyGoal]);

  const nomesMes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const metaAtingida = stats.totalInstalacoes >= monthlyGoal;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Cabeçalho com navegação de meses */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  mesPrevio();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{ padding: 8 }}
              >
                <Text style={{ fontSize: 20, color: colors.primary }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                {nomesMes[mes]} {ano}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  proximoMes();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{ padding: 8 }}
              >
                <Text style={{ fontSize: 20, color: colors.primary }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card Principal - Meta */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                padding: 20,
                gap: 12,
              }}
            >
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.background, opacity: 0.9 }}>
                  Meta do Mês
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={{ fontSize: 32, fontWeight: '800', color: colors.background }}>
                    {stats.totalInstalacoes}
                  </Text>
                  <Text style={{ fontSize: 16, color: colors.background, opacity: 0.8 }}>
                    / {monthlyGoal}
                  </Text>
                </View>
              </View>

              {/* Barra de progresso */}
              <View style={{ height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${Math.min((stats.totalInstalacoes / monthlyGoal) * 100, 100)}%`,
                    backgroundColor: metaAtingida ? '#4CAF50' : colors.background,
                    borderRadius: 4,
                  }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 12, color: colors.background, opacity: 0.8 }}>Faltam</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.background }}>
                    {stats.faltam}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 12, color: colors.background, opacity: 0.8 }}>Valor Total</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.background }}>
                    R$ {stats.valorTotal.toLocaleString('pt-BR')}
                  </Text>
                </View>
              </View>

              {metaAtingida && (
                <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
                    🎉 Meta Atingida! Bônus de R$5 por serviço
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Grid de Tipos de Serviço */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: 12 }}>
              Por Tipo de Serviço
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Instalação', count: stats.contadores.instalacao, color: '#0a7ea4' },
                { label: 'Tipo 3', count: stats.contadores.tipo3, color: '#0d47a1' },
                { label: 'Mudança', count: stats.contadores.mudanca, color: '#1565c0' },
                { label: 'Empresarial', count: stats.contadores.empresarial, color: '#ff9800' },
              ].map((tipo) => (
                <View
                  key={tipo.label}
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: tipo.color,
                    borderRadius: 12,
                    padding: 12,
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>
                    {tipo.count}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#fff', textAlign: 'center' }}>
                    {tipo.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Métricas Detalhadas */}
          <View style={{ paddingHorizontal: 16, marginBottom: 16, gap: 12 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                Análise do Mês
              </Text>

              {[
                { label: 'Meta por Dia', value: stats.metaPorDia, unit: 'instalações' },
                { label: 'Média Atual', value: stats.mediaAtual, unit: 'por dia' },
                { label: 'Média Necessária', value: stats.mediaNecess, unit: 'por dia' },
                { label: 'Projeção', value: `${stats.projecao}`, unit: 'instalações' },
                { label: 'Dias Trabalhados', value: stats.diasUteisTrabalhados, unit: '' },
                { label: 'Dias Restantes', value: stats.diasUteisRestantes, unit: '' },
              ].map((metrica, idx) => (
                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>{metrica.label}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>
                      {metrica.value}
                    </Text>
                    {metrica.unit ? (
                      <Text style={{ fontSize: 11, color: colors.muted }}>{metrica.unit}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Alerta de Meta */}
          {stats.faltam > 0 && stats.faltam <= 10 && (
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: '#FFF3CD',
                  borderRadius: 12,
                  padding: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: '#FFC107',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#856404' }}>
                  ⚠️ Faltam apenas {stats.faltam} instalações para a meta!
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}
