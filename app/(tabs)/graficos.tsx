import React, { useMemo } from 'react';
import { View, Text, ScrollView, Dimensions, Image } from 'react-native';
import { BarChart, PieChart, LineChart } from 'react-native-chart-kit';
import { ScreenContainer } from '@/components/screen-container';
import { useInstallations } from '@/context/InstallationsContext';
import { useMonth } from '@/context/MonthContext';
import { useColors } from '@/hooks/use-colors';
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
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
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
        {/* Logo Header */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 60, height: 60, borderRadius: 12 }}
          />
        </View>

        {/* Título */}
        <View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
            Gráficos
          </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
              Análise visual do faturamento e produtividade
            </Text>
        </View>

        {/* Gráfico de Barras */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
            Quantidade por Tipo
          </Text>
          <BarChart
            data={barChartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>

        {/* Gráfico de Pizza */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
            Distribuição de Faturamento
          </Text>
          {pieChartData.some((d) => d.value > 0) ? (
            <PieChart
              data={pieChartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[screenWidth / 4, 0]}
            />
          ) : (
            <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 40 }}>
              Sem dados para exibir
            </Text>
          )}
        </View>

        {/* Gráfico de Linha */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
            Tendência - Últimos 6 Meses
          </Text>
          <LineChart
            data={lineChartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>

        {/* Resumo */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
            Resumo
          </Text>
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
