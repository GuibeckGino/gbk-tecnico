import React, { useState } from 'react';
import { View, Text, Dimensions, GestureResponderEvent, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

interface InteractiveBarChartProps {
  data: {
    labels: string[];
    datasets: Array<{ data: number[] }>;
  };
  chartConfig: any;
  quantities: number[];
  colors: any;
}

export function InteractiveBarChart({
  data,
  chartConfig,
  quantities,
  colors,
}: InteractiveBarChartProps) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    label: string;
    value: number;
    quantity: number;
  } | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const barWidth = (screenWidth - 80) / data.labels.length;

  const handlePress = (event: GestureResponderEvent, index: number) => {
    const { pageX, pageY } = event.nativeEvent;
    setTooltip({
      visible: true,
      x: pageX,
      y: pageY,
      label: data.labels[index],
      value: data.datasets[0].data[index],
      quantity: quantities[index],
    });
  };

  return (
    <View style={{ position: 'relative' }}>
      <BarChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        yAxisLabel=""
        yAxisSuffix=""
      />

      {/* Camada interativa invisível */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 20,
          width: screenWidth - 40,
          height: 220,
          flexDirection: 'row',
        }}
      >
        {data.labels.map((label, index) => (
          <TouchableOpacity
            key={index}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={(e) => handlePress(e, index)}
          >
            <View style={{ width: '100%', height: '100%' }} />
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
            minWidth: 180,
            top: tooltip.y - 100,
            left: Math.max(10, Math.min(tooltip.x - 90, screenWidth - 200)),
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 4 }}>
            {tooltip.label}
          </Text>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
            R$ {tooltip.value.toFixed(2)}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {tooltip.quantity} instalação{tooltip.quantity !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            onPress={() => setTooltip(null)}
            style={{ marginTop: 8, padding: 4 }}
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
