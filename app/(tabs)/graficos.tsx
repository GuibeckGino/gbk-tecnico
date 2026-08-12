import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { InteractiveBarChart } from '@/components/interactive-bar-chart';
import { InteractivePieChart } from '@/components/interactive-pie-chart';
import { InteractiveLineChart } from '@/components/interactive-line-chart';
import { ScreenContainer } from '@/components/screen-container';
import { useInstallations } from '@/context/InstallationsContext';
import { useMonth } from '@/context/MonthContext';
import { useColors } from '@/hooks/use-colors';
import { PREMIUM } from '@/components/premium-ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { calcularValorPorTipo } from '@/types/installation';
import { filtrarPorMes } from '@/context/MonthContext';

const screenWidth = Dimensions.get('window').width;

export default function GraficosScreen() {
  const { instalacoes, paymentMode } = useInstallations();
  const { mes, ano } = useMonth();
  const colors = useColors();

  // Filtrar instalações do mês selecionado
  const instalacoesDoMes = filtrarPorMes(instalacoes, mes, ano);

  // Calcular dados por tipo (apenas do mês para gráficos)
  const dataByType = useMemo(() => {
    const types = {
      'Instalação': 0,
      'Tipo 3': 0,
      'Mudança': 0,
      'Empresarial': 0,
    };

    const valueByType = {
      'Instalação': 0,
      'Tipo 3': 0,
      'Mudança': 0,
      'Empresarial': 0,
    };

    instalacoesDoMes.forEach((inst: any) => {
      const tipo = inst.tipoServico as keyof typeof types;
      types[tipo] = (types[tipo] || 0) + 1;
      
      const value = calcularValorPorTipo(inst.tipoServico, instalacoesDoMes.length, paymentMode);
      valueByType[tipo] = (valueByType[tipo] || 0) + value;
    });

    return { types, valueByType };
  }, [instalacoesDoMes, paymentMode]);

  // Calcular faturamento total do histórico completo
  const faturamentoTotal = useMemo(() => {
    const valueByType = {
      'Instalação': 0,
      'Tipo 3': 0,
      'Mudança': 0,
      'Empresarial': 0,
    };

    instalacoes.forEach((inst: any) => {
      const tipo = inst.tipoServico as keyof typeof valueByType;
      const value = calcularValorPorTipo(inst.tipoServico, instalacoes.length, paymentMode);
      valueByType[tipo] = (valueByType[tipo] || 0) + value;
    });

    return Object.values(valueByType).reduce((a: number, b: number) => a + b, 0);
  }, [instalacoes, paymentMode]);

  // Dados para gráfico de barras (quantidade)
  const barChartData = {
    labels: ['Inst.', 'Tipo 3', 'Mudança', 'Emp.'],
    datasets: [
      {
        data: [
          dataByType.types['Instalação'] || 0,
          dataByType.types['Tipo 3'] || 0,
          dataByType.types['Mudança'] || 0,
          dataByType.types['Empresarial'] || 0,
        ],
      },
    ],
  };

  // Dados para gráfico de pizza (faturamento)
  const pieChartData = [
    {
      name: 'Instalação',
      value: dataByType.valueByType['Instalação'] || 0,
      color: '#0a7ea4',
      legendFontColor: colors.foreground,
      legendFontSize: 12,
    },
    {
      name: 'Tipo 3',
      value: dataByType.valueByType['Tipo 3'] || 0,
      color: '#0d47a1',
      legendFontColor: colors.foreground,
      legendFontSize: 12,
    },
    {
      name: 'Mudança',
      value: dataByType.valueByType['Mudança'] || 0,
      color: '#1565c0',
      legendFontColor: colors.foreground,
      legendFontSize: 12,
    },
    {
      name: 'Empresarial',
      value: dataByType.valueByType['Empresarial'] || 0,
      color: '#ff9800',
      legendFontColor: colors.foreground,
      legendFontSize: 12,
    },
  ];

  // Dados para gráfico de linha (últimos 6 meses)
  const last6Months = useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        month: date.toLocaleString('pt-BR', { month: 'short' }),
        year: date.getFullYear(),
        monthNum: date.getMonth(),
        yearNum: date.getFullYear(),
      });
    }
    return months;
  }, []);

  const lineChartData = useMemo(() => {
    const values = last6Months.map((m: any) => {
      const monthInstallations = instalacoes.filter((inst: any) => {
        const date = new Date(inst.data);
        return date.getMonth() === m.monthNum && date.getFullYear() === m.yearNum;
      });
      return monthInstallations.length;
    });

    return {
      labels: last6Months.map((m: any) => m.month),
      datasets: [
        {
          data: values.length > 0 ? values : [0],
        },
      ],
    };
  }, [instalacoes, last6Months]);

  const chartConfig = {
    backgroundColor: PREMIUM.surface,
    backgroundGradientFrom: PREMIUM.surface,
    backgroundGradientTo: PREMIUM.surface,
    color: () => colors.primary,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    formatYLabel: (yLabel: string) => yLabel,
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <View style={{ width: 58, height: 58, borderRadius: 16, backgroundColor: '#2A2410', borderWidth: 1, borderColor: '#5F4B12', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
            <IconSymbol name="chart.pie.fill" size={32} color={PREMIUM.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: PREMIUM.foreground, fontSize: 29, lineHeight: 34, fontWeight: '800' }}>Gráficos</Text>
            <Text style={{ color: PREMIUM.muted, fontSize: 16, marginTop: 3 }}>Análise visual do seu serviço e produtividade</Text>
          </View>
        </View>

        {/* Gráfico de Barras Interativo */}
        <View style={{ backgroundColor: PREMIUM.surface, borderColor: PREMIUM.goldBorder, borderWidth: 1, borderRadius: 17, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#0B2A70', borderWidth: 1, borderColor: PREMIUM.blue, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <IconSymbol name="chart.bar.fill" size={26} color={PREMIUM.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.foreground }}>Quantidade por Tipo</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>Instalações por tipo de serviço</Text>
            </View>
          </View>
          <InteractiveBarChart
            data={barChartData}
            chartConfig={chartConfig}
            quantities={[
              dataByType.types['Instalação'] || 0,
              dataByType.types['Tipo 3'] || 0,
              dataByType.types['Mudança'] || 0,
              dataByType.types['Empresarial'] || 0,
            ]}
            colors={colors}
          />
        </View>

        {/* Gráfico de Pizza Interativo */}
        <View style={{ backgroundColor: PREMIUM.surface, borderColor: PREMIUM.goldBorder, borderWidth: 1, borderRadius: 17, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#0B2A70', borderWidth: 1, borderColor: PREMIUM.blue, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <IconSymbol name="chart.pie.fill" size={26} color={PREMIUM.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.foreground }}>Distribuição de Faturamento</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>Proporção do faturamento por tipo de serviço</Text>
            </View>
          </View>
          {pieChartData.some((d) => d.value > 0) ? (
            <InteractivePieChart
              data={pieChartData}
              chartConfig={chartConfig}
              quantities={dataByType.types}
              colors={colors}
            />
          ) : (
            <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 40 }}>
              Sem dados para exibir
            </Text>
          )}
        </View>

        {/* Gráfico de Linha Interativo */}
        <View style={{ backgroundColor: PREMIUM.surface, borderColor: PREMIUM.goldBorder, borderWidth: 1, borderRadius: 17, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#0B2A70', borderWidth: 1, borderColor: PREMIUM.blue, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <IconSymbol name="chart.line.uptrend.xyaxis" size={26} color={PREMIUM.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.foreground }}>Tendência - Últimos 6 Meses</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>Instalações realizadas por mês</Text>
            </View>
          </View>
          <InteractiveLineChart
            data={lineChartData}
            chartConfig={chartConfig}
            colors={colors}
          />
        </View>

        {/* Resumo */}
        <View style={{ backgroundColor: PREMIUM.surface, borderColor: PREMIUM.goldBorder, borderWidth: 1, borderRadius: 17, padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#0B2A70', borderWidth: 1, borderColor: PREMIUM.blue, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <IconSymbol name="calendar" size={26} color={PREMIUM.blue} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.foreground }}>Resumo</Text>
          </View>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.muted }}>Total de Instalações:</Text>
              <Text style={{ fontWeight: '600', color: colors.foreground }}>
                {instalacoes.length}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.muted }}>Faturamento Total:</Text>
              <Text style={{ fontWeight: '600', color: colors.primary }}>
                R$ {faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
