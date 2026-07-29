import React, { useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface InteractiveLineChartProps {
  data: {
    labels: string[];
    datasets: Array<{ data: number[] }>;
  };
  chartConfig: any;
  colors: any;
}

export function InteractiveLineChart({
  data,
  chartConfig,
  colors,
}: InteractiveLineChartProps) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    label: string;
    value: number;
    index: number;
  } | null>(null);

  const screenWidth = Dimensions.get('window').width;

  const handleDataPointPress = (index: number) => {
    setTooltip({
      visible: true,
      label: data.labels[index],
      value: data.datasets[0].data[index],
      index,
    });
  };

  return (
    <View style={{ position: 'relative' }}>
      <LineChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
        yAxisLabel=""
        yAxisSuffix=""
      />

      {/* Camada interativa */}
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
            onPress={() => handleDataPointPress(index)}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'transparent',
              }}
            />
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
            minWidth: 160,
            top: 10,
            left: Math.max(10, tooltip.index * ((screenWidth - 60) / data.labels.length) - 70),
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: '600', marginBottom: 4 }}>
            {tooltip.label}
          </Text>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            {tooltip.value} instalações
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
