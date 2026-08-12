import React, { useMemo, useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
import { useBairroFilter } from '@/context/BairroFilterContext';
import { BairroFilter } from '@/components/bairro-filter';
import { IconSymbol } from '@/components/ui/icon-symbol';

const GOLD = '#F2B52B';
const GOLD_BORDER = '#9B741B';
const CARD = '#0B1426';
const CARD_ALT = '#0D1A31';
const BLUE = '#2F6BFF';
const BLUE_DARK = '#1643B6';
const DIVIDER = '#1D2B43';
const WHITE = '#F8FAFC';
const MUTED = '#B8C1D1';

const SERVICE_CARDS = [
  { label: 'Instalação', key: 'instalacao' as const, icon: 'build.fill' as const },
  { label: 'Tipo 3', key: 'tipo3' as const, icon: 'square.stack.3d.up.fill' as const },
  { label: 'Mudança', key: 'mudanca' as const, icon: 'arrow.triangle.2.circlepath' as const },
  { label: 'Empresarial', key: 'empresarial' as const, icon: 'building.2.fill' as const },
];

const ANALYSIS_ROWS = [
  { label: 'Meta por Dia', key: 'metaPorDiaValor' as const, icon: 'calendar' as const, unit: '' },
  { label: 'Média Atual', key: 'mediaAtual' as const, icon: 'chart.line.uptrend.xyaxis' as const, unit: 'por dia' },
  { label: 'Média Necessária', key: 'mediaNecess' as const, icon: 'target' as const, unit: 'por dia' },
  { label: 'Projeção', key: 'projecao' as const, icon: 'chart.line.uptrend.xyaxis' as const, unit: 'instalações' },
  { label: 'Dias Trabalhados', key: 'diasUteisTrabalhados' as const, icon: 'clock.fill' as const, unit: '' },
];

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

export default function DashboardScreen() {
  const { instalacoes, paymentMode, monthlyGoal } = useInstallations();
  const { mes, ano, proximoMes, mesPrevio } = useMonth();
  const colors = useColors();
  const [fadeAnim] = React.useState(new Animated.Value(1));
  const { workDays } = useWorkSchedule();
  const [showToast, setShowToast] = React.useState(false);
  const { bairroSelecionado, setBairroSelecionado } = useBairroFilter();

  useMonthlyConfig();

  const monthKey = `${ano}-${String(mes + 1).padStart(2, '0')}`;

  useFocusEffect(
    useCallback(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.5, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }, [mes, ano, fadeAnim])
  );

  const stats = useMemo(() => {
    const instalacoesDoMes = instalacoes.filter((inst) => {
      const [, mesRegistro, anoRegistro] = inst.data.split('/');
      const mesMatch = parseInt(mesRegistro, 10) === mes + 1 && parseInt(anoRegistro, 10) === ano;
      const bairroMatch = !bairroSelecionado || inst.endereco === bairroSelecionado;
      return mesMatch && bairroMatch;
    });

    const resumo = calcularStats(instalacoesDoMes, paymentMode);
    const totalInstalacoes = instalacoesDoMes.length;
    const metaValor = monthlyGoal * calcularValorPorTipo('Instalação', totalInstalacoes, paymentMode);
    const faltamValor = Math.max(0, metaValor - resumo.valorTotal);
    const faltamQuantidade = Math.max(0, monthlyGoal - totalInstalacoes);

    const hoje = new Date();
    const hojeDia = hoje.getDate();
    const hojeMes = hoje.getMonth() + 1;
    const hojeAno = hoje.getFullYear();
    const primeiroDia = getPrimeiroDiaUtilMes(mes + 1, ano, workDays);
    const ultimoDia = getUltimoDiaUtilMes(mes + 1, ano, workDays);
    const dataFim = mes === hojeMes - 1 && ano === hojeAno
      ? new Date(hojeAno, mes, hojeDia)
      : ultimoDia;

    const diasUteisTotais = calcularDiasUteis(primeiroDia, ultimoDia, workDays);
    const diasUteisTrabalhados = calcularDiasUteis(primeiroDia, dataFim, workDays);
    const diasUteisRestantes = Math.max(0, diasUteisTotais - diasUteisTrabalhados);
    const metaPorDiaValor = diasUteisRestantes > 0 ? Math.ceil(faltamValor / diasUteisRestantes) : 0;
    const percentualMeta = monthlyGoal > 0 ? (totalInstalacoes / monthlyGoal) * 100 : 0;
    const hojeInstalacoes = instalacoesDoMes.filter((inst) => {
      const [dia, mesRegistro, anoRegistro] = inst.data.split('/');
      return parseInt(dia, 10) === hojeDia && parseInt(mesRegistro, 10) === hojeMes && parseInt(anoRegistro, 10) === hojeAno;
    }).length;
    const mediaAtual = diasUteisTrabalhados > 0 ? (totalInstalacoes / diasUteisTrabalhados).toFixed(1) : '0';
    const mediaNecess = diasUteisTotais > 0 ? (monthlyGoal / diasUteisTotais).toFixed(1) : '0';
    const projecao = Math.round(parseFloat(mediaAtual) * diasUteisTotais);

    return {
      totalInstalacoes,
      valorTotal: resumo.valorTotal,
      faltamQuantidade,
      faltamValor,
      contadores: resumo.porTipo,
      metaPorDiaValor,
      mediaAtual,
      mediaNecess,
      projecao,
      diasUteisTrabalhados,
      diasUteisRestantes,
      diasUteisTotais,
      percentualMeta,
      hojeInstalacoes,
    };
  }, [instalacoes, mes, ano, paymentMode, monthlyGoal, workDays, bairroSelecionado]);

  const nomesMes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const { newMilestoneReached, dismissMilestone } = useMetaMilestones(
    stats.totalInstalacoes,
    monthlyGoal,
    monthKey
  );

  React.useEffect(() => {
    if (newMilestoneReached) setShowToast(true);
  }, [newMilestoneReached]);

  const metaValorEsperada = monthlyGoal * calcularValorPorTipo('Instalação', monthlyGoal, paymentMode);
  const metaAtingida = metaValorEsperada > 0 && stats.valorTotal >= metaValorEsperada;
  const percentualMetaExibicao = metaValorEsperada > 0
    ? Math.min(100, (stats.valorTotal / metaValorEsperada) * 100)
    : 0;
  const progresso = monthlyGoal > 0 ? Math.min(1, stats.totalInstalacoes / monthlyGoal) : 0;
  const circunferencia = 2 * Math.PI * 43;
  const mostrarNotificacao = percentualMetaExibicao >= 90 && percentualMetaExibicao < 100;

  const alterarMes = (direcao: 'anterior' | 'proximo') => {
    if (direcao === 'anterior') mesPrevio();
    else proximoMes();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <TouchableOpacity onPress={() => alterarMes('anterior')} style={{ padding: 4 }}>
              <IconSymbol name="chevron.left" size={34} color={GOLD} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: WHITE, fontSize: 22, fontWeight: '800', letterSpacing: 0.2 }}>
                {nomesMes[mes]} {ano}
              </Text>
              {mostrarNotificacao && (
                <Text style={{ color: GOLD, fontSize: 10, fontWeight: '800', marginTop: 2 }}>META A 90%</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => alterarMes('proximo')} style={{ padding: 4 }}>
              <IconSymbol name="chevron.right" size={34} color={GOLD} />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 16 }}>
            <BairroFilter bairroSelecionado={bairroSelecionado} onSelectBairro={setBairroSelecionado} />
          </View>

          <View style={{
            backgroundColor: CARD,
            borderColor: GOLD_BORDER,
            borderWidth: 1,
            borderRadius: 20,
            padding: 20,
            marginBottom: 22,
            shadowColor: GOLD,
            shadowOpacity: 0.12,
            shadowRadius: 14,
            elevation: 3,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: GOLD, fontSize: 17, fontWeight: '700', marginBottom: 10 }}>Meta do Mês</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={{ color: GOLD, fontSize: 52, lineHeight: 58, fontWeight: '800' }}>{stats.totalInstalacoes}</Text>
                  <Text style={{ color: WHITE, fontSize: 24, fontWeight: '600', marginLeft: 8 }}>/ {monthlyGoal}</Text>
                </View>
              </View>
              <View style={{ width: 106, height: 106, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={106} height={106} viewBox="0 0 106 106">
                  <Circle cx="53" cy="53" r="43" stroke="#1E2B41" strokeWidth="9" fill="none" />
                  <Circle
                    cx="53"
                    cy="53"
                    r="43"
                    stroke={GOLD}
                    strokeWidth="9"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${circunferencia} ${circunferencia}`}
                    strokeDashoffset={circunferencia * (1 - progresso)}
                    rotation="-90"
                    origin="53, 53"
                  />
                </Svg>
                <View style={{ position: 'absolute', alignItems: 'center' }}>
                  <Text style={{ color: GOLD, fontSize: 23, fontWeight: '800' }}>{Math.round(progresso * 100)}%</Text>
                  <Text style={{ color: MUTED, fontSize: 12 }}>da meta</Text>
                </View>
              </View>
            </View>

            <View style={{ height: 10, borderRadius: 8, backgroundColor: '#1B2A43', overflow: 'hidden', marginTop: 12, marginBottom: 18 }}>
              <View style={{ width: `${Math.round(progresso * 100)}%`, height: '100%', borderRadius: 8, backgroundColor: GOLD }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: MUTED, fontSize: 15, marginBottom: 4 }}>Faltam</Text>
                <Text style={{ color: GOLD, fontSize: 23, fontWeight: '800' }}>{formatCurrency(stats.faltamValor)}</Text>
                <Text style={{ color: MUTED, fontSize: 14, marginTop: 4 }}>
                  {stats.faltamQuantidade} instalação{stats.faltamQuantidade !== 1 ? 'ões' : ''}
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#31415B', marginHorizontal: 18 }} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ color: MUTED, fontSize: 15, marginBottom: 4 }}>Valor Total</Text>
                <Text style={{ color: GOLD, fontSize: 23, fontWeight: '800' }}>{formatCurrency(stats.valorTotal)}</Text>
              </View>
            </View>

            {metaAtingida && (
              <View style={{ backgroundColor: '#142C26', borderRadius: 10, padding: 9, alignItems: 'center', marginTop: 16 }}>
                <Text style={{ color: '#63E6A2', fontSize: 12, fontWeight: '700' }}>Meta atingida — bônus de R$ 5 por serviço</Text>
              </View>
            )}
          </View>

          <Text style={{ color: WHITE, fontSize: 21, fontWeight: '700', marginBottom: 12 }}>Por Tipo de Serviço</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 22 }}>
            {SERVICE_CARDS.map((service) => {
              const count = stats.contadores[service.key];
              const share = monthlyGoal > 0 ? Math.min(100, (count / monthlyGoal) * 100) : 0;
              return (
                <View
                  key={service.label}
                  style={{
                    width: '48.5%',
                    minHeight: 108,
                    backgroundColor: CARD_ALT,
                    borderColor: '#1E5BDB',
                    borderWidth: 1,
                    borderRadius: 15,
                    padding: 12,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <View style={{ width: 54, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: BLUE_DARK, marginRight: 12 }}>
                    <IconSymbol name={service.icon} size={29} color={WHITE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: WHITE, fontSize: 30, lineHeight: 34, fontWeight: '800' }}>{count}</Text>
                    <Text style={{ color: WHITE, fontSize: 15, fontWeight: '500' }} numberOfLines={1}>{service.label}</Text>
                  </View>
                  <View style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: `${share}%`, backgroundColor: BLUE }} />
                </View>
              );
            })}
          </View>

          <View style={{ backgroundColor: CARD, borderColor: '#1E5BDB', borderWidth: 1, borderRadius: 17, padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={26} color={BLUE} />
              <Text style={{ color: WHITE, fontSize: 20, fontWeight: '700', marginLeft: 10 }}>Análise do Mês</Text>
            </View>

            {ANALYSIS_ROWS.map((row, index) => {
              const rawValue = stats[row.key];
              const displayValue = row.key === 'metaPorDiaValor'
                ? formatCurrency(Number(rawValue))
                : String(rawValue);
              return (
                <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 58, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: DIVIDER }}>
                  <IconSymbol name={row.icon} size={23} color={BLUE} />
                  <Text style={{ flex: 1, color: WHITE, fontSize: 16, marginLeft: 14 }}>{row.label}</Text>
                  <Text style={{ color: BLUE, fontSize: 19, fontWeight: '800' }}>{displayValue}</Text>
                  {row.unit ? <Text style={{ color: MUTED, fontSize: 14, marginLeft: 10 }}>{row.unit}</Text> : null}
                </View>
              );
            })}
          </View>

          {stats.faltamQuantidade > 0 && stats.faltamQuantidade <= 10 && (
            <View style={{ backgroundColor: '#241D0B', borderColor: GOLD_BORDER, borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 10 }}>
              <Text style={{ color: GOLD, fontSize: 13, fontWeight: '700' }}>
                Atenção: faltam {formatCurrency(stats.faltamValor)} para a meta.
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}
