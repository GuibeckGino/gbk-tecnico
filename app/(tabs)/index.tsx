import React, { useMemo, useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Animated } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useInstallations } from '@/context/InstallationsContext';
import { useMonth } from '@/context/MonthContext';
import { useColors } from '@/hooks/use-colors';
import { calcularDiasUteis, getPrimeiroDiaUtilMes, getUltimoDiaUtilMes } from '@/lib/dias-uteis';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { calcularStats, calcularValorPorTipo } from '@/types/installation';
import { useMonthlyConfig } from '@/hooks/use-monthly-config';
import { useWorkSchedule } from '@/context/WorkScheduleContext';
import { useMetaMilestones } from '@/hooks/use-meta-milestones';
import { Toast } from '@/components/toast';

export default function DashboardScreen() {
  const { instalacoes, paymentMode, monthlyGoal } = useInstallations();
  const { mes, ano, proximoMes, mesPrevio } = useMonth();
  const colors = useColors();
  const [fadeAnim] = React.useState(new Animated.Value(1));
  const { workDays } = useWorkSchedule();
  const [showToast, setShowToast] = React.useState(false);
  
  // Carregar configurações do mês (paymentMode e monthlyGoal)
  useMonthlyConfig();
  
  // Chave única para o mês (para rastrear milestones)
  const monthKey = `${ano}-${String(mes + 1).padStart(2, '0')}`;


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

    // Usar calcularStats para cálculo correto de valor total
    const stats = calcularStats(instalacoesDoMes, paymentMode);
    const valorTotal = stats.valorTotal;
    const contadores = stats.porTipo;

    const totalInstalacoes = instalacoesDoMes.length;
    
    // IMPORTANTE: monthlyGoal é em QUANTIDADE de instalações
    // Converter para VALOR baseado no modo de pagamento
    const metaValor = monthlyGoal * calcularValorPorTipo('Instalação', totalInstalacoes, paymentMode);
    const faltamValor = Math.max(0, metaValor - valorTotal);
    
    // Faltam em QUANTIDADE (para exibir "faltam X instalações")
    const faltamQuantidade = Math.max(0, monthlyGoal - totalInstalacoes);
    
    const hoje = new Date();
    const hoje_dia = hoje.getDate();
    const hoje_mes = hoje.getMonth() + 1;
    const hoje_ano = hoje.getFullYear();

    // Usar funções corretas com dias de trabalho customizados (mes é 0-based, converter para 1-based)
    const primeiroDia = getPrimeiroDiaUtilMes(mes + 1, ano, workDays);
    const ultimoDia = getUltimoDiaUtilMes(mes + 1, ano, workDays);

    // Se estamos no mês atual, usar data de hoje; senão usar último dia do mês
    const dataFim =
      mes === hoje_mes - 1 && ano === hoje_ano
        ? new Date(hoje_ano, mes, hoje_dia)
        : ultimoDia;

    const diasUteisTotais = calcularDiasUteis(primeiroDia, ultimoDia, workDays);
    const diasUteisTrabalhados = calcularDiasUteis(primeiroDia, dataFim, workDays);
    const diasUteisRestantes = Math.max(0, diasUteisTotais - diasUteisTrabalhados);
    
    // Meta por dia em VALOR (não quantidade)
    const metaPorDiaValor = diasUteisRestantes > 0 ? Math.ceil(faltamValor / diasUteisRestantes) : 0;
    
    // Calcular percentual para detectar milestones
    const percentualMeta = monthlyGoal > 0 ? (totalInstalacoes / monthlyGoal) * 100 : 0;
    
    const hojeInstalacoes = instalacoes.filter((inst) => {
      const [d, m, a] = inst.data.split('/');
      return parseInt(d) === hoje_dia && parseInt(m) === hoje_mes && parseInt(a) === hoje_ano;
    }).length;
    
    // Média em QUANTIDADE por dia
    const mediaAtual = diasUteisTrabalhados > 0 ? (totalInstalacoes / diasUteisTrabalhados).toFixed(1) : '0';
    const mediaNecess = (monthlyGoal / diasUteisTotais).toFixed(1);
    const projecao = Math.round((parseFloat(mediaAtual) * diasUteisTotais));

    return {
      totalInstalacoes,
      valorTotal: valorTotal,
      faltamQuantidade,
      faltamValor,
      contadores,
      metaPorDiaValor,
      mediaAtual,
      mediaNecess,
      projecao,
      diasUteisTrabalhados,
      diasUteisRestantes,
      diasUteisTotais,
      percentualMeta,
    };
  }, [instalacoes, mes, ano, paymentMode, monthlyGoal, workDays]);

  const nomesMes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  // Hook para detectar milestones de meta
  const { newMilestoneReached, dismissMilestone } = useMetaMilestones(
    stats.totalInstalacoes,
    monthlyGoal,
    monthKey
  );
  
  // Mostrar toast quando milestone for atingido
  React.useEffect(() => {
    if (newMilestoneReached) {
      setShowToast(true);
    }
  }, [newMilestoneReached]);
  
  // Meta é atingida quando valor total >= meta em valor
  const metaValorEsperada = monthlyGoal * calcularValorPorTipo('Instalação', stats.totalInstalacoes, paymentMode);
  const metaAtingida = stats.valorTotal >= metaValorEsperada;
  const percentualMetaExibicao = (stats.valorTotal / metaValorEsperada) * 100;
  const mostrarNotificacao = percentualMetaExibicao >= 90 && percentualMetaExibicao < 100;

  return (
    <ScreenContainer>
      {showToast && newMilestoneReached && (
        <Toast
          message={newMilestoneReached.message}
          type="success"
          duration={4000}
          onDismiss={() => {
            setShowToast(false);
            dismissMilestone();
          }}
        />
      )}
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
              <View style={{ position: 'relative', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                  {nomesMes[mes]} {ano}
                </Text>
                {mostrarNotificacao && (
                  <View style={{
                    position: 'absolute',
                    top: -10,
                    right: -20,
                    backgroundColor: colors.error,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    zIndex: 10,
                  }}
                  >
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>90%</Text>
                  </View>
                )}
              </View>
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
                position: 'relative',
              }}
            >
              {/* Badges de milestone */}
              {stats.percentualMeta >= 50 && stats.percentualMeta < 75 && (
                <View style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  backgroundColor: '#FFC107',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  zIndex: 10,
                }}>
                  <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>50% \ud83c\udfaf</Text>
                </View>
              )}
              {stats.percentualMeta >= 75 && stats.percentualMeta < 90 && (
                <View style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  backgroundColor: '#FF9800',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  zIndex: 10,
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>75% \ud83d\udd25</Text>
                </View>
              )}
              {stats.percentualMeta >= 90 && stats.percentualMeta < 100 && (
                <View style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  backgroundColor: '#FF5722',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  zIndex: 10,
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>90% \u26a1</Text>
                </View>
              )}
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
                    R$ {stats.faltamValor.toLocaleString('pt-BR')}
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
                { label: 'Meta por Dia', value: `R$ ${stats.metaPorDiaValor}`, unit: '' },
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
          {stats.faltamQuantidade > 0 && stats.faltamQuantidade <= 10 && (
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
                  ⚠️ Faltam R$ {stats.faltamValor.toLocaleString('pt-BR')} para a meta!
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}
