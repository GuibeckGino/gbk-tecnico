import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

interface InteractivePieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
  }>;
  chartConfig: any;
  quantities: { [key: string]: number };
  colors: any;
}

export function InteractivePieChart({
  data,
  chartConfig,
  quantities,
  colors,
}: InteractivePieChartProps) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    name: string;
    value: number;
    quantity: number;
    percentage: number;
  } | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const handlePiePress = (name: string) => {
    const item = data.find((d) => d.name === name);
    if (item) {
      const percentage = ((item.value / totalValue) * 100).toFixed(1);
      setTooltip({
        visible: true,
        name,
        value: item.value,
        quantity: quantities[name] || 0,
        percentage: parseFloat(percentage),
      });
    }
  };

  return (
    <View style={{ position: 'relative', alignItems: 'center' }}>
      <PieChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="0"
        center={[screenWidth / 2 - 40, 110]}
        absolute
      />

      {/* Botões interativos para cada fatia */}
      <View
        style={{
          position: 'absolute',
          width: screenWidth - 40,
          height: 220,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {data.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handlePiePress(item.name)}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View />
          </TouchableOpacity>
        ))}
      </View>

      {/* Tooltip */}
      {tooltip?.visible && (
        <View
          style={{
            position: 'absolute',
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            zIndex: 1000,
            minWidth: 200,
            top: 20,
            right: 20,
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 4 }}>
            {tooltip.name}
          </Text>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
            R$ {tooltip.value.toFixed(2)}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
            {tooltip.quantity} instalação{tooltip.quantity !== 1 ? 's' : ''}
          </Text>
          <Text style={{ color: colors.warning, fontSize: 12, marginBottom: 8 }}>
            {tooltip.percentage}% do total
          </Text>
          <TouchableOpacity
            onPress={() => setTooltip(null)}
            style={{ padding: 4 }}
          >
            <Text style={{ color: colors.primary, fontSize: 12, textAlign: 'center' }}>
              Fechar
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
