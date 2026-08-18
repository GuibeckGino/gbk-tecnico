import { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenContainer } from '@/components/screen-container';
import { PremiumCard, PREMIUM } from '@/components/premium-ui';
import { ReferenceBarChart, ReferenceLineChart, ReferenceSemiDonut } from '@/components/reference-charts';
import { useInstallations } from '@/context/InstallationsContext';
import { filtrarPorMes, useMonth } from '@/context/MonthContext';
import { calcularValorPorTipo } from '@/types/installation';
import { getChartPeriodLabel, selectChartInstallations, type ChartPeriod } from '@/lib/chart-period';

const screenWidth = Dimensions.get('window').width;
const chartWidth = Math.min(Math.max(screenWidth - 76, 280), 780);

const SERVICE_COLORS = {
  Instalação: '#1768E5',
  'Tipo 3': '#234FB8',
  Mudança: '#13A5C6',
  Empresarial: '#F2B52B',
};

type ServiceType = keyof typeof SERVICE_COLORS;
function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: '#0A2A70', borderWidth: 1, borderColor: PREMIUM.blue, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <IconSymbol name={icon} size={28} color={PREMIUM.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: PREMIUM.foreground, fontSize: 19, lineHeight: 24, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: PREMIUM.muted, fontSize: 14, lineHeight: 19, marginTop: 3 }}>{subtitle}</Text>
      </View>
    </View>
  );
}

function PeriodSelector({ period, onChange }: { period: ChartPeriod; onChange: (period: ChartPeriod) => void }) {
  return (
    <View style={{ backgroundColor: PREMIUM.surface, borderWidth: 1, borderColor: PREMIUM.goldBorder, borderRadius: 13, padding: 4, flexDirection: 'row' }}>
      {([
        { key: 'month' as ChartPeriod, label: 'Mês selecionado' },
        { key: 'history' as ChartPeriod, label: 'Histórico completo' },
      ]).map((item) => {
        const active = period === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={{ flex: 1, minHeight: 42, borderRadius: 9, backgroundColor: active ? PREMIUM.blue : 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}
          >
            <Text style={{ color: active ? '#FFFFFF' : PREMIUM.muted, fontSize: 13, fontWeight: active ? '800' : '600', textAlign: 'center' }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function GraficosScreen() {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano } = useMonth();
  const [period, setPeriod] = useState<ChartPeriod>('history');
  const instalacoesDoMes = filtrarPorMes(instalacoes, mes, ano);
  const periodInstallations = selectChartInstallations(instalacoesDoMes, instalacoes, period);
  const monthLabel = new Date(ano, mes, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const periodLabel = getChartPeriodLabel(period, monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1));

  const periodByType = useMemo(() => {
    const quantities: Record<ServiceType, number> = {
      Instalação: 0,
      'Tipo 3': 0,
      Mudança: 0,
      Empresarial: 0,
    };
    const values: Record<ServiceType, number> = {
      Instalação: 0,
      'Tipo 3': 0,
      Mudança: 0,
      Empresarial: 0,
    };

    periodInstallations.forEach((inst: any) => {
      const tipo = inst.tipoServico as ServiceType;
      if (!(tipo in quantities)) return;
      quantities[tipo] += 1;
      values[tipo] += calcularValorPorTipo(inst.tipoServico, periodInstallations.length, paymentMode);
    });

    return { quantities, values };
  }, [periodInstallations, paymentMode]);

  const periodTotal = useMemo(
    () => Object.values(periodByType.values).reduce((sum, value) => sum + value, 0),
    [periodByType],
  );

  const last6Months = useMemo(() => {
    const months: Array<{ label: string; month: number; year: number }> = [];
    const today = new Date();
    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
      const label = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      months.push({ label: label.charAt(0).toUpperCase() + label.slice(1), month: date.getMonth(), year: date.getFullYear() });
    }
    return months;
  }, []);

  const lineValues = useMemo(
    () => last6Months.map(({ month, year }) => instalacoes.filter((inst: any) => {
      const date = new Date(inst.data);
      return date.getMonth() === month && date.getFullYear() === year;
    }).length),
    [instalacoes, last6Months],
  );

  const pieItems = (Object.keys(SERVICE_COLORS) as ServiceType[]).map((name) => ({
    name,
    value: periodByType.values[name],
    quantity: periodByType.quantities[name],
    color: SERVICE_COLORS[name],
  }));

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 112, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: '#2A2410', borderWidth: 1, borderColor: '#5F4B12', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <IconSymbol name="chart.pie.fill" size={34} color={PREMIUM.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: PREMIUM.foreground, fontSize: 30, lineHeight: 35, fontWeight: '800' }}>Gráficos</Text>
            <Text style={{ color: PREMIUM.muted, fontSize: 16, lineHeight: 21, marginTop: 3 }}>Análise visual do seu serviço e produtividade</Text>
          </View>
        </View>

        <View>
          <PeriodSelector period={period} onChange={setPeriod} />
          <Text style={{ color: PREMIUM.muted, fontSize: 13, marginTop: 8, textAlign: 'center' }}>Exibindo: <Text style={{ color: PREMIUM.gold, fontWeight: '800' }}>{periodLabel}</Text></Text>
        </View>

        <PremiumCard accent="gold" style={{ padding: 20 }}>
          <SectionHeader icon="chart.bar.fill" title="Quantidade por Tipo" subtitle={`Instalações — ${periodLabel}`} />
          <ReferenceBarChart
            width={chartWidth}
            labels={['Instalação', 'Tipo 3', 'Mudança', 'Empresarial']}
            values={[periodByType.quantities.Instalação, periodByType.quantities['Tipo 3'], periodByType.quantities.Mudança, periodByType.quantities.Empresarial]}
          />
        </PremiumCard>

        <PremiumCard accent="blue" style={{ padding: 20 }}>
          <SectionHeader icon="chart.pie.fill" title="Distribuição de Faturamento" subtitle={`Proporção por tipo — ${periodLabel}`} />
          <ReferenceSemiDonut items={pieItems} total={periodTotal} width={chartWidth} />
        </PremiumCard>

        <PremiumCard accent="blue" style={{ padding: 20 }}>
          <SectionHeader icon="chart.line.uptrend.xyaxis" title="Tendência - Últimos 6 Meses" subtitle="Instalações realizadas por mês — histórico" />
          <ReferenceLineChart width={chartWidth} labels={last6Months.map((month) => month.label)} values={lineValues} />
        </PremiumCard>

        <PremiumCard accent="blue" style={{ padding: 20 }}>
          <SectionHeader icon="calendar" title="Resumo" subtitle={`Visão consolidada — ${periodLabel}`} />
          <View style={{ borderTopWidth: 1, borderTopColor: PREMIUM.divider }}>
            <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: PREMIUM.divider }}>
              <Text style={{ flex: 1, color: PREMIUM.muted, fontSize: 16 }}>Total de Instalações</Text>
              <Text style={{ color: PREMIUM.foreground, fontSize: 19, fontWeight: '800' }}>{periodInstallations.length}</Text>
            </View>
            <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, color: PREMIUM.muted, fontSize: 16 }}>Faturamento Total</Text>
              <Text style={{ color: PREMIUM.blue, fontSize: 18, fontWeight: '800' }}>
                R$ {periodTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </PremiumCard>
      </ScrollView>
    </ScreenContainer>
  );
}
